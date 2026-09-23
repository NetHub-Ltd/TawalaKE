import hashlib
import json
import os
import uuid
import secrets
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Dict, Any, List, Union, Tuple

from fastapi import HTTPException, status, Depends
from fastapi.security import SecurityScopes, OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from redis.asyncio import Redis as AsyncRedis
from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.models import Staff, StaffRole
from app.core.config import settings
from app.utils.helpers import utc_now
from app.utils.logging import logger


# ========================= ENUMS & SCOPES MAP =========================
# Single source of truth for roles: models.StaffRole

# Legacy JWT scopes — kept for tokens that still carry scopes.
# Runtime AuthZ uses app.core.rbac.Permission (require_permissions).
ROLE_SCOPES: Dict[StaffRole, List[str]] = {
    StaffRole.OWNER: [
        "org:admin",
        "business:read", "business:write", "business:delete",
        "staff:read", "staff:write", "staff:delete",
        "products:read", "products:write", "products:delete",
        "sales:read", "sales:write", "sales:void",
        "stock:read", "stock:write", "stock:adjust",
        "reports:read",
    ],
    StaffRole.ADMIN: [
        "business:read", "business:write",
        "staff:read", "staff:write",
        "products:read", "products:write", "products:delete",
        "sales:read", "sales:write",
        "stock:read", "stock:write", "stock:adjust",
        "reports:read",
    ],
    StaffRole.MANAGER: [
        "business:read", "business:write",
        "staff:read",
        "products:read", "products:write",
        "sales:read", "sales:write",
        "stock:read", "stock:write", "stock:adjust",
        "reports:read",
    ],
    StaffRole.CASHIER: [
        "products:read",
        "sales:read", "sales:write",
        "stock:read",
    ],
}


def _resolve_role(role_str: str) -> Optional[StaffRole]:
    try:
        return StaffRole(str(role_str).strip().upper())
    except ValueError:
        return None


# OAuth2 Scheme declaration for FastAPI Swagger UI compatibility.
# auto_error=False lets us raise our own consistent HTTPException.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    scheme_name="OAuth2PasswordBearer",
    description="Email + Password Login",
    auto_error=False,
)


# ========================= DATA SCHEMAS =========================
class Token(BaseModel):
    """Response model returned by login and refresh endpoints."""

    access_token: str
    refresh_token: Optional[str] = None
    id_token: Optional[str] = None
    token_type: str = "bearer"


class TokenData(BaseModel):
    """
    Strongly-typed representation of the claims inside a verified JWT.
    All fields that can appear in the payload are declared here so that
    TokenData(**payload) is safe and IDE-friendly.

    Tenant staff tokens carry organization_id.
    Platform tokens set kind="platform" and omit organization_id.
    """

    sub: str
    organization_id: Optional[str] = None
    business_id: Optional[str] = None
    role: str
    jti: str
    iss: str
    aud: str
    exp: int
    iat: int
    type: str = "access"
    scopes: List[str] = Field(default_factory=list)
    kind: str = "staff"  # "staff" | "platform"


