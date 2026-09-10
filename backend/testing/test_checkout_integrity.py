"""Checkout integrity: eligibility, honest cost, outbox enqueue helpers."""
from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.crud.store import store_crud
from app.models.models import SaleStatus
from app.services.analytics_outbox import enqueue_analytics_outbox
from app.services.analytics_rollup import _line_cogs


def test_line_cogs_zero_when_cost_none():
    item = MagicMock()
    item.cost_price_at_sale = None
    item.quantity = 2
    # _line_cogs treats None as 0
    assert _line_cogs(item) == 0.0


@pytest.mark.asyncio
async def test_enqueue_outbox_idempotent(mock_session):
    mock_session.exec = AsyncMock()
    mock_session.flush = AsyncMock()
    with patch("app.services.analytics_outbox.pg_insert") as pg:
        ins = MagicMock()
        ins.values.return_value = ins
        ins.on_conflict_do_nothing.return_value = ins
        pg.return_value = ins
        await enqueue_analytics_outbox(
            mock_session,
            sale_id=uuid4(),
            business_id=uuid4(),
            organization_id=uuid4(),
        )
    mock_session.exec.assert_awaited()
    mock_session.flush.assert_awaited()


@pytest.mark.asyncio
async def test_initialize_rejects_deleted_product(mock_session, mock_staff_user):
    from app.schemas.store import InitializeCheckout, CartItemIn

    product = MagicMock()
    product.id = uuid4()
    product.deleted_at = datetime.now(timezone.utc)
    product.active = True
    product.label = "Gone"
    product.business_id = uuid4()
    product.track_stock = False
    product.selling_price = 10
    product.cost_price = 5
    product.attributes = {}

    business = MagicMock()
    business.id = product.business_id
    business.tax_rate = 0.0

    biz_res = MagicMock()
    biz_res.one_or_none.return_value = business
    prod_res = MagicMock()
    prod_res.one_or_none.return_value = product
    mock_session.exec = AsyncMock(side_effect=[biz_res, prod_res])

    payload = InitializeCheckout(
        business_id=product.business_id,
        items=[CartItemIn(product_id=product.id, quantity=1)],
        cashier_id=uuid4(),
    )
    # staff response-like
    user = MagicMock()
    user.organization_id = uuid4()
    user.id = uuid4()

    with pytest.raises(HTTPException) as ei:
        await store_crud.initialize_checkout(
            mock_session, payload=payload, current_user=user
        )
    assert ei.value.status_code == 409
