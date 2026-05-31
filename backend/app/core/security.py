# security.py
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import secrets
from pydantic import BaseModel
import uuid
import os
from app.core.config import settings
from app.utils.helpers import utc_now, utc_today, validate_and_format_kenyan_phone
from app.utils.logging import logger

# ========================= CONFIG (from env) =========================
SECRET_KEY = settings.secret_key
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is required")

ALGORITHM = settings.algorithm
ISSUER  = settings.issuer
AUDIENCE = settings.audience

ACCESS_TOKEN_EXPIRE_MINUTES = int(settings.access_token_expire_minutes)
REFRESH_TOKEN_EXPIRE_DAYS = int(settings.refresh_token_expire_days)
PIN_TOKEN_EXPIRE_HOURS = int(settings.pin_token_expire_hours)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",           # Must point to your login endpoint
    scheme_name="OAuth2PasswordBearer", 
    description="Email + Password Login",
    auto_error=False
)

# ========================= MODELS =========================
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
    scopes: list = []


# ========================= HASHING =========================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_pin_salt() -> str:
    return secrets.token_hex(16)


def hash_pin(pin: str, salt: str) -> str:
    if not pin.isdigit() or len(pin) != 4:
        raise ValueError("PIN must be exactly 4 digits")
    salted = salt + pin
    return pwd_context.hash(salted)


def verify_pin(plain_pin: str, hashed_pin: str, salt: str) -> bool:
    if not plain_pin.isdigit() or len(plain_pin) != 4:
        return False
    return pwd_context.verify(salt + plain_pin, hashed_pin)


# ========================= TOKEN CREATION =========================
def _create_token(data: Dict[str, Any], expires_delta: timedelta, token_type: str, scopes: list = [] )-> str:
    to_encode = data.copy()
    expire = utc_now() + expires_delta
    now = utc_now()

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


def create_tokens(user_data: Dict[str, Any]) -> Token:
    base = {
        "sub": user_data["sub"],
        "organization_id": user_data["organization_id"],
        "business_id": user_data.get("business_id"),
        "role": user_data["role"],
    }
    
    access = _create_token(base, timedelta(minutes=settings.access_token_expire_minutes), "access")
    refresh = _create_token(base, timedelta(days=settings.refresh_token_expire_days), "refresh")
    id_token = _create_token(base, timedelta(minutes=settings.access_token_expire_minutes), "id")

    return Token(access_token=access, refresh_token=refresh, id_token=id_token)


def create_pin_token(user_data: Dict[str, Any]) -> Token:
    base = {
        "sub": user_data["sub"],
        "organization_id": user_data["organization_id"],
        "business_id": user_data.get("business_id"),
        "role": user_data["role"],
    }
    access = _create_token(base, timedelta(hours=settings.pin_token_expire_hours), "access")
    return Token(access_token=access, token_type="pin")


# ========================= VERIFICATION =========================
def verify_token(token: str, expected_type: str = "access") -> TokenData:
    try:
        payload = jwt.decode(
            token, 
            settings.secret_key, 
            algorithms=[settings.algorithm], 
            audience=settings.audience,
            issuer=settings.issuer,
            options={"verify_signature": True}
        )

        logger.info(f"decoded token: {payload}")
        
        if payload.get("type") != expected_type:
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        return TokenData(**payload)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


# ========================= REFRESH =========================
def rotate_refresh_token(old_refresh_token: str) -> Token:
    token_data = verify_token(old_refresh_token, "refresh")
    
    user_data = {
        "sub": token_data.sub,
        "organization_id": token_data.organization_id,
        "business_id": token_data.business_id,
        "role": token_data.role,
    }
    return create_tokens(user_data)