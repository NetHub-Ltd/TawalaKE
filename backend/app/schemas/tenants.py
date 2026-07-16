import datetime
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from app.models.models import SubscriptionTier
from typing import Optional

class TenantCreate(BaseModel):
    name: str
    email: str
    active: bool = True
    # tenant_id: Optional[UUID] = None

class TenantResponse(BaseModel):
    id: UUID
    name: str
    email: str
    active: bool = True
    plan: SubscriptionTier
    created_at: datetime.datetime
    
    model_config = ConfigDict(from_attributes=True)