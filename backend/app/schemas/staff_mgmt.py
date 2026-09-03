from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from app.models.models import StaffRole


class StaffUpdateIn(BaseModel):
    full_name: Optional[str] = None
    role: Optional[StaffRole] = None
    active: Optional[bool] = None


class StaffBusinessesIn(BaseModel):
    business_ids: List[UUID] = Field(min_length=1)


class StaffResetPasswordIn(BaseModel):
    password: str = Field(min_length=8)


class StaffCreateManagedIn(BaseModel):
    """Create staff and email an invite link (no password at create time)."""

    email: EmailStr
    full_name: str
    role: StaffRole = StaffRole.CASHIER
    business_ids: List[UUID] = Field(min_length=1)
    organization_id: Optional[UUID] = None


class StaffInviteAcceptIn(BaseModel):
    token: str
    new_password: str = Field(min_length=8)
