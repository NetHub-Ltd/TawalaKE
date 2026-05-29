# auth.py
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

    return create_tokens(user_data)


@router.post("/login/pin", response_model=TokenResponse)
async def login_with_pin(db: SessionDep,
    request: PinLoginRequest        # Keep as JSON for PIN (staff use)
    
):
    """Staff quick login using 4-digit PIN"""
    stmt = select(Staff).where(
        Staff.tenant_id == request.organization_id,
        Staff.active == True
    )
    staff = (await db.exec(stmt)).first()

    if not staff or not staff.pin_hash or not staff.pin_salt:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="PIN not set"
        )

    if not verify_pin(request.pin, staff.pin_hash, staff.pin_salt):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid PIN"
        )

    user_data = {
        "sub": str(staff.id),
        "organization_id": str(staff.tenant_id),
        "business_id": request.business_id,
        "role": staff.role.value,
    }

    return create_pin_token(user_data)


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


@router.post("/pin/setup")
async def setup_pin(
    pin: str,
    current_user: CurrentStaff,
    db: SessionDep
):
    if not pin.isdigit() or len(pin) != 4:
        raise HTTPException(400, detail="PIN must be 4 digits")

    staff = db.query(Staff).filter(Staff.id == current_user.sub).first()
    if not staff:
        raise HTTPException(404, detail="Staff not found")

    salt = generate_pin_salt()
    staff.pin_hash = hash_pin(pin, salt)
    staff.pin_salt = salt
    db.commit()

    return {"message": "PIN set successfully"}


# Add this schema (used by /login/pin)
