"""Unit tests for pre-aggregated analytics writer and helpers."""
from __future__ import annotations

from datetime import datetime, timezone, timedelta, date
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.services.analytics_rollup import (
    REDIS_CHANNEL_PREFIX,
    _line_cogs,
    _line_revenue,
    _utc_day_floor,
    _utc_hour_floor,
    apply_sale_to_rollups,
    backfill_business_rollups,
    publish_rollup_event,
    sale_event_time,
)
from app.models.models import SaleStatus
from app.utils.helpers import AnalyticsPeriod, period_windows, aggregate_rows
from app.crud.reporting import resolve_window, _margin, ReportingCrud


def test_utc_day_and_hour_floor():
    dt = datetime(2026, 9, 5, 15, 45, 12, tzinfo=timezone.utc)
    assert _utc_day_floor(dt) == datetime(2026, 9, 5, tzinfo=timezone.utc)
    assert _utc_hour_floor(dt) == datetime(2026, 9, 5, 15, tzinfo=timezone.utc)
    naive = datetime(2026, 1, 2, 3, 4, 5)
    assert _utc_day_floor(naive).tzinfo is not None


def test_sale_event_time_prefers_updated_at():
    sale = MagicMock()
    sale.updated_at = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)
    sale.created_at = datetime(2026, 2, 1, 12, 0, tzinfo=timezone.utc)
    assert sale_event_time(sale).month == 3
    sale.updated_at = None
    sale.created_at = datetime(2026, 2, 1, 12, 0)
    assert sale_event_time(sale).tzinfo is not None


def test_line_cogs_and_revenue():
    item = MagicMock()
    item.cost_price_at_sale = 10.0
    item.quantity = 3
    item.subtotal = 50.0
    assert _line_cogs(item) == 30.0
    assert _line_revenue(item) == 50.0
    item.cost_price_at_sale = None
    assert _line_cogs(item) == 0.0


def test_margin_helper():
    assert _margin(25, 100) == 25.0
    assert _margin(0, 0) == 0.0


def test_period_windows_presets():
    now = datetime(2026, 9, 5, 10, 0, tzinfo=timezone.utc)
    for p in (
        AnalyticsPeriod.TODAY,
        AnalyticsPeriod.YESTERDAY,
        AnalyticsPeriod.DAYS_3,
        AnalyticsPeriod.DAYS_7,
        AnalyticsPeriod.MONTH,
    ):
        cs, ce, ps, pe = period_windows(p, now=now)
        assert cs < ce
        assert ps < pe


def test_resolve_window_date_and_custom():
    d = date(2026, 9, 1)
    cs, ce, ps, pe, period = resolve_window(AnalyticsPeriod.DAYS_7, date_value=d)
    assert period == AnalyticsPeriod.CUSTOM
    assert (ce - cs).days == 1
    start = datetime(2026, 8, 1, tzinfo=timezone.utc)
    end = datetime(2026, 8, 8, tzinfo=timezone.utc)
    cs, ce, ps, pe, period = resolve_window(
        AnalyticsPeriod.CUSTOM, start=start, end=end
    )
    assert cs == start and ce == end
    with pytest.raises(ValueError):
        resolve_window(AnalyticsPeriod.CUSTOM, start=start, end=None)


def test_aggregate_rows():
    row = MagicMock(
        gross_sales_volume=10,
        total_tax_collected=1,
        total_discounts_granted=2,
        net_revenue_collected=9,
        refund_deductions_volume=0,
        total_completed_orders_count=3,
    )
    out = aggregate_rows([row, row])
    assert out["total_completed_orders_count"] == 6
    assert out["net_revenue_collected"] == 18


@pytest.mark.asyncio
async def test_apply_sale_skips_non_completed(mock_session):
    sale = MagicMock()
    sale.status = SaleStatus.PENDING_PAYMENT
    result = MagicMock()
    result.one_or_none.return_value = sale
    mock_session.exec.return_value = result
    out = await apply_sale_to_rollups(mock_session, uuid4(), sign=1)
    assert out is None


