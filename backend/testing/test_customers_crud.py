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
    customer = MagicMock()
    customer.id = uuid4()
    customer.business_id = uuid4()
    customer.organization_id = uuid4()
    customer.name = "Amina"
    customer.phone = "0712345678"
    customer.email = None
    customer.created_at = datetime.now(timezone.utc)
    customer.updated_at = customer.created_at

    open_result = MagicMock()
    open_result.one.return_value = (1500.0, 2)
    done_result = MagicMock()
    done_result.one.return_value = (9000.0, 5)
    mock_session.exec = AsyncMock(side_effect=[open_result, done_result])

    out = await customer_crud.to_response(mock_session, customer)
    assert out.name == "Amina"
    assert out.open_credit_total == 1500.0
    assert out.open_credit_sales_count == 2
    assert out.lifetime_revenue == 9000.0
    assert out.completed_orders_count == 5
