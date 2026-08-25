from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID

class OrgCreate(BaseModel):
    name: str
    email: EmailStr


class OrgUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None      # KRA PIN
    logo_url: Optional[str] = None


class OrgResponse(OrgCreate):
    active: bool
    phone: Optional[str] = None
    id: UUID
    onboarding: Optional[bool] = False
    