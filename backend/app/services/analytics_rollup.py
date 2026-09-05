"""
Pre-aggregated analytics writer + backfill + Redis fanout for dashboard WS.

Grain:
  - business × day  → sale_analytics_summaries
  - business × day × product → product_sales_summaries
  - business × day × staff → staff_sales_summaries
  - business × hour → business_sales_hourly

Hot path: apply_sale_to_rollups(sale_id) after COMPLETED sale.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Sequence
from uuid import UUID

from loguru import logger
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.models import (
    BusinessSalesHourly,
    Payment,
    PaymentMethod,
    ProductSalesSummary,
    Sale,
    SaleAnalyticsSummary,
    SaleItem,
    SaleStatus,
    StaffSalesSummary,
)

REDIS_CHANNEL_PREFIX = "analytics:business:"


def _utc_day_floor(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
    return datetime(dt.year, dt.month, dt.day, tzinfo=timezone.utc)


def _utc_hour_floor(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
    return datetime(dt.year, dt.month, dt.day, dt.hour, tzinfo=timezone.utc)


def sale_event_time(sale: Sale) -> datetime:
    """Prefer updated_at when completed; fall back to created_at."""
    ts = getattr(sale, "updated_at", None) or getattr(sale, "created_at", None)
    if ts is None:
        return datetime.now(timezone.utc)
    if ts.tzinfo is None:
        return ts.replace(tzinfo=timezone.utc)
    return ts


async def _load_sale_bundle(
    db: AsyncSession, sale_id: UUID
) -> tuple[Optional[Sale], Sequence[SaleItem]]:
    sale_res = await db.exec(select(Sale).where(Sale.id == sale_id))
    sale = sale_res.one_or_none()
    if not sale:
        return None, []
    items_res = await db.exec(select(SaleItem).where(SaleItem.sale_id == sale_id))
    return sale, items_res.all()


def _line_cogs(item: SaleItem) -> float:
    cost = item.cost_price_at_sale
    if cost is None:
        return 0.0
    return float(cost) * float(item.quantity or 0)


def _line_revenue(item: SaleItem) -> float:
    return float(item.subtotal or 0)


async def apply_sale_to_rollups(
    db: AsyncSession,
    sale_id: UUID,
    *,
    sign: int = 1,
) -> Optional[Dict[str, Any]]:
    """
    Increment (sign=+1) or reverse (sign=-1) rollups for a completed sale.
    Returns event payload for WebSocket/Redis, or None if skipped.
    """
    sale, items = await _load_sale_bundle(db, sale_id)
    if not sale or sale.status != SaleStatus.COMPLETED:
        return None

    event_ts = sale_event_time(sale)
    day = _utc_day_floor(event_ts)
    hour = _utc_hour_floor(event_ts)

    # Known COGS only — null cost_price_at_sale does not invent selling_price as cost
    total_cogs = 0.0
    missing_cost_lines = 0
    for i in items:
        if i.cost_price_at_sale is None:
            missing_cost_lines += 1
        else:
            total_cogs += _line_cogs(i)
    gross_profit = float(sale.total_amount or 0) - total_cogs
    subtotal = float(sale.subtotal or 0)
    tax = float(getattr(sale, "tax_amount", 0) or 0)
    discount = float(getattr(sale, "discount", 0) or 0)
    net = float(sale.total_amount or 0)
    s = float(sign)

    # Payment mix from Payment rows (collected only)
    cash_vol = mpesa_vol = 0.0
    pay_res = await db.exec(select(Payment).where(Payment.sale_id == sale.id))
    for pay in pay_res.all():
        method = getattr(pay.method, "value", str(pay.method or "")).upper()
        amt = float(pay.amount or 0) * s
        if method == "CASH":
            cash_vol += amt
        elif method == "MPESA":
            mpesa_vol += amt

    # --- Business daily ---
    biz_values = {
        "business_id": sale.business_id,
        "date_dimension": day,
        "gross_sales_volume": s * subtotal,
        "total_tax_collected": s * tax,
        "total_discounts_granted": s * discount,
        "net_revenue_collected": s * net,
        "refund_deductions_volume": 0.0,
        "total_completed_orders_count": int(s * 1),
        "cogs_volume": s * total_cogs,
        "gross_profit": s * gross_profit,
        "cash_volume": cash_vol,
        "mpesa_volume": mpesa_vol,
        "missing_cost_line_count": int(s * missing_cost_lines),
    }
    stmt = pg_insert(SaleAnalyticsSummary).values(**biz_values)
    stmt = stmt.on_conflict_do_update(
        index_elements=["business_id", "date_dimension"],
        set_={
            "gross_sales_volume": SaleAnalyticsSummary.gross_sales_volume
            + stmt.excluded.gross_sales_volume,
            "total_tax_collected": SaleAnalyticsSummary.total_tax_collected
            + stmt.excluded.total_tax_collected,
            "total_discounts_granted": SaleAnalyticsSummary.total_discounts_granted
            + stmt.excluded.total_discounts_granted,
            "net_revenue_collected": SaleAnalyticsSummary.net_revenue_collected
            + stmt.excluded.net_revenue_collected,
            "total_completed_orders_count": SaleAnalyticsSummary.total_completed_orders_count
            + stmt.excluded.total_completed_orders_count,
            "cogs_volume": SaleAnalyticsSummary.cogs_volume + stmt.excluded.cogs_volume,
            "gross_profit": SaleAnalyticsSummary.gross_profit + stmt.excluded.gross_profit,
            "cash_volume": SaleAnalyticsSummary.cash_volume + stmt.excluded.cash_volume,
            "mpesa_volume": SaleAnalyticsSummary.mpesa_volume + stmt.excluded.mpesa_volume,
            "missing_cost_line_count": SaleAnalyticsSummary.missing_cost_line_count
            + stmt.excluded.missing_cost_line_count,
        },
    )
    await db.exec(stmt)

    # --- Business hourly ---
    hour_values = {
        "business_id": sale.business_id,
        "organization_id": sale.organization_id,
        "hour_dimension": hour,
        "gross_sales_volume": s * subtotal,
        "net_revenue_collected": s * net,
        "cogs_volume": s * total_cogs,
        "gross_profit": s * gross_profit,
        "total_completed_orders_count": int(s * 1),
        "total_discounts_granted": s * discount,
    }
    hstmt = pg_insert(BusinessSalesHourly).values(**hour_values)
    hstmt = hstmt.on_conflict_do_update(
        index_elements=["business_id", "hour_dimension"],
        set_={
            "gross_sales_volume": BusinessSalesHourly.gross_sales_volume
            + hstmt.excluded.gross_sales_volume,
            "net_revenue_collected": BusinessSalesHourly.net_revenue_collected
            + hstmt.excluded.net_revenue_collected,
            "cogs_volume": BusinessSalesHourly.cogs_volume + hstmt.excluded.cogs_volume,
            "gross_profit": BusinessSalesHourly.gross_profit + hstmt.excluded.gross_profit,
            "total_completed_orders_count": BusinessSalesHourly.total_completed_orders_count
            + hstmt.excluded.total_completed_orders_count,
            "total_discounts_granted": BusinessSalesHourly.total_discounts_granted
            + hstmt.excluded.total_discounts_granted,
        },
    )
    await db.exec(hstmt)

    # --- Staff daily ---
    if sale.cashier_id:
        staff_values = {
            "business_id": sale.business_id,
            "organization_id": sale.organization_id,
            "date_dimension": day,
            "staff_id": sale.cashier_id,
            "orders_count": int(s * 1),
            "revenue": s * net,
            "cogs": s * total_cogs,
            "gross_profit": s * gross_profit,
            "discounts": s * discount,
        }
        st = pg_insert(StaffSalesSummary).values(**staff_values)
        st = st.on_conflict_do_update(
            index_elements=["business_id", "date_dimension", "staff_id"],
            set_={
                "orders_count": StaffSalesSummary.orders_count + st.excluded.orders_count,
                "revenue": StaffSalesSummary.revenue + st.excluded.revenue,
                "cogs": StaffSalesSummary.cogs + st.excluded.cogs,
                "gross_profit": StaffSalesSummary.gross_profit + st.excluded.gross_profit,
                "discounts": StaffSalesSummary.discounts + st.excluded.discounts,
            },
        )
        await db.exec(st)

    # --- Product daily (per line) ---
    for item in items:
        rev = _line_revenue(item)
        cogs = _line_cogs(item) if item.cost_price_at_sale is not None else 0.0
        gp = rev - cogs
        pvals = {
            "business_id": sale.business_id,
            "organization_id": sale.organization_id,
            "date_dimension": day,
            "product_id": item.product_id,
            "sku": (item.sku or "")[:50],
            "name": (item.name or "")[:150],
            "quantity_sold": s * float(item.quantity or 0),
            "revenue": s * rev,
            "cogs": s * cogs,
            "gross_profit": s * gp,
            "discount_amount": 0.0,
            "line_count": int(s * 1),
        }
        pst = pg_insert(ProductSalesSummary).values(**pvals)
        pst = pst.on_conflict_do_update(
            index_elements=["business_id", "date_dimension", "product_id"],
            set_={
                "quantity_sold": ProductSalesSummary.quantity_sold + pst.excluded.quantity_sold,
                "revenue": ProductSalesSummary.revenue + pst.excluded.revenue,
                "cogs": ProductSalesSummary.cogs + pst.excluded.cogs,
                "gross_profit": ProductSalesSummary.gross_profit + pst.excluded.gross_profit,
                "line_count": ProductSalesSummary.line_count + pst.excluded.line_count,
                "sku": pst.excluded.sku,
                "name": pst.excluded.name,
            },
        )
        await db.exec(pst)

    await db.flush()

    return {
        "type": "analytics.rollup.updated",
        "business_id": str(sale.business_id),
        "organization_id": str(sale.organization_id) if sale.organization_id else None,
        "date": day.date().isoformat(),
        "hour": hour.isoformat(),
        "scopes": ["overview", "products", "staff", "hourly"],
        "sale_id": str(sale.id),
    }


async def publish_rollup_event(redis: Any, payload: Dict[str, Any]) -> None:
    if not payload or not redis:
        return
    channel = f"{REDIS_CHANNEL_PREFIX}{payload['business_id']}"
    try:
        await redis.publish(channel, json.dumps(payload))
    except Exception as e:
        logger.warning("analytics redis publish failed: {}", e)


async def backfill_business_rollups(
    db: AsyncSession,
    *,
    business_id: UUID,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Rebuild rollups for a business from COMPLETED sales.
    Clears existing summary rows in range then re-applies each sale.
    """
    stmt = select(Sale).where(
        Sale.business_id == business_id,
        Sale.status == SaleStatus.COMPLETED,
    )
    if start is not None:
        stmt = stmt.where(Sale.created_at >= start)
    if end is not None:
        stmt = stmt.where(Sale.created_at < end)
    sales = (await db.exec(stmt)).all()

    # Clear overlapping aggregates (simple approach for consistency)
    for model, col_name in (
        (SaleAnalyticsSummary, "date_dimension"),
        (ProductSalesSummary, "date_dimension"),
        (StaffSalesSummary, "date_dimension"),
        (BusinessSalesHourly, "hour_dimension"),
    ):
        q = select(model).where(model.business_id == business_id)
        rows = (await db.exec(q)).all()
        for row in rows:
            dim = getattr(row, col_name)
            if start and dim < start:
                continue
            if end and dim >= end:
                continue
            await db.delete(row)
    await db.flush()

    applied = 0
    for sale in sales:
        result = await apply_sale_to_rollups(db, sale.id, sign=1)
        if result:
            applied += 1
    await db.commit()
    return {
        "business_id": str(business_id),
        "sales_scanned": len(sales),
        "sales_applied": applied,
    }
