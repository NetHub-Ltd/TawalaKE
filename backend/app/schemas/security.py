"""Security / membership schemas."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class MembershipInvite(BaseModel):
    user_id: UUID


class MembershipRead(BaseModel):
    id: UUID
    business_id: UUID
    user_id: UUID
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RoleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)


class RoleRead(BaseModel):
    id: UUID
    business_id: UUID
    name: str
    is_system: bool

    model_config = {"from_attributes": True}


class PermissionAttach(BaseModel):
    permission_code: str


class RoleAssign(BaseModel):
    role_id: UUID


class PermissionRead(BaseModel):
    code: str
    description: str | None = None
