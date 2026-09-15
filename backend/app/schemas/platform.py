"""Request/response schemas for platform identity and admin APIs."""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.models import PlatformRole


class PlatformLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class PlatformTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    role: PlatformRole
    kind: str = "platform"


class PlatformUserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    role: PlatformRole = PlatformRole.SUPPORT
    active: bool = True


class PlatformUserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    role: Optional[PlatformRole] = None
    active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)


class PlatformUserRead(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    role: PlatformRole
    active: bool
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PlatformMeResponse(BaseModel):
    user: PlatformUserRead
    permissions: list[str]
