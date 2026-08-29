"""Unit tests for stock_crud — central stock mutations."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi import HTTPException

from app.crud.stock import StockCrud, ProductAdjustRequest
from app.models.models import StockMovementType


@pytest.fixture
def stock():
    return StockCrud()


@pytest.fixture
def product():
    p = MagicMock()
    p.id = uuid4()
    p.business_id = uuid4()
    p.organization_id = uuid4()
    p.label = "Milk 500ml"
    p.stock = 23.0
    p.track_stock = True
    p.cost_price = 50.0
    p.selling_price = 80.0
    p.popularity_score = 0.0
    p.last_stock_take = None
    return p


@pytest.mark.asyncio
async def test_apply_movement_increases_stock(stock, product):
    db = AsyncMock()
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    prod, hist, before, after = await stock.apply_movement(
        db,
        product=product,
        delta=10,
        movement_type=StockMovementType.STOCK_TAKE,
        performed_by=uuid4(),
        organization_id=product.organization_id,
        business_id=product.business_id,
        commit=True,
    )
    assert before == 23.0
    assert after == 33.0
    assert product.stock == 33.0
    db.commit.assert_awaited()


@pytest.mark.asyncio
async def test_apply_movement_rejects_negative(stock, product):
    db = AsyncMock()
    db.add = MagicMock()
    with pytest.raises(HTTPException) as ei:
        await stock.apply_movement(
            db,
            product=product,
            delta=-100,
            movement_type=StockMovementType.ADJUSTMENT,
            performed_by=uuid4(),
            organization_id=product.organization_id,
            business_id=product.business_id,
            commit=False,
        )
    assert ei.value.status_code == 409


@pytest.mark.asyncio
async def test_adjust_signed_delta():
    p = ProductAdjustRequest(
        product_id=uuid4(),
        business_id=uuid4(),
        quantity=2,
        direction="decrease",
        reason_code="DAMAGED",
    )
    assert p.signed_delta() == -2.0
    p2 = ProductAdjustRequest(
        product_id=uuid4(),
        business_id=uuid4(),
        quantity=5,
        direction="increase",
        reason_code="FOUND",
    )
    assert p2.signed_delta() == 5.0


@pytest.mark.asyncio
async def test_sale_deduction_insufficient(stock, product):
    db = AsyncMock()
    product.stock = 1
    with pytest.raises(HTTPException) as ei:
        await stock.apply_sale_item_deduction(
            db,
            product=product,
            quantity=5,
            business_id=product.business_id,
            performed_by=uuid4(),
            unit_price=80,
            notes="test",
            commit=False,
        )
    assert ei.value.status_code == 409
