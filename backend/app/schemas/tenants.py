import datetime
from pydantic import BaseModel
from uuid import UUID
from app.models.models import SubscriptionTier

class TenantCreate(BaseModel):
    name: str
    email: str
    active: bool = True
    tenant_id: UUID

class TenantResponse(BaseModel):
    id: UUID
    name: str
    email: str
    active: bool = True
    plan: SubscriptionTier
    created_at: datetime.datetime
    class Config:
        from_attributes = True