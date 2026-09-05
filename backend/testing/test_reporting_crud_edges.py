"""Edge paths for reporting resolve_window and empty product lists."""
from datetime import datetime, timezone, date
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from app.crud.reporting import ReportingCrud, resolve_window
from app.utils.helpers import AnalyticsPeriod


def test_resolve_window_naive_custom_start_end():
    start = datetime(2026, 1, 1)
    end = datetime(2026, 1, 10)
    cs, ce, ps, pe, p = resolve_window(AnalyticsPeriod.CUSTOM, start=start, end=end)
    assert cs.tzinfo is not None
    assert ce.tzinfo is not None
    assert p == AnalyticsPeriod.CUSTOM


@pytest.mark.asyncio
async def test_products_empty(mock_session):
    crud = ReportingCrud()
    res = MagicMock()
    res.all.return_value = []
    mock_session.exec = AsyncMock(return_value=res)
    out = await crud.products(mock_session, business_id=uuid4(), period=AnalyticsPeriod.DAYS_3)
    assert out.items == []


@pytest.mark.asyncio
async def test_series_empty(mock_session):
    crud = ReportingCrud()
    res = MagicMock()
    res.all.return_value = []
    mock_session.exec = AsyncMock(return_value=res)
    out = await crud.series(mock_session, business_id=uuid4(), period=AnalyticsPeriod.YESTERDAY)
    assert out.series == []
