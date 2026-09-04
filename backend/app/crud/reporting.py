"""Read path for pre-aggregated analytics (no runtime sale_item scans for graphs)."""
from __future__ import annotations

from datetime import datetime, timezone, timedelta, date
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlmodel import select, col, func
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.models import (
    BusinessSalesHourly,
    ProductSalesSummary,
    SaleAnalyticsSummary,
    Staff,
    StaffSalesSummary,
)
from app.schemas.reporting import (
    HourlyPoint,
    HourlyResponse,
    InsightCard,
    InsightsResponse,
    OverviewMetrics,
    OverviewResponse,
    ProductRow,
    ProductsResponse,
    ReportWindow,
    SeriesPoint,
    SeriesResponse,
    StaffResponse,
    StaffRow,
)
from app.utils.helpers import AnalyticsPeriod, period_windows


def _margin(profit: float, revenue: float) -> float:
    if revenue <= 0:
        return 0.0
    return round((profit / revenue) * 100.0, 2)


def resolve_window(
    period: AnalyticsPeriod,
    *,
    date_value: Optional[date] = None,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    now: Optional[datetime] = None,
) -> Tuple[datetime, datetime, Optional[datetime], Optional[datetime], AnalyticsPeriod]:
    """
    Returns current_start, current_end, previous_start, previous_end, period.
    Custom: start/end required (half-open [start, end)).
    Single date: that UTC calendar day.
    """
    now = now or datetime.now(timezone.utc)
    if date_value is not None:
        day = datetime(date_value.year, date_value.month, date_value.day, tzinfo=timezone.utc)
        return day, day + timedelta(days=1), day - timedelta(days=1), day, AnalyticsPeriod.CUSTOM
    if period == AnalyticsPeriod.CUSTOM or (start is not None and end is not None):
        if start is None or end is None:
            raise ValueError("custom range requires start and end")
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        delta = end - start
        return start, end, start - delta, start, AnalyticsPeriod.CUSTOM
    cs, ce, ps, pe = period_windows(period, now=now)
    return cs, ce, ps, pe, period


async def _sum_business_daily(
    db: AsyncSession, business_id: UUID, start: datetime, end: datetime
) -> OverviewMetrics:
    stmt = (
        select(
            func.coalesce(func.sum(SaleAnalyticsSummary.gross_sales_volume), 0.0),
            func.coalesce(func.sum(SaleAnalyticsSummary.total_tax_collected), 0.0),
            func.coalesce(func.sum(SaleAnalyticsSummary.total_discounts_granted), 0.0),
            func.coalesce(func.sum(SaleAnalyticsSummary.net_revenue_collected), 0.0),
            func.coalesce(func.sum(SaleAnalyticsSummary.refund_deductions_volume), 0.0),
            func.coalesce(func.sum(SaleAnalyticsSummary.total_completed_orders_count), 0),
            func.coalesce(func.sum(SaleAnalyticsSummary.cogs_volume), 0.0),
            func.coalesce(func.sum(SaleAnalyticsSummary.gross_profit), 0.0),
        )
        .where(SaleAnalyticsSummary.business_id == business_id)
        .where(SaleAnalyticsSummary.date_dimension >= start)
        .where(SaleAnalyticsSummary.date_dimension < end)
    )
    row = (await db.exec(stmt)).one()
    gross, tax, disc, net, refunds, orders, cogs, gp = row
    orders = int(orders or 0)
    net = float(net or 0)
    return OverviewMetrics(
        orders=orders,
        gross_sales=float(gross or 0),
        discounts=float(disc or 0),
        tax=float(tax or 0),
        net_revenue=net,
        cogs=float(cogs or 0),
        gross_profit=float(gp or 0),
        gross_margin_pct=_margin(float(gp or 0), net),
        average_order_value=round(net / orders, 2) if orders else 0.0,
        refunds=float(refunds or 0),
    )


def _deltas(cur: OverviewMetrics, prev: OverviewMetrics) -> Dict[str, float]:
    out: Dict[str, float] = {}
    for field in ("net_revenue", "gross_profit", "orders", "gross_sales"):
        c = float(getattr(cur, field))
        p = float(getattr(prev, field))
        out[f"{field}_abs"] = round(c - p, 2)
        out[f"{field}_pct"] = round(((c - p) / p) * 100.0, 2) if p else (100.0 if c else 0.0)
    return out


