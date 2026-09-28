"""Wave 1 coverage: SaleService initialize + finalize (safe paths only)."""
from __future__ import annotations

from types import SimpleNamespace
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
from app.models.models import PaymentMethod, SaleStatus


def _sync_db():
    db = MagicMock()
    db.add = MagicMock()
    db.commit = MagicMock()
    db.refresh = MagicMock()
    db.rollback = MagicMock()
    return db


def _product(**kwargs):
    defaults = dict(
        id=uuid4(),
        active=True,
        track_stock=True,
        stock=10.0,
        selling_price=100.0,
        cost_price=40.0,
        label="Widget",
        tax_rate=0.16,
        sku="W-1",
    )
    defaults.update(kwargs)
    return SimpleNamespace(**defaults)


def test_initialize_checkout_product_not_found():
    db = _sync_db()
    result = MagicMock()
    result.first.return_value = None
    db.exec.return_value = result
    payload = InitializeCheckout(
        business_id=uuid4(),
        cashier_id=uuid4(),
        items=[CartItemIn(product_id=uuid4(), quantity=1)],
    )
    with pytest.raises(HTTPException) as ei:
        SaleService.initialize_checkout(db, payload)
    assert ei.value.status_code == 404


def test_initialize_checkout_inactive_product():
    db = _sync_db()
    product = _product(active=False)
    result = MagicMock()
    result.first.return_value = product
    db.exec.return_value = result
    payload = InitializeCheckout(
        business_id=uuid4(),
        cashier_id=uuid4(),
        items=[CartItemIn(product_id=product.id, quantity=1)],
    )
    with pytest.raises(HTTPException) as ei:
        SaleService.initialize_checkout(db, payload)
    assert ei.value.status_code == 404


def test_initialize_checkout_insufficient_stock():
    db = _sync_db()
    product = _product(stock=1.0, track_stock=True)
    result = MagicMock()
    result.first.return_value = product
    db.exec.return_value = result
    payload = InitializeCheckout(
        business_id=uuid4(),
        cashier_id=uuid4(),
        items=[CartItemIn(product_id=product.id, quantity=5)],
    )
    with pytest.raises(HTTPException) as ei:
        SaleService.initialize_checkout(db, payload)
    assert ei.value.status_code == 400
    assert "Insufficient stock" in ei.value.detail


def test_initialize_checkout_happy_path_with_tax():
    db = _sync_db()
    product = _product(selling_price=100.0, tax_rate=0.16, stock=5)
    result = MagicMock()
    result.first.return_value = product
    db.exec.return_value = result
    payload = InitializeCheckout(
        business_id=uuid4(),
        cashier_id=uuid4(),
        items=[CartItemIn(product_id=product.id, quantity=2)],
    )
    sale = SaleService.initialize_checkout(db, payload)
    assert sale.subtotal == 200.0
    assert abs(sale.tax_amount - 32.0) < 0.01
    assert abs(sale.total_amount - 232.0) < 0.01
    assert sale.status == SaleStatus.PENDING_PAYMENT
    db.commit.assert_called()


def test_initialize_checkout_non_tracked_stock_skips_stock_check():
    db = _sync_db()
    product = _product(track_stock=False, stock=0, selling_price=50.0, tax_rate=0.0)
    result = MagicMock()
    result.first.return_value = product
    db.exec.return_value = result
    payload = InitializeCheckout(
        business_id=uuid4(),
        cashier_id=uuid4(),
        items=[CartItemIn(product_id=product.id, quantity=3)],
    )
    sale = SaleService.initialize_checkout(db, payload)
    assert sale.subtotal == 150.0
    assert sale.total_amount == 150.0


def test_finalize_checkout_sale_not_found():
    db = _sync_db()
    result = MagicMock()
    result.first.return_value = None
    db.exec.return_value = result
    payload = FinalizeCheckoutIn(sale_id=uuid4(), payment_method=PaymentMethod.CASH)
    with pytest.raises(HTTPException) as ei:
        SaleService.finalize_checkout(db, payload.sale_id, payload)
    assert ei.value.status_code == 404


def test_finalize_checkout_already_completed():
    db = _sync_db()
    sale = SimpleNamespace(
        id=uuid4(),
        status=SaleStatus.COMPLETED,
        items=[],
        business_id=uuid4(),
    )
    result = MagicMock()
    result.first.return_value = sale
    db.exec.return_value = result
    payload = FinalizeCheckoutIn(sale_id=sale.id, payment_method=PaymentMethod.CASH)
    with pytest.raises(HTTPException) as ei:
        SaleService.finalize_checkout(db, sale.id, payload)
    assert ei.value.status_code == 400
    assert "already finalized" in ei.value.detail.lower()


def test_finalize_checkout_concurrent_stock_depletion():
    """Fails inside inventory loop before broken Daily*Analytics references."""
    db = _sync_db()
    product_id = uuid4()
    sale_item = SimpleNamespace(
        product_id=product_id,
        quantity=5.0,
        subtotal=500.0,
        unit_price=100.0,
        cost_price_at_sale=10.0,
        name="Widget",
        sku="W-1",
    )
    product = _product(id=product_id, stock=1.0, track_stock=True)
    sale = SimpleNamespace(
        id=uuid4(),
        status=SaleStatus.PENDING_PAYMENT,
        items=[sale_item],
        business_id=uuid4(),
        cashier_id=uuid4(),
        customer_id=None,
        subtotal=500.0,
        discount=0.0,
        tax_amount=0.0,
        total_amount=500.0,
        business=SimpleNamespace(organization_id=uuid4()),
    )
    n = {"i": 0}

    def exec_side_effect(stmt, *a, **k):
        res = MagicMock()
        i = n["i"]
        n["i"] += 1
        if i == 0:
            res.first.return_value = sale
            return res
        if i == 1:
            res.all.return_value = [product]
            return res
        res.first.return_value = None
        return res

    db.exec.side_effect = exec_side_effect
    payload = FinalizeCheckoutIn(sale_id=sale.id, payment_method=PaymentMethod.CASH)
    with pytest.raises(HTTPException) as ei:
        SaleService.finalize_checkout(db, sale.id, payload)
    assert ei.value.status_code == 400
    assert "depleted" in ei.value.detail.lower() or "Stock" in ei.value.detail
    db.rollback.assert_called()
