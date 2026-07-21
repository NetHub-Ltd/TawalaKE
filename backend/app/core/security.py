
# import os
# import uuid
# import secrets
# from datetime import datetime, timedelta
# from enum import Enum
# from typing import Optional, Dict, Any, List, Union

# from alembic.migration import select
# from fastapi import security
# from jose import JWTError, jwt
# from passlib.context import CryptContext
# from pydantic import BaseModel, EmailStr, Field
# from fastapi import HTTPException, status, Depends
# from fastapi.security import SecurityScopes, OAuth2PasswordBearer
# from redis.asyncio import Redis as AsyncRedis
# from sqlalchemy.orm import selectinload
# from sqlmodel import select
# from app.models.models import Staff
# from sqlmodel.ext.asyncio.session import AsyncSession

# from app.core.config import settings
# from app.utils.helpers import utc_now
# from app.utils.logging import logger


# # ========================= ENUMS & SCOPES MAP =========================
# class StaffRole(str, Enum):
#     OWNER = "owner"
#     MANAGER = "manager"
#     CASHIER = "cashier"


# # Scope definitions for fine-grained authorization across endpoints
# ROLE_SCOPES: Dict[StaffRole, List[str]] = {
#     StaffRole.OWNER: [
#         "org:admin",
#         "business:read", "business:write", "business:delete",
#         "staff:read", "staff:write", "staff:delete",
#         "products:read", "products:write", "products:delete",
#         "sales:read", "sales:write", "sales:void",
#         "reports:read"
#     ],
#     StaffRole.MANAGER: [
#         "business:read", "business:write",
#         "staff:read",
#         "products:read", "products:write",
#         "sales:read", "sales:write",
#         "reports:read"
#     ],
#     StaffRole.CASHIER: [
#         "products:read",
#         "sales:read", "sales:write"
#     ]
# }


# # OAuth2 Scheme declaration for FastAPI Swagger UI compatibility
# oauth2_scheme = OAuth2PasswordBearer(
#     tokenUrl="/api/v1/auth/login",
#     scheme_name="OAuth2PasswordBearer",
#     description="Email + Password Login",
#     auto_error=False
# )


# # ========================= DATA SCHEMAS =========================
# class Token(BaseModel):
#     access_token: str
#     refresh_token: Optional[str] = None
#     id_token: Optional[str] = None
#     token_type: str = "bearer"


# class TokenData(BaseModel):
#     sub: str
#     organization_id: str
#     business_id: Optional[str] = None
#     role: str
#     jti: str
#     iss: str
#     aud: str
#     exp: int
#     iat: int
#     type: str = "access"
#     scopes: List[str] = []


# # ========================= SECURITY SERVICE CLASS =========================
# class SecurityService:
#     def __init__(self) -> None:
#         self.pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

#     # ------------------------------------------------------------------
#     # 1. HASHING & PASSWORDS
#     # ------------------------------------------------------------------
#     def hash_password(self, password: str) -> str:
#         """Hashes a plain text password using Argon2."""
#         return self.pwd_context.hash(password)

#     def verify_password(self, plain_password: str, hashed_password: str) -> bool:
#         """Verifies a plain text password against an Argon2 hash."""
#         return self.pwd_context.verify(plain_password, hashed_password)

#     def generate_pin_salt(self) -> str:
#         """Generates a cryptographic 16-byte hex salt for PIN hashing."""
#         return secrets.token_hex(16)

#     def hash_pin(self, pin: str, salt: str) -> str:
#         """Hashes a 4-digit PIN combined with a unique salt."""
#         if not pin.isdigit() or len(pin) != 4:
#             raise ValueError("PIN must be exactly 4 digits.")
#         return self.pwd_context.hash(salt + pin)

#     def verify_pin(self, plain_pin: str, hashed_pin: str, salt: str) -> bool:
#         """Verifies a 4-digit PIN using its unique salt."""
#         if not plain_pin.isdigit() or len(plain_pin) != 4:
#             return False
#         return self.pwd_context.verify(salt + plain_pin, hashed_pin)