@pytest.mark.asyncio
async def test_apply_sale_to_rollups_completed(mock_session):
    sale_id = uuid4()
    biz_id = uuid4()
    staff_id = uuid4()
    product_id = uuid4()
    sale = MagicMock()
    sale.id = sale_id
    sale.status = SaleStatus.COMPLETED
    sale.business_id = biz_id
    sale.organization_id = uuid4()
    sale.cashier_id = staff_id
    sale.subtotal = 100.0
    sale.tax_amount = 16.0
    sale.discount = 5.0
    sale.total_amount = 111.0
    sale.updated_at = datetime(2026, 9, 5, 14, 30, tzinfo=timezone.utc)
    sale.created_at = sale.updated_at

    item = MagicMock()
    item.product_id = product_id
    item.sku = "SKU1"
    item.name = "Widget"
    item.quantity = 2
    item.subtotal = 100.0
    item.cost_price_at_sale = 20.0

    sale_result = MagicMock()
    sale_result.one_or_none.return_value = sale
    items_result = MagicMock()
    items_result.all.return_value = [item]

    # exec called multiple times: load sale, load items, then inserts
    mock_session.exec = AsyncMock(
        side_effect=[sale_result, items_result] + [MagicMock()] * 10
    )
    mock_session.flush = AsyncMock()

    with patch("app.services.analytics_rollup.pg_insert") as pg:
        insert_mock = MagicMock()
        insert_mock.values.return_value = insert_mock
        insert_mock.on_conflict_do_update.return_value = insert_mock
        insert_mock.excluded = MagicMock()
        pg.return_value = insert_mock
        out = await apply_sale_to_rollups(mock_session, sale_id, sign=1)

    assert out is not None
    assert out["type"] == "analytics.rollup.updated"
    assert out["business_id"] == str(biz_id)
    assert "hourly" in out["scopes"]
    assert out["date"] == "2026-09-05"


@pytest.mark.asyncio
async def test_publish_rollup_event():
    redis = AsyncMock()
    payload = {"business_id": str(uuid4()), "type": "analytics.rollup.updated"}
    await publish_rollup_event(redis, payload)
    redis.publish.assert_awaited()
    channel = redis.publish.call_args[0][0]
    assert channel.startswith(REDIS_CHANNEL_PREFIX)
    await publish_rollup_event(None, payload)
    await publish_rollup_event(redis, None)


@pytest.mark.asyncio
async def test_backfill_business_rollups(mock_session):
    biz = uuid4()
    sale = MagicMock()
    sale.id = uuid4()
    sale.status = SaleStatus.COMPLETED
    sales_result = MagicMock()
    sales_result.all.return_value = [sale]
    empty = MagicMock()
    empty.all.return_value = []
    mock_session.exec = AsyncMock(side_effect=[sales_result, empty, empty, empty, empty])
    mock_session.delete = AsyncMock()
    mock_session.flush = AsyncMock()
    mock_session.commit = AsyncMock()

    with patch(
        "app.services.analytics_rollup.apply_sale_to_rollups",
        new_callable=AsyncMock,
        return_value={"ok": True},
    ) as apply:
        out = await backfill_business_rollups(mock_session, business_id=biz)
    assert out["sales_scanned"] == 1
    assert out["sales_applied"] == 1
    apply.assert_awaited()


