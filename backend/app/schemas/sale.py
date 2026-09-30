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

    name: str = "Item"
    unit_price: float = 0.0
    quantity: int | float | None = None
    subtotal: float = 0.0
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


class PaymentReadMinimal(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    amount: float
    method: Optional[Any] = None
    reference: Optional[str] = None


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
    # Array of {description, amount} preferred; legacy single object still accepted
    service_amount: Optional[Any] = None

    # Relational fields (selectinload)
    business: Optional[BusinessReadMinimal] = None
    cashier: Optional[StaffReadMinimal] = None
    customer: Optional[CustomerReadMinimal] = None
    items: Optional[list[ItemReadMinimal]] = None
    payments: Optional[list[PaymentReadMinimal]] = None

    # Additive denormalized helpers for list/detail UI (non-breaking)
    item_count: Optional[int] = None
    cashier_name: Optional[str] = None
    amount_paid: Optional[float] = None
    balance_due: Optional[float] = None

    @model_validator(mode="wrap")
    @classmethod
    def _populate_list_helpers(cls, data: Any, handler):
        """Fill list helpers from relations when not provided."""
        # Capture relations from raw ORM before handler may drop unknown fields
        raw_payments = None
        raw_doc = None
        if isinstance(data, dict):
            raw_payments = data.get("payments")
            raw_doc = data.get("document")
        else:
            raw_payments = getattr(data, "payments", None)
            raw_doc = getattr(data, "document", None)

        obj = handler(data)
        product_lines = len(obj.items) if obj.items else 0
        # Count service lines so UI is not "0 items" for service-heavy sales
        service_lines = 0
        raw_svc = obj.service_amount
        if isinstance(raw_svc, list):
            service_lines = sum(
                1
                for s in raw_svc
                if isinstance(s, dict)
                and float(s.get("amount") or 0) > 0
                and str(s.get("description") or "").strip()
            )
        elif isinstance(raw_svc, dict):
            if float(raw_svc.get("amount") or 0) > 0 and str(
                raw_svc.get("description") or ""
            ).strip():
                service_lines = 1
        if obj.item_count is None:
            obj.item_count = product_lines + service_lines
        if not obj.cashier_name:
            if obj.cashier and obj.cashier.full_name:
                obj.cashier_name = obj.cashier.full_name
            else:
                obj.cashier_name = None

        def _sum_payments(rows) -> float:
            if not rows:
                return 0.0
            total_paid = 0.0
            for p in rows:
                if p is None:
                    continue
                if isinstance(p, dict):
                    total_paid += float(p.get("amount") or 0)
                else:
                    total_paid += float(getattr(p, "amount", None) or 0)
            return total_paid

        paid = _sum_payments(obj.payments)
        if paid <= 0:
            paid = _sum_payments(raw_payments)
        if paid <= 0 and raw_doc is not None:
            if isinstance(raw_doc, dict):
                paid = float(raw_doc.get("amount_paid") or 0)
            else:
                paid = float(getattr(raw_doc, "amount_paid", None) or 0)

        total = float(obj.total_amount or 0)
        # Always recompute for list/detail honesty
        obj.amount_paid = round(paid, 2)
        status_val = (
            obj.status.value if hasattr(obj.status, "value") else str(obj.status)
        )
        if status_val == "COMPLETED":
            obj.balance_due = 0.0
        else:
            obj.balance_due = round(max(0.0, total - paid), 2)
        # Coerce payment method enums to str for JSON
        if obj.payments:
            fixed = []
            for p in obj.payments:
                method = p.method
                if method is not None and not isinstance(method, str):
                    method = getattr(method, "value", str(method))
                fixed.append(
                    PaymentReadMinimal(
                        amount=float(p.amount or 0),
                        method=method,
                        reference=p.reference,
                    )
                )
            obj.payments = fixed
        return obj
