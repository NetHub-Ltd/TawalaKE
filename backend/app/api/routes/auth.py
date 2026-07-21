import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, BackgroundTasks
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


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class MessageResponse(BaseModel):
    message: str

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
    set_refresh_cookie(response, refresh_token)

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
    body: Optional[RefreshTokenRequest] = None,
):
    """
    Rotates refresh tokens cleanly. Accepts refresh token from HttpOnly cookie first,
    falling back to JSON body if provided. Blacklists old JTI in Redis to prevent replay attacks.
    """
    token_str = request.cookies.get("refresh_token")
    
    if not token_str and body and body.refresh_token:
        token_str = body.refresh_token

    if not token_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing from request cookie and body.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        new_tokens = await security.rotate_refresh_token(
            old_refresh_token=token_str,
            redis_client=redis
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
        frontend_reset_url = f"{settings.frontend_url}/auth/reset-password?token={reset_token}"

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


# @router.post("/password-reset/request", response_model=MessageResponse)
# @limiter.limit("3/minute")  # Prevent email enumeration and spamming
# async def request_password_reset(
#     request: Request,
#     body: PasswordResetRequest,
#     db: SessionDep,
#     redis: RedisDep,
# ):
#     """
#     Generates a 15-minute high-entropy reset token stored in Redis.
#     Always returns 200 OK to prevent email enumeration vulnerabilities.
#     """
#     email_clean = body.email.lower().strip()
#     stmt = select(Staff).where(Staff.email == email_clean, Staff.active == True)
#     staff = (await db.exec(stmt)).first()

#     if staff:
#         reset_token = await security.create_password_reset_token(
#             staff_id=staff.id,
#             redis_client=redis,
#             expire_minutes=15
#         )
        
#         # Dispatch email asynchronously via your existing Resend integration
#         # e.g., await send_password_reset_email(email=staff.email, token=reset_token)
#         logger.info(f"🔑 Password reset token generated for user {staff.id}: {reset_token}")

#     return MessageResponse(
#         message="If an active account exists with that email, a password reset link has been dispatched."
#     )


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


@router.get("/me", response_model=StaffResponse)
async def get_current_user_info(current_user: CurrentStaff):
    """Returns the authenticated staff member's profile."""
    return current_user


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