#     # ------------------------------------------------------------------
#     # 2. TOKEN CREATION & SCOPING
#     # ------------------------------------------------------------------
#     def _create_token(
#         self,
#         data: Dict[str, Any],
#         expires_delta: timedelta,
#         token_type: str,
#         scopes: List[str]
#     ) -> str:
#         """Private helper to encode a JWT payload with standard claims."""
#         to_encode = data.copy()
#         now = utc_now()
#         expire = now + expires_delta

#         to_encode.update({
#             "exp": expire,
#             "iat": now,
#             "iss": settings.issuer,
#             "aud": settings.audience,
#             "type": token_type,
#             "jti": str(uuid.uuid4()),
#             "scopes": scopes
#         })
#         return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

#     def create_tokens(
#         self,
#         user_data: Dict[str, Any],
#         business_id: Optional[str] = None
#     ) -> Token:
#         """
#         Creates access, refresh, and id tokens for a user session.
#         Calculates scopes based on the user's role and maps business assignment.
#         """
#         role_str = user_data["role"]
#         try:
#             role_enum = StaffRole(role_str)
#             scopes = ROLE_SCOPES.get(role_enum, [])
#         except ValueError:
#             scopes = []

#         base_claims = {
#             "sub": str(user_data["sub"]),
#             "organization_id": str(user_data["organization_id"]),
#             "business_id": str(business_id) if business_id else None,
#             "role": role_str,
#         }

#         access_token = self._create_token(
#             base_claims,
#             timedelta(minutes=settings.access_token_expire_minutes),
#             "access",
#             scopes
#         )
#         refresh_token = self._create_token(
#             base_claims,
#             timedelta(days=settings.refresh_token_expire_days),
#             "refresh",
#             scopes
#         )
#         id_token = self._create_token(
#             base_claims,
#             timedelta(minutes=settings.access_token_expire_minutes),
#             "id",
#             scopes
#         )

#         return Token(
#             access_token=access_token,
#             refresh_token=refresh_token,
#             id_token=id_token
#         )

#     # ------------------------------------------------------------------
#     # 3. VERIFICATION & REPLAY PROTECTION (REDIS)
#     # ------------------------------------------------------------------
#     async def verify_token(
#         self,
#         token: str,
#         expected_type: str = "access",
#         redis_client: Optional[AsyncRedis] = None
#     ) -> TokenData:
#         """
#         Verifies signature, expiration, and token type.
#         If a Redis client is supplied, checks for JTI blacklisting to block replayed tokens.
#         """
#         try:
#             payload = jwt.decode(
#                 token,
#                 settings.secret_key,
#                 algorithms=[settings.algorithm],
#                 audience=settings.audience,
#                 issuer=settings.issuer,
#                 options={"verify_signature": True}
#             )

#             if payload.get("type") != expected_type:
#                 raise HTTPException(
#                     status_code=status.HTTP_401_UNAUTHORIZED,
#                     detail=f"Invalid token type. Expected '{expected_type}'",
#                     headers={"WWW-Authenticate": "Bearer"}
#                 )

#             token_data = TokenData(**payload)

#             # Replay Attack Check against Redis Blacklist
#             if redis_client is not None and token_data.jti:
#                 is_blacklisted = await redis_client.get(f"auth:blacklist:{token_data.jti}")
#                 if is_blacklisted:
#                     logger.warning(f"🚨 Revoked/Replayed token detected: JTI {token_data.jti}")
#                     raise HTTPException(
#                         status_code=status.HTTP_401_UNAUTHORIZED,
#                         detail="Token has been revoked or already used.",
#                         headers={"WWW-Authenticate": "Bearer"}
#                     )

#             return token_data

#         except jwt.ExpiredSignatureError:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Token has expired.",
#                 headers={"WWW-Authenticate": "Bearer"}
#             )
#         except jwt.JWTError as e:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail=f"Invalid authentication token: {str(e)}",
#                 headers={"WWW-Authenticate": "Bearer"}
#             )