class ReportingCrud:
    async def overview(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        period: AnalyticsPeriod = AnalyticsPeriod.DAYS_7,
        date_value: Optional[date] = None,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> OverviewResponse:
        cs, ce, ps, pe, period = resolve_window(
            period, date_value=date_value, start=start, end=end
        )
        current = await _sum_business_daily(db, business_id, cs, ce)
        previous = None
        deltas: Dict[str, float] = {}
        prev_win = None
        if ps is not None and pe is not None:
            previous = await _sum_business_daily(db, business_id, ps, pe)
            deltas = _deltas(current, previous)
            prev_win = ReportWindow(start=ps, end=pe)
        return OverviewResponse(
            period=period,
            window=ReportWindow(start=cs, end=ce),
            previous_window=prev_win,
            current=current,
            previous=previous,
            deltas=deltas,
        )

    async def series(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        period: AnalyticsPeriod = AnalyticsPeriod.DAYS_7,
        date_value: Optional[date] = None,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> SeriesResponse:
        cs, ce, _, _, period = resolve_window(
            period, date_value=date_value, start=start, end=end
        )
        stmt = (
            select(SaleAnalyticsSummary)
            .where(SaleAnalyticsSummary.business_id == business_id)
            .where(SaleAnalyticsSummary.date_dimension >= cs)
            .where(SaleAnalyticsSummary.date_dimension < ce)
            .order_by(col(SaleAnalyticsSummary.date_dimension).asc())
        )
        rows = (await db.exec(stmt)).all()
        points = [
            SeriesPoint(
                date=r.date_dimension.date(),
                date_dimension=r.date_dimension,
                gross_sales=float(r.gross_sales_volume or 0),
                net_revenue=float(r.net_revenue_collected or 0),
                cogs=float(getattr(r, "cogs_volume", 0) or 0),
                gross_profit=float(getattr(r, "gross_profit", 0) or 0),
                orders=int(r.total_completed_orders_count or 0),
                discounts=float(r.total_discounts_granted or 0),
            )
            for r in rows
        ]
        return SeriesResponse(
            period=period, window=ReportWindow(start=cs, end=ce), series=points
        )

    async def hourly(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> HourlyResponse:
        now = datetime.now(timezone.utc)
        if start is None:
            start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
        if end is None:
            end = start + timedelta(days=1)
        stmt = (
            select(BusinessSalesHourly)
            .where(BusinessSalesHourly.business_id == business_id)
            .where(BusinessSalesHourly.hour_dimension >= start)
            .where(BusinessSalesHourly.hour_dimension < end)
            .order_by(col(BusinessSalesHourly.hour_dimension).asc())
        )
        rows = (await db.exec(stmt)).all()
        return HourlyResponse(
            window=ReportWindow(start=start, end=end),
            series=[
                HourlyPoint(
                    hour=r.hour_dimension,
                    net_revenue=float(r.net_revenue_collected or 0),
                    gross_profit=float(r.gross_profit or 0),
                    orders=int(r.total_completed_orders_count or 0),
                )
                for r in rows
            ],
        )

    async def products(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        period: AnalyticsPeriod = AnalyticsPeriod.DAYS_7,
        date_value: Optional[date] = None,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        limit: int = 20,
        order_by: str = "revenue",
    ) -> ProductsResponse:
        cs, ce, _, _, _ = resolve_window(
            period, date_value=date_value, start=start, end=end
        )
        stmt = (
            select(
                ProductSalesSummary.product_id,
                func.max(ProductSalesSummary.sku),
                func.max(ProductSalesSummary.name),
                func.coalesce(func.sum(ProductSalesSummary.quantity_sold), 0.0),
                func.coalesce(func.sum(ProductSalesSummary.revenue), 0.0),
                func.coalesce(func.sum(ProductSalesSummary.cogs), 0.0),
                func.coalesce(func.sum(ProductSalesSummary.gross_profit), 0.0),
            )
            .where(ProductSalesSummary.business_id == business_id)
            .where(ProductSalesSummary.date_dimension >= cs)
            .where(ProductSalesSummary.date_dimension < ce)
            .group_by(ProductSalesSummary.product_id)
        )
        rows = (await db.exec(stmt)).all()
        items = [
            ProductRow(
                product_id=str(pid),
                sku=sku or "",
                name=name or "",
                quantity_sold=float(qty or 0),
                revenue=float(rev or 0),
                cogs=float(cogs or 0),
                gross_profit=float(gp or 0),
                margin_pct=_margin(float(gp or 0), float(rev or 0)),
            )
            for pid, sku, name, qty, rev, cogs, gp in rows
        ]
        key = {
            "revenue": lambda x: x.revenue,
            "gross_profit": lambda x: x.gross_profit,
            "quantity_sold": lambda x: x.quantity_sold,
        }.get(order_by, lambda x: x.revenue)
        items.sort(key=key, reverse=True)
        return ProductsResponse(
            window=ReportWindow(start=cs, end=ce), items=items[: max(1, min(limit, 100))]
        )

    async def staff(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        period: AnalyticsPeriod = AnalyticsPeriod.DAYS_7,
        date_value: Optional[date] = None,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
        limit: int = 50,
    ) -> StaffResponse:
        cs, ce, _, _, _ = resolve_window(
            period, date_value=date_value, start=start, end=end
        )
        stmt = (
            select(
                StaffSalesSummary.staff_id,
                func.coalesce(func.sum(StaffSalesSummary.orders_count), 0),
                func.coalesce(func.sum(StaffSalesSummary.revenue), 0.0),
                func.coalesce(func.sum(StaffSalesSummary.cogs), 0.0),
                func.coalesce(func.sum(StaffSalesSummary.gross_profit), 0.0),
            )
            .where(StaffSalesSummary.business_id == business_id)
            .where(StaffSalesSummary.date_dimension >= cs)
            .where(StaffSalesSummary.date_dimension < ce)
            .group_by(StaffSalesSummary.staff_id)
        )
        rows = (await db.exec(stmt)).all()
        total_rev = sum(float(r[2] or 0) for r in rows) or 0.0
        # names
        ids = [r[0] for r in rows]
        names: Dict[str, str] = {}
        if ids:
            staff_rows = (
                await db.exec(select(Staff).where(col(Staff.id).in_(ids)))
            ).all()
            names = {str(s.id): (s.full_name or s.email or "") for s in staff_rows}

        items: List[StaffRow] = []
        for sid, orders, rev, cogs, gp in rows:
            rev_f = float(rev or 0)
            orders_i = int(orders or 0)
            items.append(
                StaffRow(
                    staff_id=str(sid),
                    full_name=names.get(str(sid), ""),
                    orders=orders_i,
                    revenue=rev_f,
                    cogs=float(cogs or 0),
                    gross_profit=float(gp or 0),
                    avg_ticket=round(rev_f / orders_i, 2) if orders_i else 0.0,
                    revenue_share_pct=round((rev_f / total_rev) * 100.0, 2)
                    if total_rev
                    else 0.0,
                )
            )
        items.sort(key=lambda x: x.revenue, reverse=True)
        return StaffResponse(
            window=ReportWindow(start=cs, end=ce), items=items[: max(1, min(limit, 100))]
        )

    async def insights(
        self,
        db: AsyncSession,
        *,
        business_id: UUID,
        period: AnalyticsPeriod = AnalyticsPeriod.DAYS_7,
        date_value: Optional[date] = None,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None,
    ) -> InsightsResponse:
        overview = await self.overview(
            db,
            business_id=business_id,
            period=period,
            date_value=date_value,
            start=start,
            end=end,
        )
        products = await self.products(
            db,
            business_id=business_id,
            period=period,
            date_value=date_value,
            start=start,
            end=end,
            limit=10,
            order_by="revenue",
        )
        cards: List[InsightCard] = []
        if overview.previous and overview.deltas:
            rev_pct = overview.deltas.get("net_revenue_pct", 0)
            if rev_pct <= -15:
                cards.append(
                    InsightCard(
                        code="revenue_down",
                        severity="warning",
                        title="Revenue down vs previous period",
                        detail=f"Net revenue is {rev_pct}% lower than the previous window. Review top products and staffing on slow days.",
                        metric=rev_pct,
                    )
                )
            elif rev_pct >= 15:
                cards.append(
                    InsightCard(
                        code="revenue_up",
                        severity="info",
                        title="Revenue up vs previous period",
                        detail=f"Net revenue is {rev_pct}% higher than the previous window. Protect stock on top sellers.",
                        metric=rev_pct,
                    )
                )
            gp_pct = overview.deltas.get("gross_profit_pct", 0)
            if gp_pct <= -15 and overview.current.gross_profit >= 0:
                cards.append(
                    InsightCard(
                        code="gross_profit_down",
                        severity="warning",
                        title="Gross profit down",
                        detail=f"Gross profit (before expenses) is {gp_pct}% lower than the previous window.",
                        metric=gp_pct,
                    )
                )

        if products.items:
            top = products.items[0]
            if top.revenue > 0 and top.margin_pct < 15:
                cards.append(
                    InsightCard(
                        code="low_margin_top_sku",
                        severity="warning",
                        title="Top seller has thin margin",
                        detail=f"“{top.name}” leads revenue but gross margin is {top.margin_pct}%. Review cost or selling price.",
                        metric=top.margin_pct,
                    )
                )
            total_rev = sum(p.revenue for p in products.items) or 1.0
            if top.revenue / total_rev >= 0.4:
                cards.append(
                    InsightCard(
                        code="concentration_risk",
                        severity="info",
                        title="Sales concentrated on one product",
                        detail=f"“{top.name}” is a large share of product revenue in this window — stockouts hurt harder.",
                        metric=round((top.revenue / total_rev) * 100, 1),
                    )
                )

        if overview.current.orders == 0:
            cards.append(
                InsightCard(
                    code="no_sales",
                    severity="info",
                    title="No completed sales in this window",
                    detail="Rollups show zero orders. Confirm the period or run a backfill if sales exist.",
                )
            )

        return InsightsResponse(window=overview.window, insights=cards[:10])


reporting_crud = ReportingCrud()
