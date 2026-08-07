from pydantic import BaseModel, EmailStr
from uuid import UUID
from app.models.models import StaffRole
from typing import Optional, List
from app.schemas.schemas import MiniStoreResponse

class StaffCreate(BaseModel):
    organization_id: UUID
    email: EmailStr
    full_name: str
    business_id: UUID
    password: Optional[str] = None  # Plaintext password from front-end to be hashed on server
    role: StaffRole = StaffRole.CASHIER


class StaffResponse(BaseModel):
    id: UUID
    # tenant_id: UUID
    organization_id: Optional[UUID] = None
    # business_id: Optional[UUID] = None
    email: EmailStr
    full_name: str
    role: StaffRole
    active: bool
    assigned_businesses: Optional[List[MiniStoreResponse]] = None  # Eagerly loaded list of businesses the staff member is assigned to
    # store: Optional[BusinessResponse] = None # this can be a list on businesses if a staff member is assigned to multiple businesses

class StaffOnboard(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class StaffUpdate(StaffCreate):
    pass