#     # authenticate a user
#     async def authenticate(self, email: EmailStr, password: str, db: AsyncSession):
#         stmt = (select(Staff).where(
#             Staff.email == email.lower().strip(),
#             Staff.active == True
#         ).options(selectinload(Staff.assigned_businesses))
#         )
#         staff = (await db.exec(stmt)).first()

#         if not staff or not self.verify_password(password, staff.hashed_password):
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Incorrect email or password",
#                 headers={"WWW-Authenticate": "Bearer"},
#             )

            
#         # Resolve primary assigned business ID for transitional period
#         assigned_business_id = None
#         if staff.assigned_businesses:
#             assigned_business_id = str(staff.assigned_businesses[0].id)

#         user_data = {
#             "sub": str(staff.id),
#             "organization_id": str(staff.tenant_id),
#             "role": staff.role.value if hasattr(staff.role, "value") else str(staff.role),
#         }

#         tokens: Token = security.create_tokens(user_data, business_id=assigned_business_id)
#         return tokens

#     async def rotate_refresh_token(
#         self,
#         old_refresh_token: str,
#         redis_client: AsyncRedis
#     ) -> Token:
#         """
#         Rotates a refresh token safely by blacklisting the old token's JTI 
#         in Redis for its remaining TTL before issuing a new token set.
#         """
#         token_data = await self.verify_token(old_refresh_token, "refresh", redis_client)

#         # Blacklist the old refresh token JTI in Redis
#         now_ts = int(utc_now().timestamp())
#         ttl_remaining = token_data.exp - now_ts
#         if ttl_remaining > 0:
#             await redis_client.set(
#                 f"auth:blacklist:{token_data.jti}",
#                 "revoked",
#                 ex=ttl_remaining
#             )

#         user_data = {
#             "sub": token_data.sub,
#             "organization_id": token_data.organization_id,
#             "role": token_data.role,
#         }
#         return self.create_tokens(user_data, business_id=token_data.business_id)

#     # ------------------------------------------------------------------
#     # 4. OPAQUE PASSWORD RESET TOKENS (REDIS)
#     # ------------------------------------------------------------------
#     async def create_password_reset_token(
#         self,
#         staff_id: Union[str, uuid.UUID],
#         redis_client: AsyncRedis,
#         expire_minutes: int = 15
#     ) -> str:
#         """
#         Generates a high-entropy opaque reset token stored inside Redis 
#         with a strict TTL. Returns the plain token string for emailing via Resend.
#         """
#         reset_token = secrets.token_urlsafe(32)
#         redis_key = f"auth:reset:{reset_token}"
#         await redis_client.set(
#             redis_key,
#             str(staff_id),
#             ex=expire_minutes * 60
#         )
#         return reset_token

#     async def verify_and_consume_password_reset_token(
#         self,
#         reset_token: str,
#         redis_client: AsyncRedis
#     ) -> str:
#         """
#         Validates and immediately deletes a password reset token from Redis to enforce single-use.
#         Returns the associated staff_id string.
#         """
#         redis_key = f"auth:reset:{reset_token}"
#         staff_id_bytes = await redis_client.get(redis_key)

#         if not staff_id_bytes:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail="Invalid or expired password reset token."
#             )

#         # Convert bytes to string if needed
#         staff_id = staff_id_bytes.decode("utf-8") if isinstance(staff_id_bytes, bytes) else str(staff_id_bytes)
        
#         # Enforce single-use by immediate deletion
#         await redis_client.delete(redis_key)
#         return staff_id


# # Instantiate global thread-safe security service instance
# security = SecurityService()


