"""Sale stock movements carry reference_id (QA P1)."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.crud.stock import StockCrud


@pytest.fixture
def stock():
    return StockCrud()


@pytest.fixture
def product():
    p = MagicMock()
    p.id = uuid4()
    p.label = "Widget"
    p.track_stock = True
    p.stock = 10.0
    p.organization_id = uuid4()
    p.business_id = uuid4()
    p.popularity_score = 1.0
    p.selling_price = 100.0
    return p


@pytest.mark.asyncio
async def test_deduction_passes_reference_id(stock, product):
    db = AsyncMock()
    sale_id = uuid4()
    hist = MagicMock()
    with patch.object(
        stock,
        "apply_movement",
        new_callable=AsyncMock,
        return_value=(product, hist, 10.0, 8.0),
    ) as mov:
        await stock.apply_sale_item_deduction(
            db,
            product=product,
            quantity=2,
            business_id=product.business_id,
            performed_by=uuid4(),
            unit_price=80,
            notes="sale",
            commit=False,
            reference_id=sale_id,
            bump_popularity=True,
        )
    kwargs = mov.await_args.kwargs
    assert kwargs.get("reference_id") == sale_id
    assert kwargs.get("reference_type") == "SALE"


@pytest.mark.asyncio
async def test_restore_uses_sale_refund_type(stock, product):
    db = AsyncMock()
    sale_id = uuid4()
    hist = MagicMock()
    with patch.object(
        stock,
        "apply_movement",
        new_callable=AsyncMock,
        return_value=(product, hist, 8.0, 10.0),
    ) as mov:
        await stock.apply_sale_item_restore(
            db,
            product=product,
            quantity=2,
            business_id=product.business_id,
            performed_by=uuid4(),
            notes="void",
            reference_id=sale_id,
            commit=False,
        )
    kwargs = mov.await_args.kwargs
    assert kwargs.get("reference_id") == sale_id
    assert kwargs.get("reference_type") == "SALE_REFUND"
    assert kwargs.get("delta") == 2.0


@pytest.mark.asyncio
async def test_deduction_skips_untracked(stock, product):
    product.track_stock = False
    db = AsyncMock()
    out_p, out_h = await stock.apply_sale_item_deduction(
        db,
        product=product,
        quantity=1,
        business_id=product.business_id,
        performed_by=None,
        unit_price=None,
        notes="x",
    )
    assert out_p is product
