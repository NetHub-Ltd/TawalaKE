import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, BackgroundTasks, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import selectinload
from sqlmodel import select

from app.core import mailer
from app.core.config import settings
from app.core.security import security, Token
from app.api.deps import SessionDep, RedisDep, CurrentStaff
from app.models.models import Staff
from app.schemas.schemas import StaffResponse
from app.utils.helpers import utc_now
from app.utils.logging import logger
from app.core.redis_client import limiter
from app.core.mailer import mailer

router = APIRouter()


# ========================= SCHEMAS =========================
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    id_token: Optional[str] = None
    token_type: str = "bearer"
    expires_at: Optional[datetime.datetime] = None
    email: Optional[EmailStr] = None
    # Onboarding completion hints (set-password auto-trial path)
    trial_started: Optional[bool] = None
    trial_days: Optional[int] = None
    plan_code: Optional[str] = None
    needs_org_profile: Optional[bool] = None


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class OnboardingSetPassword(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class MessageResponse(BaseModel):
    message: str

class PermissionsResponse(BaseModel):
    """Lean RBAC snapshot — not part of the NextAuth session."""
    staff_id: str
    organization_id: Optional[str] = None
    role: Optional[str] = None
    org_wide: bool = False
    permissions: List[str] = []

class LoginPayload(BaseModel):
    email: EmailStr
    password: str


# ========================= HELPER FUNCTIONS =========================
def set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """Sets a secure HttpOnly cookie for the refresh token."""
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.is_prod,  # True in prod, False in local dev
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/api/v1/auth/refresh",
    )


# ========================= ENDPOINTS =========================

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")  # ⚡ Brute-Force Protection: 5 failed/passed attempts per minute per IP
async def login_with_email(
    request: Request,
    response: Response,
    db: SessionDep,
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """
    Email + Password login with brute-force rate limiting, eager business loading, 
    and secure HttpOnly refresh token cookie assignment.
    """
    # we use the form_data.username field to capture the email for OAuth2PasswordRequestForm
    # we shouldnt trust the form data we have to validate
    creds = LoginPayload(email=form_data.username, password=form_data.password)
    tokens = await security.authenticate(password=creds.password, email=creds.email, db=db)

    # Set secure HttpOnly cookie for refresh token rotation
    set_refresh_cookie(response, tokens.refresh_token)

    return TokenResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        id_token=tokens.id_token,
        expires_at=utc_now() + datetime.timedelta(minutes=settings.access_token_expire_minutes),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
    redis: RedisDep,
    db: SessionDep,
    refresh_token: str = Body(..., embed=True),
    # body: Optional[RefreshTokenRequest] = None,
):
    """
    Rotates refresh tokens cleanly. Reloads staff from DB so deactivated accounts
    and role/org changes take effect. Blacklists old JTI in Redis.
    """
    # Optional safety: strip any accidental "Bearer " or whitespace
    clean = refresh_token.strip()
    if clean.lower().startswith("bearer "):
        clean = clean[7:].strip()
    
    try:
        new_tokens = await security.rotate_refresh_token(
            old_refresh_token=clean,
            redis_client=redis,
            db=db,
        )
        set_refresh_cookie(response, new_tokens.refresh_token)

        return TokenResponse(
            access_token=new_tokens.access_token,
            refresh_token=new_tokens.refresh_token,
            id_token=new_tokens.id_token,
            expires_at=utc_now() + datetime.timedelta(minutes=settings.access_token_expire_minutes),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token rotation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def request_password_reset(
    payload: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: SessionDep,
    redis: RedisDep,
):
    """
    Triggers password recovery workflow. 
    Returns 202 Accepted unconditionally to prevent account enumeration attacks.
    """
    stmt = select(Staff).where(Staff.email == payload.email.lower().strip(), Staff.active == True)
    staff = (await db.exec(stmt)).first()

    # Always return 202 even if user is not found to prevent user enumeration
    if staff:
        # 1. Issue opaque single-use token stored in Redis (15-min TTL)
        reset_token = await security.create_password_reset_token(
            staff_id=staff.id,
            redis_client=redis,
            expire_minutes=15
        )

        # 2. Build full action URL pointing to frontend app
        frontend_reset_url = f"{settings.frontend_origin}/auth/reset-password?token={reset_token}"

        # Extract client IP for security context in email
        client_ip = request.client.host if request.client else "Unknown"

        # 3. Offload email delivery to FastAPI worker thread via BackgroundTasks
        background_tasks.add_task(
            mailer.send_password_reset,
            to_email=staff.email,
            reset_url=frontend_reset_url,
            user_name=getattr(staff, "full_name", None),
            ip_address=client_ip,
            expire_minutes=15
        )

    return {
        "message": "If an active account exists for that email, a password reset link has been dispatched."
    }

@router.post("/password-reset/confirm", response_model=MessageResponse)
async def confirm_password_reset(
    body: PasswordResetConfirm,
    db: SessionDep,
    redis: RedisDep,
):
    """
    Verifies and consumes the one-time opaque reset token from Redis, 
    updating the staff member's password hash using Argon2.
    """
    staff_id_str = await security.verify_and_consume_password_reset_token(
        reset_token=body.token,
        redis_client=redis
    )

    stmt = select(Staff).where(Staff.id == staff_id_str, Staff.active == True)
    staff = (await db.exec(stmt)).first()

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff account not found or inactive."
        )

    staff.hashed_password = security.hash_password(body.new_password)
    db.add(staff)
    await db.commit()

    logger.info(f"✅ Password successfully updated for staff ID: {staff.id}")
    return MessageResponse(message="Password has been updated successfully.")



