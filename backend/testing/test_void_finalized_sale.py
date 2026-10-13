"""Void finalized sale restores stock (QA P0)."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.crud.store import store_crud
from app.models.models import ItemType, SaleStatus


@pytest.mark.asyncio
async def test_void_already_refunded_is_idempotent():
    sale = MagicMock()
    sale.id = uuid4()
    sale.status = SaleStatus.REFUNDED
    sale.items = []
    res = MagicMock()
    res.one_or_none.return_value = sale
    db = AsyncMock()
    db.exec = AsyncMock(return_value=res)

    out = await store_crud.void_finalized_sale(
        db, sale_id=sale.id, business_id=uuid4(), performed_by=uuid4()
    )
    assert out.status == SaleStatus.REFUNDED
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_void_rejects_wrong_status():
    sale = MagicMock()
    sale.id = uuid4()
    sale.status = SaleStatus.DISPUTED
    sale.items = []
    res = MagicMock()
    res.one_or_none.return_value = sale
    db = AsyncMock()
    db.exec = AsyncMock(return_value=res)

    with pytest.raises(HTTPException) as ei:
        await store_crud.void_finalized_sale(
            db, sale_id=sale.id, business_id=uuid4(), performed_by=None
        )
    assert ei.value.status_code == 409


@pytest.mark.asyncio
async def test_void_product_line_calls_restore():
    bid = uuid4()
    sale_id = uuid4()
    item = MagicMock()
    item.product_id = uuid4()
    item.quantity = 2.0
    item.quantity_refunded = 0.0

    sale = MagicMock()
    sale.id = sale_id
    sale.status = SaleStatus.COMPLETED
    sale.items = [item]
    sale.business_id = bid

    product = MagicMock()
    product.id = item.product_id
    product.item_type = ItemType.PRODUCT
    product.track_stock = True

    sale_res = MagicMock()
    sale_res.one_or_none.return_value = sale
    prod_res = MagicMock()
    prod_res.one_or_none.return_value = product

    db = AsyncMock()
    db.exec = AsyncMock(side_effect=[sale_res, prod_res])
    db.add = MagicMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()

    with (
        patch(
            "app.crud.stock.stock_crud.apply_sale_item_restore",
            new_callable=AsyncMock,
        ) as restore,
        patch(
            "app.services.analytics_rollup.apply_refund_to_rollups",
            new_callable=AsyncMock,
        ),
    ):
        await store_crud.void_finalized_sale(
            db, sale_id=sale_id, business_id=bid, performed_by=uuid4(), reason="test"
        )

    restore.assert_awaited()
    assert sale.status == SaleStatus.REFUNDED
    assert float(item.quantity_refunded) == 2.0


def test_normalize_service_lines_instance_method():
    out = store_crud._normalize_service_lines(
        [{"description": "Delivery", "amount": 50}]
    )
    assert out == [{"description": "Delivery", "amount": 50.0}]
    assert store_crud._normalize_service_lines(None) == []
    assert store_crud._normalize_service_lines(
        {"description": "Fee", "amount": 10}
    ) == [{"description": "Fee", "amount": 10.0}]
    assert store_crud._normalize_service_lines([{"description": "", "amount": 5}]) == []
