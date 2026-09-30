"""SaleReadWithRelations list helpers — amount_paid / balance_due / item_count."""
from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.models.models import PaymentMethod, SaleStatus
from app.schemas.sale import SaleReadWithRelations


def _now():
    return datetime.now(timezone.utc)


def test_partial_payment_balance_due_shape():
    """API list shape must expose remaining balance, not full total as due."""
    pay = SimpleNamespace(
        amount=40_000.0, method=PaymentMethod.CASH, reference="TXN-B144E8D9"
    )
    item = SimpleNamespace(
        name="Epson L3250",
        unit_price=24_000.0,
        quantity=2,
        subtotal=48_000.0,
        cost_price_at_sale=None,
    )
    cashier = SimpleNamespace(id=uuid4(), full_name="John Doe", email=None)
    customer = SimpleNamespace(id=uuid4(), name="Martin Karanja", phone="0786354890")
    sale = SimpleNamespace(
        id=uuid4(),
        business_id=uuid4(),
        cashier_id=uuid4(),
        customer_id=customer.id,
        currency="KES",
        status=SaleStatus.PARTIALLY_PAID,
        subtotal=48_000.0,
        discount=0,
        tax_amount=0.0,
        total_amount=48_370.0,
        created_at=_now(),
        updated_at=_now(),
        service_amount=[{"description": "Lamination", "amount": 370.0}],
        business=SimpleNamespace(id=uuid4(), name="Branch"),
        cashier=cashier,
        customer=customer,
        items=[item],
        payments=[pay],
        document=SimpleNamespace(amount_paid=40_000.0),
        item_count=None,
        cashier_name=None,
        amount_paid=None,
        balance_due=None,
    )

    out = SaleReadWithRelations.model_validate(sale)
    payload = out.model_dump(mode="json")

    assert payload["amount_paid"] == pytest.approx(40_000.0)
    assert payload["balance_due"] == pytest.approx(8_370.0)
    assert payload["item_count"] == 2  # product + service
    assert payload["cashier_name"] == "John Doe"
    assert payload["customer"]["name"] == "Martin Karanja"
    assert len(payload["payments"]) == 1
    assert payload["payments"][0]["amount"] == pytest.approx(40_000.0)


def test_balance_falls_back_to_document_when_payments_empty():
    """If payments relation is empty, document.amount_paid still drives due."""
    item = SimpleNamespace(
        name="Item", unit_price=100.0, quantity=1, subtotal=100.0, cost_price_at_sale=None
    )
    sale = SimpleNamespace(
        id=uuid4(),
        business_id=uuid4(),
        cashier_id=uuid4(),
        customer_id=None,
        currency="KES",
        status=SaleStatus.PARTIALLY_PAID,
        subtotal=100.0,
        discount=0,
        tax_amount=0.0,
        total_amount=100.0,
        created_at=_now(),
        updated_at=_now(),
        service_amount=None,
        business=None,
        cashier=None,
        customer=None,
        items=[item],
        payments=[],
        document=SimpleNamespace(amount_paid=60.0),
        item_count=None,
        cashier_name=None,
        amount_paid=None,
        balance_due=None,
    )
    out = SaleReadWithRelations.model_validate(sale)
    assert out.amount_paid == pytest.approx(60.0)
    assert out.balance_due == pytest.approx(40.0)


def test_completed_sale_balance_due_zero():
    pay = SimpleNamespace(amount=100.0, method=PaymentMethod.CASH, reference=None)
    sale = SimpleNamespace(
        id=uuid4(),
        business_id=uuid4(),
        cashier_id=uuid4(),
        customer_id=None,
        currency="KES",
        status=SaleStatus.COMPLETED,
        subtotal=100.0,
        discount=0,
        tax_amount=0.0,
        total_amount=100.0,
        created_at=_now(),
        updated_at=_now(),
        service_amount=None,
        business=None,
        cashier=None,
        customer=None,
        items=[],
        payments=[pay],
        document=None,
        item_count=None,
        cashier_name=None,
        amount_paid=None,
        balance_due=None,
    )
    out = SaleReadWithRelations.model_validate(sale)
    assert out.balance_due == 0.0
    assert out.amount_paid == pytest.approx(100.0)
