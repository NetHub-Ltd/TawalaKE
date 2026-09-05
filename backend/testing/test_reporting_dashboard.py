"""Dashboard via dedicated reporting module (rollup-only)."""
from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.crud.reporting import reporting_crud
from app.utils.helpers import AnalyticsPeriod


@pytest.mark.asyncio
async def test_dashboard_from_rollups(mock_session):
    day = datetime(2026, 9, 5, tzinfo=timezone.utc)
    row = MagicMock(
        date_dimension=day,
        gross_sales_volume=100.0,
        total_tax_collected=16.0,
        total_discounts_granted=5.0,
        net_revenue_collected=111.0,
        refund_deductions_volume=0.0,
        total_completed_orders_count=2,
        deleted_at=None,
    )
    result = MagicMock()
    result.all.return_value = [row]
    mock_session.exec = AsyncMock(return_value=result)

    out = await reporting_crud.dashboard(
        mock_session, business_id=uuid4(), period=AnalyticsPeriod.DAYS_7
    )
    assert "summary" in out
    assert "series" in out
    assert out["period"] == "7d"
    assert out["summary"]["net_revenue_collected"] == 111.0
    assert len(out["series"]) == 1
