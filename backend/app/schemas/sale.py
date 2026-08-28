from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict, computed_field, model_validator
from app.models.models import SaleStatus
from datetime import datetime


class ServiceFee(BaseModel):
    amount: Optional[int | float | None] = None
    description: Optional[str] = None


class ItemReadMinimal(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    unit_price: float
    quantity: int | float | None = None
    subtotal: float
    cost_price_at_sale: Optional[float] = None


class StaffReadMinimal(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: Optional[str] = None
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
    discount: float | int | None = None
    tax_amount: float
    total_amount: float
    created_at: datetime
    updated_at: datetime
    service_amount: Optional[ServiceFee] = None

    # Relational fields (selectinload)
    business: Optional[BusinessReadMinimal] = None
    cashier: Optional[StaffReadMinimal] = None
    customer: Optional[CustomerReadMinimal] = None
    items: Optional[list[ItemReadMinimal]] = None

    # Additive denormalized helpers for list/detail UI (non-breaking)
    item_count: Optional[int] = None
    cashier_name: Optional[str] = None

    @model_validator(mode="wrap")
    @classmethod
    def _populate_list_helpers(cls, data: Any, handler):
        """Fill item_count / cashier_name from relations when not provided."""
        obj = handler(data)
        if obj.item_count is None:
            obj.item_count = len(obj.items) if obj.items else 0
        if not obj.cashier_name:
            if obj.cashier and obj.cashier.full_name:
                obj.cashier_name = obj.cashier.full_name
            else:
                obj.cashier_name = None
        return obj