# # ------------------------------------------------------------------
# # 5. FASTAPI AUTHORIZATION SCOPE GUARD FACTORY
# # ------------------------------------------------------------------
# def require_scopes(required_scopes: List[str]):
#     """
#     Dependency factory for protecting route handlers with fine-grained scopes.
#     Validates token presence, decodes claims, and verifies required permissions.
#     """
#     async def scope_checker(
#         security_scopes: SecurityScopes,
#         token: str = Depends(oauth2_scheme)
#     ) -> TokenData:
#         if not token:
#             raise HTTPException(
#                 status_code=status.HTTP_401_UNAUTHORIZED,
#                 detail="Authentication credentials were not provided.",
#                 headers={"WWW-Authenticate": "Bearer"}
#             )

#         # Decode token directly via service
#         token_data = await security_service.verify_token(token, expected_type="access")

#         # Verify whether token contains all scopes required by the route
#         for required_scope in required_scopes:
#             if required_scope not in token_data.scopes:
#                 logger.warning(
#                     f"Forbidden access attempt by staff {token_data.sub}. Missing scope: {required_scope}"
#                 )
#                 raise HTTPException(
#                     status_code=status.HTTP_403_FORBIDDEN,
#                     detail=f"Insufficient permissions. Missing scope: '{required_scope}'"
#                 )

#         return token_data

#     return scope_checker
import os
import uuid
import secrets
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Dict, Any, List, Union

from fastapi import HTTPException, status, Depends
from fastapi.security import SecurityScopes, OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from redis.asyncio import Redis as AsyncRedis
from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.models import Staff
from app.core.config import settings
from app.utils.helpers import utc_now
from app.utils.logging import logger


# ========================= ENUMS & SCOPES MAP =========================
class StaffRole(str, Enum):
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    CASHIER = "CASHIER"

    @classmethod
    def _missing_(cls, value: object) -> Optional["StaffRole"]:
        """Case-insensitive Enum lookup fallback for legacy or lowercased DB roles."""
        if isinstance(value, str):
            for member in cls:
                if member.value.lower() == value.lower():
                    return member
        return None


# Granular scopes mapped across Products, Sales, Stock, Staff, and Org resources
ROLE_SCOPES: Dict[StaffRole, List[str]] = {
    StaffRole.OWNER: [
        "org:admin",
        "business:read", "business:write", "business:delete",
        "staff:read", "staff:write", "staff:delete",
        # Products
        "products:read", "products:write", "products:delete",
        # Sales
        "sales:read", "sales:write", "sales:void",
        # Stock / Inventory
        "stock:read", "stock:write", "stock:adjust",
        "reports:read"
    ],
    StaffRole.MANAGER: [
        "business:read", "business:write",
        "staff:read",
        # Products
        "products:read", "products:write",
        # Sales
        "sales:read", "sales:write",
        # Stock / Inventory
        "stock:read", "stock:write", "stock:adjust",
        "reports:read"
    ],
    StaffRole.CASHIER: [
        # Products & Sales
        "products:read",
        "sales:read", "sales:write",
        # Stock (Cashier needs read access to check availability during checkout)
        "stock:read"
    ]
}


# OAuth2 Scheme declaration for FastAPI Swagger UI compatibility
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    scheme_name="OAuth2PasswordBearer",
    description="Email + Password Login",
    auto_error=False
)


# ========================= DATA SCHEMAS =========================
class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    id_token: Optional[str] = None
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: str
    organization_id: str
    business_id: Optional[str] = None
    role: str
    jti: str
    iss: str
    aud: str
    exp: int
    iat: int
    type: str = "access"
    scopes: List[str] = Field(default_factory=list)