@router.post("/onboarding/set-password", response_model=TokenResponse)
async def onboarding_set_password(
    body: OnboardingSetPassword,
    response: Response,
    db: SessionDep,
    redis: RedisDep,
    background_tasks: BackgroundTasks,
):
    """
    Complete email verification + password setup for a pending onboarded staff.
    Activates the account, auto-starts a 14-day Ndovu trial, and returns tokens.
    """
    from sqlalchemy.orm import selectinload
    from app.crud import subscription as subscription_crud
    from app.crud.organization import organization_crud

    staff_id_str = await security.verify_and_consume_password_reset_token(
        reset_token=body.token,
        redis_client=redis,
    )

    stmt = (
        select(Staff)
        .where(Staff.id == staff_id_str)
        .options(selectinload(Staff.assigned_businesses))
    )
    staff = (await db.exec(stmt)).first()

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff account not found.",
        )

    if staff.hashed_password and staff.active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is already activated. Please log in.",
        )

    staff.hashed_password = security.hash_password(body.new_password)
    staff.active = True
    db.add(staff)
    await db.commit()
    await db.refresh(staff)

    assigned_business_id = None
    if staff.assigned_businesses:
        assigned_business_id = str(staff.assigned_businesses[0].id)

    role_value = staff.role.value if hasattr(staff.role, "value") else str(staff.role)
    org_id = staff.organization_id or staff.tenant_id
    user_data = {
        "sub": str(staff.id),
        "organization_id": str(org_id),
        "role": role_value,
    }
    tokens = security.create_tokens(user_data, business_id=assigned_business_id)
    set_refresh_cookie(response, tokens.refresh_token)

    trial_started = False
    trial_days: Optional[int] = None
    plan_code: Optional[str] = None
    needs_org_profile = True

    if org_id:
        try:
            org = await organization_crud.get_organization_by_id(db=db, org_id=org_id)
            sub, plan = await subscription_crud.start_plan_trial(
                db, org_id, plan_code="NDOVU"
            )
            org = await subscription_crud.maybe_mark_onboarding_complete(db, org)
            trial_started = True
            plan_code = plan.code
            if sub.start_date and sub.end_date:
                trial_days = int((sub.end_date - sub.start_date).days)
            else:
                trial_days = subscription_crud.TRIAL_DAYS
            needs_org_profile = not subscription_crud.profile_looks_complete(org)

            start_s = sub.start_date.strftime("%Y-%m-%d") if sub.start_date else ""
            end_s = sub.end_date.strftime("%Y-%m-%d") if sub.end_date else ""
            frontend = settings.frontend_origin
            background_tasks.add_task(
                mailer.send_trial_invoice,
                to_email=staff.email,
                org_name=org.name or "Your business",
                plan_name=plan.name,
                trial_days=trial_days,
                start_date=start_s,
                end_date=end_s,
                currency=getattr(plan, "currency", None) or "KES",
                dashboard_url=f"{frontend}/org",
            )
            logger.info(
                f"Onboarding auto-trial NDOVU {trial_days}d for staff {staff.id} org {org_id}"
            )
        except Exception as exc:  # noqa: BLE001
            # Password is set; allow recovery via /onboarding/plans
            logger.exception(
                f"Onboarding auto-trial failed for staff {staff.id} org {org_id}: {exc}"
            )
            trial_started = False
            needs_org_profile = True

    logger.info(f"Onboarding password set and account activated for staff {staff.id}")
    return TokenResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        id_token=tokens.id_token,
        expires_at=utc_now() + datetime.timedelta(minutes=settings.access_token_expire_minutes),
        email=staff.email,
        trial_started=trial_started,
        trial_days=trial_days,
        plan_code=plan_code,
        needs_org_profile=needs_org_profile,
    )


@router.get("/me", response_model=StaffResponse)
async def get_current_user_info(current_user: CurrentStaff):
    """Returns the authenticated staff member's profile."""

    # logger.info(f"Fetching profile for authenticated user: {current_user.email} With business ID: {current_user.assigned_businesses}")
    return current_user


@router.get("/permissions", response_model=PermissionsResponse)
async def get_current_permissions(
    current_user: CurrentStaff,
    redis: RedisDep,
):
    """
    Dedicated RBAC snapshot for UI gating.

    Not stored in the NextAuth session (keeps hydration lean).
    Permission list is Redis-cached (same key as require_permissions).
    """
    from app.api.rbac_deps import _cached_perm_values
    from app.core.rbac import effective_role, is_org_wide_role

    role = effective_role(current_user)
    org_id = current_user.organization_id or current_user.tenant_id
    perms = await _cached_perm_values(redis, current_user)
    return PermissionsResponse(
        staff_id=str(current_user.id),
        organization_id=str(org_id) if org_id else None,
        role=role.value if role else None,
        org_wide=bool(is_org_wide_role(current_user)),
        permissions=perms,
    )


@router.post("/logout", status_code=204)
async def logout(response: Response):
    """Clears the refresh token cookie, ending the session on the client."""
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth/refresh",
        httponly=True,
        secure=settings.is_prod,
        samesite="lax",
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)