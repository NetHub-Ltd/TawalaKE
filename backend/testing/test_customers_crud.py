"""Customer workspace CRUD unit smoke."""
from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.crud.customer import customer_crud
from app.models.models import SaleStatus
from app.schemas.customer import CustomerCreate


@pytest.mark.asyncio
async def test_to_response_aggregates(mock_session):
    """open_credit_total is sum of remaining balances (total - payments) on open sales."""
    customer = MagicMock()
    customer.id = uuid4()
    customer.business_id = uuid4()
    customer.organization_id = uuid4()
    customer.name = "Amina"
    customer.phone = "0712345678"
    customer.email = None
    customer.created_at = datetime.now(timezone.utc)
    customer.updated_at = customer.created_at

    # Two open sales: 1000 unpaid + 800 with 300 already paid → remaining 500 → total open 1500
    sale_a = MagicMock()
    sale_a.total_amount = 1000.0
    sale_a.payments = []
    sale_b = MagicMock()
    sale_b.total_amount = 800.0
    pay = MagicMock()
    pay.amount = 300.0
    sale_b.payments = [pay]

    open_result = MagicMock()
    open_result.all.return_value = [sale_a, sale_b]
    done_result = MagicMock()
    done_result.one.return_value = (9000.0, 5)
    mock_session.exec = AsyncMock(side_effect=[open_result, done_result])

    out = await customer_crud.to_response(mock_session, customer)
    assert out.name == "Amina"
    assert out.open_credit_total == 1500.0
    assert out.open_credit_sales_count == 2
    assert out.lifetime_revenue == 9000.0
    assert out.completed_orders_count == 5
