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
    email: EmailStr
    full_name: str
    role: StaffRole = StaffRole.CASHIER
    password: str = Field(min_length=8)
    business_ids: List[UUID] = Field(min_length=1)
    organization_id: Optional[UUID] = None