@pytest.mark.asyncio
async def test_reporting_overview_series_products_staff_insights(mock_session):
    crud = ReportingCrud()
    biz = uuid4()

    # overview sum query returns one tuple
    sum_row = (100.0, 16.0, 5.0, 111.0, 0.0, 2, 40.0, 71.0)
    sum_result = MagicMock()
    sum_result.one.return_value = sum_row

    # series rows
    day = datetime(2026, 9, 5, tzinfo=timezone.utc)
    daily = MagicMock(
        date_dimension=day,
        gross_sales_volume=100,
        net_revenue_collected=111,
        cogs_volume=40,
        gross_profit=71,
        total_completed_orders_count=2,
        total_discounts_granted=5,
    )
    series_result = MagicMock()
    series_result.all.return_value = [daily]

    # hourly
    hour_row = MagicMock(
        hour_dimension=datetime(2026, 9, 5, 14, tzinfo=timezone.utc),
        net_revenue_collected=50,
        gross_profit=30,
        total_completed_orders_count=1,
    )
    hourly_result = MagicMock()
    hourly_result.all.return_value = [hour_row]

    # products group
    pid = uuid4()
    prod_result = MagicMock()
    prod_result.all.return_value = [(pid, "SKU", "Name", 5.0, 200.0, 50.0, 150.0)]

    # staff group + staff name lookup
    sid = uuid4()
    staff_sum = MagicMock()
    staff_sum.all.return_value = [(sid, 3, 300.0, 80.0, 220.0)]
    staff_obj = MagicMock()
    staff_obj.id = sid
    staff_obj.full_name = "Aisha"
    staff_obj.email = "a@test.com"
    staff_name_result = MagicMock()
    staff_name_result.all.return_value = [staff_obj]

    mock_session.exec = AsyncMock(
        side_effect=[
            sum_result,  # overview current
            sum_result,  # overview previous
            series_result,
            hourly_result,
            prod_result,
            staff_sum,
            staff_name_result,
            # insights calls overview+products again
            sum_result,
            sum_result,
            prod_result,
        ]
    )

    overview = await crud.overview(mock_session, business_id=biz, period=AnalyticsPeriod.DAYS_7)
    assert overview.current.orders == 2
    assert overview.current.gross_profit == 71.0
    assert "net_revenue_pct" in overview.deltas

    series = await crud.series(mock_session, business_id=biz, period=AnalyticsPeriod.DAYS_7)
    assert len(series.series) == 1

    hourly = await crud.hourly(mock_session, business_id=biz)
    assert len(hourly.series) == 1

    products = await crud.products(mock_session, business_id=biz, period=AnalyticsPeriod.DAYS_7)
    assert products.items[0].name == "Name"
    assert products.items[0].margin_pct > 0

    staff = await crud.staff(mock_session, business_id=biz, period=AnalyticsPeriod.DAYS_7)
    assert staff.items[0].full_name == "Aisha"

    insights = await crud.insights(mock_session, business_id=biz, period=AnalyticsPeriod.DAYS_7)
    assert insights.insights is not None


def test_period_windows_month_january():
    now = datetime(2026, 1, 15, 12, 0, tzinfo=timezone.utc)
    cs, ce, ps, pe = period_windows(AnalyticsPeriod.MONTH, now=now)
    assert cs.month == 1 and cs.day == 1
    assert ps.month == 12 and ps.year == 2025


@pytest.mark.asyncio
async def test_insights_no_sales(mock_session):
    crud = ReportingCrud()
    zero = (0.0, 0.0, 0.0, 0.0, 0.0, 0, 0.0, 0.0)
    sum_result = MagicMock()
    sum_result.one.return_value = zero
    prod_result = MagicMock()
    prod_result.all.return_value = []
    mock_session.exec = AsyncMock(side_effect=[sum_result, sum_result, prod_result])
    insights = await crud.insights(
        mock_session, business_id=uuid4(), period=AnalyticsPeriod.TODAY
    )
    codes = [i.code for i in insights.insights]
    assert "no_sales" in codes


@pytest.mark.asyncio
async def test_apply_sale_missing_sale(mock_session):
    result = MagicMock()
    result.one_or_none.return_value = None
    mock_session.exec.return_value = result
    assert await apply_sale_to_rollups(mock_session, uuid4()) is None