# ========================= SECURITY SERVICE CLASS =========================
class SecurityService:
    """
    Central security helper responsible for:
    - Password / PIN hashing (Argon2)
    - JWT creation, verification and rotation
    - Opaque password-reset tokens stored in Redis
    - Fine-grained scope-based authorization
    """

    def __init__(self) -> None:
        # Argon2 is the recommended modern password hashing algorithm.
        self.pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

    # ------------------------------------------------------------------
    # 1. HASHING & PASSWORDS
    # ------------------------------------------------------------------
    def hash_password(self, password: str) -> str:
        """Hashes a plain-text password using Argon2."""
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verifies a plain-text password against an Argon2 hash."""
        return self.pwd_context.verify(plain_password, hashed_password)

    def generate_pin_salt(self) -> str:
        """Generates a cryptographic 16-byte hex salt for PIN hashing."""
        return secrets.token_hex(16)

    def hash_pin(self, pin: str, salt: str) -> str:
        """
        Hashes a 4-digit PIN combined with a unique salt.
        Raises ValueError if the PIN is not exactly 4 digits.
        """
        if not pin.isdigit() or len(pin) != 4:
            raise ValueError("PIN must be exactly 4 digits.")
        return self.pwd_context.hash(salt + pin)

    def verify_pin(self, plain_pin: str, hashed_pin: str, salt: str) -> bool:
        """Verifies a 4-digit PIN using its unique salt."""
        if not plain_pin.isdigit() or len(plain_pin) != 4:
            return False
        return self.pwd_context.verify(salt + plain_pin, hashed_pin)

    # ------------------------------------------------------------------
    # 2. TOKEN CREATION & SCOPING
    # ------------------------------------------------------------------
    def _create_token(
        self,
        data: Dict[str, Any],
        expires_delta: timedelta,
        token_type: str,
        scopes: List[str],
    ) -> str:
        """
        Private helper that encodes a JWT payload with standard claims.

        - Always stores exp / iat as integer Unix timestamps (avoids jose datetime quirks).
        - Drops any claim whose value is None so the JWT never contains explicit nulls.
        - Adds a fresh jti for replay protection / blacklisting.
        """
        to_encode = data.copy()
        now = utc_now()
        expire = now + expires_delta

        to_encode.update(
            {
                "exp": int(expire.timestamp()),
                "iat": int(now.timestamp()),
                "iss": settings.issuer,
                "aud": settings.audience,
                "type": token_type,
                "jti": str(uuid.uuid4()),
                "scopes": scopes,
            }
        )
        # Remove None values – cleaner JWT and avoids downstream null-handling issues
        to_encode = {k: v for k, v in to_encode.items() if v is not None}

        return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

    def create_tokens(
        self,
        user_data: Dict[str, Any],
        business_id: Optional[str] = None,
    ) -> Token:
        """
        Creates a full token set (access + refresh + id) for a user session.

        Scopes are derived from ROLE_SCOPES using the staff role.
        An unrecognized role results in an empty scope list (and a warning log).
        """
        role_str = str(user_data["role"]).strip().upper()
        role_enum = _resolve_role(role_str)
        scopes = ROLE_SCOPES.get(role_enum, []) if role_enum is not None else []

        if not scopes:
            logger.warning(
                f"No scopes resolved for role '{role_str}' – issued tokens will be useless"
            )

        base_claims: Dict[str, Any] = {
            "sub": str(user_data["sub"]),
            "organization_id": str(user_data["organization_id"]),
            "role": role_str,
        }
        # Only include business_id when it is actually present
        if business_id:
            base_claims["business_id"] = str(business_id)

        access_token = self._create_token(
            base_claims,
            timedelta(minutes=settings.access_token_expire_minutes),
            "access",
            scopes,
        )
        refresh_token = self._create_token(
            base_claims,
            timedelta(days=settings.refresh_token_expire_days),
            "refresh",
            scopes,
        )
        id_token = self._create_token(
            base_claims,
            timedelta(minutes=settings.access_token_expire_minutes),
            "id",
            scopes,
        )

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            id_token=id_token,
        )

    def create_platform_access_token(
        self,
        *,
        user_id: str,
        role: str,
        scopes: Optional[List[str]] = None,
    ) -> str:
        """
        Issue a short-lived access token for a PlatformUser.

        Claims: kind=platform, no organization_id. Tenant APIs that require
        organization_id must reject these tokens.
        """
        base_claims: Dict[str, Any] = {
            "sub": str(user_id),
            "role": str(role).strip().upper(),
            "kind": "platform",
        }
        return self._create_token(
            base_claims,
            timedelta(minutes=settings.access_token_expire_minutes),
            "access",
            scopes or [],
        )


    # ------------------------------------------------------------------
    # 3. VERIFICATION & REPLAY PROTECTION (REDIS)
    # ------------------------------------------------------------------
    async def verify_token(
        self,
        token: str,
        expected_type: str = "access",
        redis_client: Optional[AsyncRedis] = None,
    ) -> TokenData:
        """
        Verifies signature, expiration, audience, issuer and token type.

        When an AsyncRedis client is supplied, also checks the JTI blacklist
        to prevent replay of revoked tokens.
        """
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=[settings.algorithm],
                audience=settings.audience,
                issuer=settings.issuer,
                options={"verify_signature": True},
            )

            if payload.get("type") != expected_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token type. Expected '{expected_type}'",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            token_data = TokenData(**payload)

            # Replay-attack / revocation check
            if redis_client is not None and token_data.jti:
                is_blacklisted = await redis_client.get(f"auth:blacklist:{token_data.jti}")
                if is_blacklisted:
                    logger.warning(f"🚨 Revoked/Replayed token detected: JTI {token_data.jti}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has been revoked or already used.",
                        headers={"WWW-Authenticate": "Bearer"},
                    )

            return token_data

        except jwt.ExpiredSignatureError:
            logger.info("JWT verification failed: Token has expired")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except JWTError as e:
            logger.info(f"JWT verification failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    async def authenticate(
        self,
        email: EmailStr,
        password: str,
        db: AsyncSession,
    ) -> Token:
        """
        Authenticates active staff credentials and returns a fresh token set.
        """
        stmt = (
            select(Staff)
            .where(
                Staff.email == email.lower().strip(),
                Staff.active == True,  # noqa: E712
            )
            .options(selectinload(Staff.assigned_businesses))
        )
        staff = (await db.exec(stmt)).first()

        if (
            not staff
            or not staff.hashed_password
            or not self.verify_password(password, staff.hashed_password)
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Resolve primary assigned business ID (transitional – may be None)
        assigned_business_id: Optional[str] = None
        if staff.assigned_businesses:
            assigned_business_id = str(staff.assigned_businesses[0].id)

        role_value = staff.role.value if hasattr(staff.role, "value") else str(staff.role)

        org_id = staff.organization_id or staff.tenant_id
        if org_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Staff account is not linked to an organization",
            )

        user_data = {
            "sub": str(staff.id),
            "organization_id": str(org_id),
            "role": role_value,
        }

        return self.create_tokens(user_data, business_id=assigned_business_id)

    async def rotate_refresh_token(
        self,
        old_refresh_token: str,
        redis_client: AsyncRedis,
        db: Optional[AsyncSession] = None,
    ) -> Token:
        """
        Safely rotates a refresh token:
        1. Verifies the old token (including blacklist check).
        2. Blacklists the old JTI for its remaining lifetime.
        3. Reloads staff from DB when session provided (active + current role/org).
        4. Issues a completely new token set (new JTIs).
        """
        if redis_client is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Redis client is required for secure token rotation",
            )

        token_data = await self.verify_token(
            old_refresh_token, expected_type="refresh", redis_client=redis_client
        )
        logger.info(
            f"Rotating refresh token for staff {token_data.sub}, JTI: {token_data.jti}"
        )

        now_ts = int(utc_now().timestamp())
        ttl_remaining = max(0, token_data.exp - now_ts)

        if ttl_remaining > 0:
            await redis_client.set(
                f"auth:blacklist:{token_data.jti}",
                "revoked",
                ex=ttl_remaining,
            )
        else:
            logger.warning(
                f"Refresh token already expired (JTI {token_data.jti}) – skipping blacklist"
            )

        business_id = token_data.business_id
        if db is not None:
            stmt = (
                select(Staff)
                .where(Staff.id == token_data.sub)
                .options(selectinload(Staff.assigned_businesses))
            )
            staff = (await db.exec(stmt)).first()
            if not staff or not staff.active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found or account is inactive",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            org_id = staff.organization_id or staff.tenant_id
            if org_id is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Staff account is not linked to an organization",
                )
            role_value = staff.role.value if hasattr(staff.role, "value") else str(staff.role)
            user_data = {
                "sub": str(staff.id),
                "organization_id": str(org_id),
                "role": role_value,
            }
            if staff.assigned_businesses:
                business_id = str(staff.assigned_businesses[0].id)
            else:
                business_id = None
        else:
            user_data = {
                "sub": token_data.sub,
                "organization_id": token_data.organization_id,
                "role": token_data.role,
            }

        logger.info(f"Issuing new token set for staff {user_data['sub']}")
        return self.create_tokens(user_data, business_id=business_id)

    # ------------------------------------------------------------------
    # 4. OPAQUE PASSWORD RESET TOKENS (REDIS)
    # ------------------------------------------------------------------
    async def create_password_reset_token(
        self,
        staff_id: Union[str, uuid.UUID],
        redis_client: AsyncRedis,
        expire_minutes: int = 15,
    ) -> str:
        """
        Generates a high-entropy opaque reset token stored in Redis with a
        strict TTL. Returns the plain token string that should be emailed.
        """
        reset_token = secrets.token_urlsafe(32)
        redis_key = f"auth:reset:{reset_token}"
        logger.info(f"Created password-reset key: {redis_key}")
        await redis_client.set(
            redis_key,
            str(staff_id),
            ex=expire_minutes * 60,
        )
        return reset_token

    async def verify_and_consume_password_reset_token(
        self,
        reset_token: str,
        redis_client: AsyncRedis,
    ) -> str:
        """
        Validates and immediately deletes a password-reset token (single-use).
        Returns the associated staff_id string.
        """
        redis_key = f"auth:reset:{reset_token}"
        staff_id_bytes = await redis_client.get(redis_key)

        if not staff_id_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token.",
            )

        # redis-py may return bytes or str depending on decode_responses setting
        staff_id = (
            staff_id_bytes.decode("utf-8")
            if isinstance(staff_id_bytes, bytes)
            else str(staff_id_bytes)
        )

        # Enforce single-use by immediate deletion
        await redis_client.delete(redis_key)
        return staff_id

    # ------------------------------------------------------------------
    # 5. STAFF INVITE TOKENS (REDIS)
    # Single-use. Only ORG_STAFF_MANAGE holders can resend after expiry.
    # ------------------------------------------------------------------
    STAFF_INVITE_TTL_MINUTES = 48 * 60  # 48 hours

    async def create_staff_invite_token(
        self,
        staff_id: Union[str, uuid.UUID],
        redis_client: AsyncRedis,
        expire_minutes: int | None = None,
    ) -> str:
        """Opaque invite token; invalidates any prior unused token for this staff."""
        ttl = expire_minutes if expire_minutes is not None else self.STAFF_INVITE_TTL_MINUTES
        sid = str(staff_id)
        by_staff_key = f"auth:staff_invite_by_staff:{sid}"
        old = await redis_client.get(by_staff_key)
        if old:
            old_token = old.decode("utf-8") if isinstance(old, bytes) else str(old)
            await redis_client.delete(f"auth:staff_invite:{old_token}")
        token = secrets.token_urlsafe(32)
        await redis_client.set(f"auth:staff_invite:{token}", sid, ex=ttl * 60)
        await redis_client.set(by_staff_key, token, ex=ttl * 60)
        logger.info(f"Created staff-invite token for staff {sid} (ttl={ttl}m)")
        return token

    async def verify_and_consume_staff_invite_token(
        self,
        invite_token: str,
        redis_client: AsyncRedis,
    ) -> str:
        """Validate and consume invite token. Returns staff_id string."""
        redis_key = f"auth:staff_invite:{invite_token}"
        staff_id_bytes = await redis_client.get(redis_key)
        if not staff_id_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid or expired invite link. "
                    "Ask a team manager to resend the invite."
                ),
            )
        staff_id = (
            staff_id_bytes.decode("utf-8")
            if isinstance(staff_id_bytes, bytes)
            else str(staff_id_bytes)
        )
        await redis_client.delete(redis_key)
        await redis_client.delete(f"auth:staff_invite_by_staff:{staff_id}")
        return staff_id

    # ------------------------------------------------------------------
    # 6. PLATFORM LOGIN MFA (email code) — issue #298
    # Password success creates a challenge; access token only after verify.
    # ------------------------------------------------------------------

    def _platform_mfa_code_hash(self, code: str) -> str:
        """HMAC-ish hash of MFA code with app secret (not reversible)."""
        material = f"{settings.secret_key}:platform-mfa:{code}".encode("utf-8")
        return hashlib.sha256(material).hexdigest()

    def generate_platform_mfa_code(self) -> str:
        """Six-digit numeric code for email MFA."""
        return f"{secrets.randbelow(1_000_000):06d}"

    async def create_platform_mfa_challenge(
        self,
        *,
        user_id: Union[str, uuid.UUID],
        email: str,
        redis_client: AsyncRedis,
    ) -> Tuple[str, str, int]:
        """
        Create a one-time MFA challenge in Redis.

        Returns (challenge_id, plain_code, expires_in_seconds).
        Invalidates any prior challenge for the same user.
        """
        uid = str(user_id)
        ttl = int(getattr(settings, "platform_mfa_code_ttl_sec", 600) or 600)
        by_user_key = f"platform:mfa:user:{uid}"
        old = await redis_client.get(by_user_key)
        if old:
            old_id = old.decode("utf-8") if isinstance(old, bytes) else str(old)
            await redis_client.delete(f"platform:mfa:challenge:{old_id}")

        challenge_id = secrets.token_urlsafe(24)
        plain_code = self.generate_platform_mfa_code()
        payload = {
            "user_id": uid,
            "email": email.strip().lower(),
            "code_hash": self._platform_mfa_code_hash(plain_code),
            "attempts": 0,
        }
        await redis_client.set(
            f"platform:mfa:challenge:{challenge_id}",
            json.dumps(payload),
            ex=ttl,
        )
        await redis_client.set(by_user_key, challenge_id, ex=ttl)
        # Resend cooldown marker (set on create so immediate double-submit is limited)
        await redis_client.set(
            f"platform:mfa:resend:{uid}",
            "1",
            ex=int(getattr(settings, "platform_mfa_resend_cooldown_sec", 60) or 60),
        )
        logger.info(f"Platform MFA challenge created user={uid} ttl={ttl}s")
        return challenge_id, plain_code, ttl

    async def platform_mfa_resend_allowed(
        self,
        user_id: Union[str, uuid.UUID],
        redis_client: AsyncRedis,
    ) -> bool:
        """False while resend cooldown key exists."""
        val = await redis_client.get(f"platform:mfa:resend:{str(user_id)}")
        return val is None

    async def verify_platform_mfa_challenge(
        self,
        *,
        challenge_id: str,
        code: str,
        redis_client: AsyncRedis,
    ) -> str:
        """
        Validate MFA code and consume the challenge (single-use on success).

        Returns platform user_id string.
        Raises HTTPException on invalid/expired/locked challenges.
        """
        redis_key = f"platform:mfa:challenge:{challenge_id.strip()}"
        raw = await redis_client.get(redis_key)
        if not raw:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "MFA_CHALLENGE_INVALID",
                    "message": "Invalid or expired verification code. Sign in again.",
                },
            )
        data = json.loads(raw.decode("utf-8") if isinstance(raw, bytes) else raw)
        max_attempts = int(getattr(settings, "platform_mfa_max_attempts", 5) or 5)
        attempts = int(data.get("attempts") or 0)
        if attempts >= max_attempts:
            await redis_client.delete(redis_key)
            await redis_client.delete(f"platform:mfa:user:{data.get('user_id')}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "MFA_LOCKED",
                    "message": "Too many incorrect codes. Sign in again to get a new code.",
                },
            )

        expected = data.get("code_hash") or ""
        provided = self._platform_mfa_code_hash(code.strip())
        if not secrets.compare_digest(expected, provided):
            data["attempts"] = attempts + 1
            ttl = await redis_client.ttl(redis_key)
            if ttl is None or ttl < 1:
                ttl = int(getattr(settings, "platform_mfa_code_ttl_sec", 600) or 600)
            await redis_client.set(redis_key, json.dumps(data), ex=int(ttl))
            remaining = max_attempts - data["attempts"]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "MFA_CODE_INVALID",
                    "message": "Incorrect verification code.",
                    "attempts_remaining": remaining,
                },
            )

        user_id = str(data["user_id"])
        await redis_client.delete(redis_key)
        await redis_client.delete(f"platform:mfa:user:{user_id}")
        await redis_client.delete(f"platform:mfa:resend:{user_id}")
        return user_id


# Global thread-safe instance used throughout the application
security = SecurityService()


# ------------------------------------------------------------------
# 5. FASTAPI AUTHORIZATION SCOPE GUARD FACTORY
# ------------------------------------------------------------------
def require_scopes(required_scopes: List[str]):
    """
    Dependency factory that protects route handlers with fine-grained scopes.

    - Verifies the Bearer token (signature, expiry, type, blacklist).
    - Ensures the token contains every scope listed in `required_scopes`
      plus any scopes declared via FastAPI's SecurityScopes.
    - Expects a Redis client to be injectable via Depends(get_redis).
      Adjust the Depends(...) line if your Redis dependency has a different name.
    """

    async def scope_checker(
        security_scopes: SecurityScopes,
        token: str = Depends(oauth2_scheme),
        # IMPORTANT: replace `get_redis` with your actual Redis dependency
        redis_client: AsyncRedis = Depends(get_redis),  # type: ignore[name-defined]
    ) -> TokenData:
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication credentials were not provided.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token_data = await security.verify_token(
            token,
            expected_type="access",
            redis_client=redis_client,
        )

        # Union of factory-supplied scopes and any scopes declared on the route
        all_required = set(required_scopes).union(set(security_scopes.scopes))

        for required_scope in all_required:
            if required_scope not in token_data.scopes:
                logger.warning(
                    f"Forbidden access attempt by staff {token_data.sub}. "
                    f"Missing scope: {required_scope}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Missing scope: '{required_scope}'",
                )

        return token_data

    return scope_checker