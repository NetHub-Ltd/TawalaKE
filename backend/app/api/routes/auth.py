# auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.schemas.schemas import StaffResponse
import datetime
from app.utils.helpers import utc_now
from app.core.config import settings

from app.core.security import (
    verify_password,
    hash_pin, verify_pin, generate_pin_salt,
    create_tokens, create_pin_token,
    rotate_refresh_token, verify_token
)
from app.api.deps import SessionDep, CurrentStaff
from app.models.models import Staff
from sqlmodel import select

router = APIRouter()


# ========================= RESPONSES =========================
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    id_token: Optional[str] = None
    token_type: str = "bearer"
    expires_at: datetime.datetime


class PinLoginRequest(BaseModel):
    organization_id: str
    business_id: Optional[str] = None
    pin: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str
# ========================= ENDPOINTS =========================

@router.post("/login", response_model=TokenResponse)
async def login_with_email(db: SessionDep,request: Response,
    form_data: OAuth2PasswordRequestForm = Depends()   # ← This makes Swagger show the form
    
):
    """Owner / Manager login with email + password (Swagger friendly)"""
    stmt = select(Staff).where(
        Staff.email == form_data.username,   # OAuth2 form uses 'username'
        Staff.active == True
    )
    staff = (await db.exec(stmt)).first()

    if not staff or not verify_password(form_data.password, staff.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_data = {
        "sub": str(staff.id),
        "organization_id": str(staff.tenant_id),
        "business_id": None,
        "role": staff.role.value,
    }

    token = create_tokens(user_data)

    # 2. Set the long-lived refresh token in a highly secure cookie
    request.set_cookie(
        key="refresh_token",
        value=token.refresh_token,
        httponly=True,       # ⚡ CRITICAL: Prevents JS reading the cookie (XSS protection)
        secure=True,         # ⚡ CRITICAL: Forces HTTPS only (Turn off ONLY in local dev)
        samesite="lax",      # Protects against CSRF attacks
        max_age=7 * 24 * 60 * 60, # 7 days in seconds
        path="/api/v1/auth/refresh", # ⚡ Optimization: Cookie only sent on refresh endpoint
    )

    return TokenResponse(
        access_token=token.access_token,
        refresh_token=token.refresh_token,
        id_token=token.id_token,
        expires_at=utc_now() + datetime.timedelta(minutes=settings.access_token_expire_minutes)  # Access token expires in 15 minutes
    )

# ========================= OTHER ENDPOINTS =========================

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    try:
        return rotate_refresh_token(request.refresh_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.get("/me", response_model=StaffResponse)
async def get_current_user_info(current_user: CurrentStaff):
    # This endpoint is protected by the CurrentStaff dependency, which verifies the access token and retrieves the user info
    """
    Get the current logged-in user's information. Requires a valid access token in the Authorization header.
     - The CurrentStaff dependency will handle token verification and user retrieval.
     - If the token is valid, it returns the user's information as defined in StaffResponse.
     - If the token is invalid or expired, it will raise an HTTP 401 error.
    """
    return current_user


@router.get('/logout', status_code=204)
async def logout(response: Response):
    """Logs out the current user by clearing the refresh token cookie. The access token will naturally expire soon.
     - This endpoint simply deletes the refresh token cookie, effectively logging the user out.
     - The access token will still be valid until it expires, but without a refresh token, the user won't be able to get new access tokens.
     - This is a common and secure way to handle logout in JWT-based authentication systems.
    """
    # To log out, we simply clear the refresh token cookie. The access token will naturally expire soon.
    response.delete_cookie(key="refresh_token", path="/api/v1/auth/refresh")
    return Response(status_code=204)