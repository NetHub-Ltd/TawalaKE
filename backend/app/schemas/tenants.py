
from pydantic import BaseModel
from uuid import UUID
from app.models.models import SubscriptionTier

class TenantCreate(BaseModel):
    full_name: str
    email: str
    active: bool = True
    tenant_id: UUID

class TenantResponse(BaseModel):
    id: UUID
    name: str
    email: str
    active: bool
    plan: SubscriptionTier