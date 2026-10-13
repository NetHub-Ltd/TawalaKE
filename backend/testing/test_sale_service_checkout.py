"""Legacy SaleService is disabled (410) — live POS is store_crud."""
from __future__ import annotations

from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.crud.sale import (
    CartItemIn,
    FinalizeCheckoutIn,
    InitializeCheckout,
    SaleService,
)
from app.models.models import PaymentMethod


def _sync_db():
    db = MagicMock()
    return db


def test_legacy_initialize_checkout_gone():
    db = _sync_db()
    payload = InitializeCheckout(
        business_id=uuid4(),
        cashier_id=uuid4(),
        items=[CartItemIn(product_id=uuid4(), quantity=1)],
    )
    with pytest.raises(HTTPException) as ei:
        SaleService.initialize_checkout(db, payload)
    assert ei.value.status_code == 410
    assert "Legacy" in str(ei.value.detail) or "store" in str(ei.value.detail).lower()


def test_legacy_finalize_checkout_gone():
    db = _sync_db()
    payload = FinalizeCheckoutIn(
        sale_id=uuid4(),
        payment_method=PaymentMethod.CASH,
    )
    with pytest.raises(HTTPException) as ei:
        SaleService.finalize_checkout(db, payload.sale_id, payload)
    assert ei.value.status_code == 410
