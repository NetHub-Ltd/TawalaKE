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

# ========================= CONFIG =========================
SECRET_KEY = "CHANGE-THIS-IN-PRODUCTION-USE-ENV-VAR"  
ALGORITHM = "HS256"
ISSUER = "https://your-bms-api.com"
AUDIENCE = "your-bms-client"

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8      # 8 hours
REFRESH_TOKEN_EXPIRE_DAYS = 7
PIN_TOKEN_EXPIRE_HOURS = 12

# Use Argon2 for PINs (and optionally passwords)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")   # ← Changed

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

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
    jti: str                     # JWT ID - important for revocation/rotation
    iss: str
    aud: str
    exp: int
    iat: int
    type: str = "access"

# ========================= HASHING =========================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# PIN with explicit salt + Argon2
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
def _create_token(data: Dict[str, Any], expires_delta: timedelta, token_type: str) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    now = datetime.utcnow()
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "iss": ISSUER,
        "aud": AUDIENCE,
        "type": token_type,
        "jti": str(uuid.uuid4())          # Unique per token
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_tokens(user_data: Dict[str, Any]) -> Token:
    base = {
        "sub": user_data["sub"],
        "organization_id": user_data["organization_id"],
        "business_id": user_data.get("business_id"),
        "role": user_data["role"],
    }
    
    access = _create_token(base, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES), "access")
    refresh = _create_token(base, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS), "refresh")
    id_token = _create_token(base, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES), "id")
    
    return Token(access_token=access, refresh_token=refresh, id_token=id_token)

def create_pin_token(user_data: Dict[str, Any]) -> Token:
    base = {**user_data}
    access = _create_token(base, timedelta(hours=PIN_TOKEN_EXPIRE_HOURS), "access")
    return Token(access_token=access, token_type="pin")

# ========================= TOKEN VERIFICATION + ROTATION =========================
def verify_token(token: str, expected_type: str = "access") -> TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], audience=AUDIENCE, issuer=ISSUER)
        if payload.get("type") != expected_type:
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        return TokenData(**payload)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# This is called when refreshing
def rotate_refresh_token(old_refresh_token: str) -> Token:
    token_data = verify_token(old_refresh_token, "refresh")
    
    # In real implementation: invalidate old refresh token in DB here
    
    user_data = {
        "sub": token_data.sub,
        "organization_id": token_data.organization_id,
        "business_id": token_data.business_id,
        "role": token_data.role,
    }
    return create_tokens(user_data)