# ========================= SECURITY SERVICE CLASS =========================
class SecurityService:
    def __init__(self) -> None:
        self.pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

    # ------------------------------------------------------------------
    # 1. HASHING & PASSWORDS
    # ------------------------------------------------------------------
    def hash_password(self, password: str) -> str:
        """Hashes a plain text password using Argon2."""
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verifies a plain text password against an Argon2 hash."""
        return self.pwd_context.verify(plain_password, hashed_password)

    def generate_pin_salt(self) -> str:
        """Generates a cryptographic 16-byte hex salt for PIN hashing."""
        return secrets.token_hex(16)

    def hash_pin(self, pin: str, salt: str) -> str:
        """Hashes a 4-digit PIN combined with a unique salt."""
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
        scopes: List[str]
    ) -> str:
        """Private helper to encode a JWT payload with standard claims."""
        to_encode = data.copy()
        now = utc_now()
        expire = now + expires_delta

        to_encode.update({
            "exp": expire,
            "iat": now,
            "iss": settings.issuer,
            "aud": settings.audience,
            "type": token_type,
            "jti": str(uuid.uuid4()),
            "scopes": scopes
        })
        return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

    def create_tokens(
        self,
        user_data: Dict[str, Any],
        business_id: Optional[str] = None
    ) -> Token:
        """
        Creates access, refresh, and id tokens for a user session.
        Calculates granular scopes from ROLE_SCOPES based on the user's StaffRole.
        """
        role_str = str(user_data["role"]).strip().upper()
        
        try:
            role_enum = StaffRole(role_str)
            scopes = ROLE_SCOPES.get(role_enum, [])
        except ValueError:
            logger.warning(f"Unrecognized role string encountered during token creation: {role_str}")
            scopes = []

        base_claims = {
            "sub": str(user_data["sub"]),
            "organization_id": str(user_data["organization_id"]),
            "business_id": str(business_id) if business_id else None,
            "role": role_str,
        }

        access_token = self._create_token(
            base_claims,
            timedelta(minutes=settings.access_token_expire_minutes),
            "access",
            scopes
        )
        refresh_token = self._create_token(
            base_claims,
            timedelta(days=settings.refresh_token_expire_days),
            "refresh",
            scopes
        )
        id_token = self._create_token(
            base_claims,
            timedelta(minutes=settings.access_token_expire_minutes),
            "id",
            scopes
        )

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            id_token=id_token
        )

    # ------------------------------------------------------------------
    # 3. VERIFICATION & REPLAY PROTECTION (REDIS)
    # ------------------------------------------------------------------
    async def verify_token(
        self,
        token: str,
        expected_type: str = "access",
        redis_client: Optional[AsyncRedis] = None
    ) -> TokenData:
        """
        Verifies signature, expiration, and token type.
        If an AsyncRedis client is supplied, checks for JTI blacklisting to block replayed tokens.
        """
        try:
            payload = jwt.decode(
                token,
                settings.secret_key,
                algorithms=[settings.algorithm],
                audience=settings.audience,
                issuer=settings.issuer,
                options={"verify_signature": True}
            )

            if payload.get("type") != expected_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token type. Expected '{expected_type}'",
                    headers={"WWW-Authenticate": "Bearer"}
                )

            token_data = TokenData(**payload)

            # Replay Attack Check against Redis Blacklist
            if redis_client is not None and token_data.jti:
                is_blacklisted = await redis_client.get(f"auth:blacklist:{token_data.jti}")
                if is_blacklisted:
                    logger.warning(f"🚨 Revoked/Replayed token detected: JTI {token_data.jti}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has been revoked or already used.",
                        headers={"WWW-Authenticate": "Bearer"}
                    )

            return token_data

        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except jwt.JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"}
            )

    async def authenticate(self, email: EmailStr, password: str, db: AsyncSession) -> Token:
        """Authenticates active staff credentials and returns signed tokens."""
        stmt = (
            select(Staff)
            .where(
                Staff.email == email.lower().strip(),
                Staff.active == True
            )
            .options(selectinload(Staff.assigned_businesses))
        )
        staff = (await db.exec(stmt)).first()

        if not staff or not self.verify_password(password, staff.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Resolve primary assigned business ID for transitional period
        assigned_business_id = None
        if staff.assigned_businesses:
            assigned_business_id = str(staff.assigned_businesses[0].id)

        role_value = staff.role.value if hasattr(staff.role, "value") else str(staff.role)

        user_data = {
            "sub": str(staff.id),
            "organization_id": str(staff.tenant_id),
            "role": role_value,
        }

        # Fixed: Called method on self instead of undefined module variable 'security'
        return self.create_tokens(user_data, business_id=assigned_business_id)

    async def rotate_refresh_token(
        self,
        old_refresh_token: str,
        redis_client: AsyncRedis
    ) -> Token:
        """
        Rotates a refresh token safely by blacklisting the old token's JTI 
        in Redis for its remaining TTL before issuing a new token set.
        """
        token_data = await self.verify_token(old_refresh_token, "refresh", redis_client)

        # Blacklist the old refresh token JTI in Redis
        now_ts = int(utc_now().timestamp())
        ttl_remaining = token_data.exp - now_ts
        if ttl_remaining > 0:
            await redis_client.set(
                f"auth:blacklist:{token_data.jti}",
                "revoked",
                ex=ttl_remaining
            )

        user_data = {
            "sub": token_data.sub,
            "organization_id": token_data.organization_id,
            "role": token_data.role,
        }
        return self.create_tokens(user_data, business_id=token_data.business_id)

    # ------------------------------------------------------------------
    # 4. OPAQUE PASSWORD RESET TOKENS (REDIS)
    # ------------------------------------------------------------------
    async def create_password_reset_token(
        self,
        staff_id: Union[str, uuid.UUID],
        redis_client: AsyncRedis,
        expire_minutes: int = 15
    ) -> str:
        """
        Generates a high-entropy opaque reset token stored inside Redis 
        with a strict TTL. Returns the plain token string for emailing.
        """
        reset_token = secrets.token_urlsafe(32)
        redis_key = f"auth:reset:{reset_token}"
        logger.info(f"key: {redis_key}")
        await redis_client.set(
            redis_key,
            str(staff_id),
            ex=expire_minutes * 60
        )
        return reset_token

    async def verify_and_consume_password_reset_token(
        self,
        reset_token: str,
        redis_client: AsyncRedis
    ) -> str:
        """
        Validates and immediately deletes a password reset token from Redis to enforce single-use.
        Returns the associated staff_id string.
        """
        redis_key = f"auth:reset:{reset_token}"
        staff_id_bytes = await redis_client.get(redis_key)

        if not staff_id_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token."
            )

        # Convert bytes to string if needed
        staff_id = staff_id_bytes.decode("utf-8") if isinstance(staff_id_bytes, bytes) else str(staff_id_bytes)
        
        # Enforce single-use by immediate deletion
        await redis_client.delete(redis_key)
        return staff_id


# Instantiate global thread-safe security service instance
security = SecurityService()


# ------------------------------------------------------------------
# 5. FASTAPI AUTHORIZATION SCOPE GUARD FACTORY
# ------------------------------------------------------------------
def require_scopes(required_scopes: List[str]):
    """
    Dependency factory for protecting route handlers with fine-grained scopes.
    Validates token presence, verifies Redis blacklist status, and checks required permissions.
    """
    async def scope_checker(
        security_scopes: SecurityScopes,
        token: str = Depends(oauth2_scheme),
        redis_client: Optional[AsyncRedis] = None
    ) -> TokenData:
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication credentials were not provided.",
                headers={"WWW-Authenticate": "Bearer"}
            )

        # Decode and verify token (including optional Redis blacklist check)
        token_data = await security.verify_token(
            token,
            expected_type="access",
            redis_client=redis_client
        )

        # Combine route factory scopes with FastAPI's native SecurityScopes (if declared)
        all_required = set(required_scopes).union(set(security_scopes.scopes))

        # Check whether token contains all required scopes
        for required_scope in all_required:
            if required_scope not in token_data.scopes:
                logger.warning(
                    f"Forbidden access attempt by staff {token_data.sub}. Missing scope: {required_scope}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Missing scope: '{required_scope}'"
                )

        return token_data

    return scope_checker