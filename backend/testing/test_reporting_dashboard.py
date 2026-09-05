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
        cogs_volume=40.0,
        gross_profit=71.0,
        cash_volume=80.0,
        mpesa_volume=31.0,
        missing_cost_line_count=0,
    )
    rollup_result = MagicMock()
    rollup_result.all.return_value = [row]

    credit_result = MagicMock()
    credit_result.one.return_value = (2500.0, 3)

    expense_total_result = MagicMock()
    expense_total_result.one.return_value = (5000.0, 2)
    expense_cat_result = MagicMock()
    expense_cat_result.all.return_value = []

    mock_session.exec = AsyncMock(
        side_effect=[
            rollup_result,
            credit_result,
            expense_total_result,
            expense_cat_result,
        ]
    )

    out = await reporting_crud.dashboard(
        mock_session, business_id=uuid4(), period=AnalyticsPeriod.DAYS_7
    )
    assert "summary" in out
    assert "series" in out
    assert out["period"] == "7d"
    assert out["summary"]["net_revenue_collected"] == 111.0
    assert out["summary"]["credit_outstanding"] == 2500.0
    assert out["summary"]["open_credit_sales"] == 3
    assert out["summary"]["cash_volume"] == 80.0
    assert out["summary"]["expenses_total"] == 5000.0
    assert out["summary"]["profit_after_expenses"] == pytest.approx(71.0 - 5000.0)
    assert len(out["series"]) == 1
