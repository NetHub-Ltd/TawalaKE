# auth.py
from urllib import response

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

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


class PinLoginRequest(BaseModel):
    organization_id: str
    business_id: Optional[str] = None
    pin: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str
# ========================= ENDPOINTS =========================

@router.post("/login", response_model=TokenResponse)
async def login_with_email(db: SessionDep,
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

    access_token, refresh_token, id_token = create_tokens(user_data)

    # 2. Set the long-lived refresh token in a highly secure cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,       # ⚡ CRITICAL: Prevents JS reading the cookie (XSS protection)
        secure=True,         # ⚡ CRITICAL: Forces HTTPS only (Turn off ONLY in local dev)
        samesite="lax",      # Protects against CSRF attacks
        max_age=7 * 24 * 60 * 60, # 7 days in seconds
        path="/api/v1/auth/refresh", # ⚡ Optimization: Cookie only sent on refresh endpoint
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        id_token=id_token
    )

# ========================= OTHER ENDPOINTS =========================

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    try:
        return rotate_refresh_token(request.refresh_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.get("/me")
async def get_current_user_info(current_user: CurrentStaff):
    return current_user



# Add this schema (used by /login/pin)
