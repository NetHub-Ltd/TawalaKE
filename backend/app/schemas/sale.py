from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.models.models import SaleStatus
from datetime import datetime

class ItemReadMinimal(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # product_id: UUID
    name: str
    unit_price: float
    # quantity: Union[int, float] = None
    quantity: int | float | None = None
    subtotal: float
    cost_price_at_sale: Optional[float] = None
    # tax_amount: float

class StaffReadMinimal(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: Optional[str] = None
    # phone: Optional[str] = None
    email: Optional[str] = None


class CustomerReadMinimal(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    phone: Optional[str] = None


class BusinessReadMinimal(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str


class SaleReadWithRelations(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    business_id: UUID
    cashier_id: UUID
    customer_id: Optional[UUID] = None
    currency: str
    status: SaleStatus
    subtotal: float
    discount: float
    tax_amount: float
    total_amount: float
    created_at: datetime
    updated_at: datetime

    # EXPLICIT RELATIONAL FIELDS: Required for Pydantic to include selectinload objects
    business: Optional[BusinessReadMinimal] = None
    cashier: Optional[StaffReadMinimal] = None
    customer: Optional[CustomerReadMinimal] = None
    items: Optional[list[ItemReadMinimal]] = None
