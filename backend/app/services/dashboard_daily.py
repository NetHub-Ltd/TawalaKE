"""
Dedicated daily dashboard metrics (no tax).

Formula (honest):
  product_sales     = sum(product line subtotals)
  cogs              = sum(cost_price_at_sale × qty) where cost known
  product_profit    = product_sales − cogs
  service_revenue   = sum(service fees)
  discounts_granted = sale discount
  gross_profit      = product_profit + service_revenue − discounts_granted

Only COMPLETED sales contribute.
Past days: rebuild_business_range() from sales (Celery backfill).
Live: apply_completed_sale() after finalize / collect → COMPLETED.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Sequence
from uuid import UUID, uuid4

from loguru import logger
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlmodel import select, col, delete
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.models import (
    BusinessDashboardDay,
    Payment,
    PaymentMethod,
    ProductDashboardDay,
    Sale,
    SaleItem,
    SaleStatus,
)


def utc_day_floor(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
    return datetime(dt.year, dt.month, dt.day, tzinfo=timezone.utc)


def _service_total(sale: Sale) -> float:
    raw = getattr(sale, "service_amount", None)
    if not raw:
        return 0.0
    if isinstance(raw, dict):
        return float(raw.get("amount") or 0)
    if isinstance(raw, list):
        total = 0.0
        for s in raw:
            if isinstance(s, dict):
                total += float(s.get("amount") or 0)
            else:
                total += float(getattr(s, "amount", 0) or 0)
        return round(total, 2)
    return 0.0


def _discount_total(sale: Sale) -> float:
    return float(
        getattr(sale, "discount_applied", None)
        or getattr(sale, "discount", None)
        or 0
    )


def contribution_from_sale(
    sale: Sale,
    items: Sequence[SaleItem],
    payments: Sequence[Payment],
) -> Dict[str, Any]:
    """Pure breakdown for one completed sale (no tax)."""
    product_sales = 0.0
    cogs = 0.0
    missing = 0
    product_rows: List[Dict[str, Any]] = []

    for item in items:
        sell = float(item.subtotal or 0)
        if sell == 0 and item.unit_price is not None:
            sell = float(item.unit_price or 0) * float(item.quantity or 0)
        product_sales += sell
        cost = item.cost_price_at_sale
        line_cogs = 0.0
        miss = False
        if cost is None:
            missing += 1
            miss = True
        else:
            line_cogs = float(cost) * float(item.quantity or 0)
            cogs += line_cogs
        product_rows.append(
            {
                "product_id": item.product_id,
                "sku": item.sku or "",
                "name": item.name or "",
                "quantity": float(item.quantity or 0),
                "product_sales": round(sell, 2),
                "cogs": round(line_cogs, 2),
                "profit": round(sell - line_cogs, 2),
                "missing_cost": miss,
            }
        )

    product_sales = round(product_sales, 2)
    cogs = round(cogs, 2)
    product_profit = round(product_sales - cogs, 2)
    service_revenue = round(_service_total(sale), 2)
    discounts = round(_discount_total(sale), 2)
    gross_profit = round(product_profit + service_revenue - discounts, 2)

    cash = mpesa = card = other = 0.0
    for pay in payments:
        method = getattr(pay.method, "value", str(pay.method or "")).upper()
        amt = float(pay.amount or 0)
        if method == "CASH":
            cash += amt
        elif method == "MPESA":
            mpesa += amt
        elif method == "CARD":
            card += amt
        else:
            other += amt
    amount_collected = round(cash + mpesa + card + other, 2)

    event_ts = getattr(sale, "updated_at", None) or getattr(sale, "created_at", None)
    if event_ts is None:
        event_ts = datetime.now(timezone.utc)
    day = utc_day_floor(event_ts)

    return {
        "day": day,
        "orders_count": 1,
        "product_sales": product_sales,
        "service_revenue": service_revenue,
        "discounts_granted": discounts,
        "cogs": cogs,
        "product_profit": product_profit,
        "gross_profit": gross_profit,
        "amount_collected": amount_collected,
        "cash_collected": round(cash, 2),
        "mpesa_collected": round(mpesa, 2),
        "card_collected": round(card, 2),
        "other_collected": round(other, 2),
        "missing_cost_line_count": missing,
        "products": product_rows,
    }


async def _load_completed_bundle(
    db: AsyncSession, sale_id: UUID
) -> tuple[Optional[Sale], Sequence[SaleItem], Sequence[Payment]]:
    sale = (await db.exec(select(Sale).where(Sale.id == sale_id))).one_or_none()
    if not sale or sale.status != SaleStatus.COMPLETED:
        return None, [], []
    items = (await db.exec(select(SaleItem).where(SaleItem.sale_id == sale_id))).all()
    pays = (await db.exec(select(Payment).where(Payment.sale_id == sale_id))).all()
    return sale, items, pays


async def apply_completed_sale(db: AsyncSession, sale_id: UUID) -> Optional[Dict[str, Any]]:
    """
    Add one COMPLETED sale into business_dashboard_days + product_dashboard_days.
    Idempotent enough when used once per completion; backfill rebuilds cleanly.
    """
    sale, items, pays = await _load_completed_bundle(db, sale_id)
    if not sale:
        return None

    c = contribution_from_sale(sale, items, pays)
    day = c["day"]

    biz_vals = {
        "id": uuid4(),
        "business_id": sale.business_id,
        "organization_id": sale.organization_id,
        "day": day,
        "orders_count": c["orders_count"],
        "product_sales": c["product_sales"],
        "service_revenue": c["service_revenue"],
        "discounts_granted": c["discounts_granted"],
        "cogs": c["cogs"],
        "product_profit": c["product_profit"],
        "gross_profit": c["gross_profit"],
        "amount_collected": c["amount_collected"],
        "cash_collected": c["cash_collected"],
        "mpesa_collected": c["mpesa_collected"],
        "card_collected": c["card_collected"],
        "other_collected": c["other_collected"],
        "missing_cost_line_count": c["missing_cost_line_count"],
    }
    stmt = pg_insert(BusinessDashboardDay).values(**biz_vals)
    stmt = stmt.on_conflict_do_update(
        index_elements=["business_id", "day"],
        set_={
            "orders_count": BusinessDashboardDay.orders_count + stmt.excluded.orders_count,
            "product_sales": BusinessDashboardDay.product_sales + stmt.excluded.product_sales,
            "service_revenue": BusinessDashboardDay.service_revenue
            + stmt.excluded.service_revenue,
            "discounts_granted": BusinessDashboardDay.discounts_granted
            + stmt.excluded.discounts_granted,
            "cogs": BusinessDashboardDay.cogs + stmt.excluded.cogs,
            "product_profit": BusinessDashboardDay.product_profit
            + stmt.excluded.product_profit,
            "gross_profit": BusinessDashboardDay.gross_profit + stmt.excluded.gross_profit,
            "amount_collected": BusinessDashboardDay.amount_collected
            + stmt.excluded.amount_collected,
            "cash_collected": BusinessDashboardDay.cash_collected
            + stmt.excluded.cash_collected,
            "mpesa_collected": BusinessDashboardDay.mpesa_collected
            + stmt.excluded.mpesa_collected,
            "card_collected": BusinessDashboardDay.card_collected
            + stmt.excluded.card_collected,
            "other_collected": BusinessDashboardDay.other_collected
            + stmt.excluded.other_collected,
            "missing_cost_line_count": BusinessDashboardDay.missing_cost_line_count
            + stmt.excluded.missing_cost_line_count,
            "updated_at": datetime.now(timezone.utc),
        },
    )
    await db.exec(stmt)

    for pr in c["products"]:
        pvals = {
            "id": uuid4(),
            "business_id": sale.business_id,
            "organization_id": sale.organization_id,
            "day": day,
            "product_id": pr["product_id"],
            "sku": pr["sku"][:50],
            "name": pr["name"][:150],
            "quantity_sold": pr["quantity"],
            "product_sales": pr["product_sales"],
            "cogs": pr["cogs"],
            "profit": pr["profit"],
            "missing_cost": pr["missing_cost"],
        }
        pstmt = pg_insert(ProductDashboardDay).values(**pvals)
        pstmt = pstmt.on_conflict_do_update(
            index_elements=["business_id", "day", "product_id"],
            set_={
                "quantity_sold": ProductDashboardDay.quantity_sold
                + pstmt.excluded.quantity_sold,
                "product_sales": ProductDashboardDay.product_sales
                + pstmt.excluded.product_sales,
                "cogs": ProductDashboardDay.cogs + pstmt.excluded.cogs,
                "profit": ProductDashboardDay.profit + pstmt.excluded.profit,
                "missing_cost": ProductDashboardDay.missing_cost
                | pstmt.excluded.missing_cost,
                "sku": pstmt.excluded.sku,
                "name": pstmt.excluded.name,
                "updated_at": datetime.now(timezone.utc),
            },
        )
        await db.exec(pstmt)

    await db.flush()
    return {
        "type": "dashboard.day.updated",
        "business_id": str(sale.business_id),
        "day": day.date().isoformat(),
        "sale_id": str(sale.id),
        "gross_profit": c["gross_profit"],
    }


async def rebuild_business_range(
    db: AsyncSession,
    *,
    business_id: UUID,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Delete dashboard day rows in range and recompute from COMPLETED sales.
    Safe for past data and correcting drift.
    """
    if end is None:
        end = datetime.now(timezone.utc) + timedelta(days=1)
    if start is None:
        start = end - timedelta(days=366)

    start = utc_day_floor(start)
    # exclusive end day floor + 1 day handled by < end

    await db.exec(
        delete(BusinessDashboardDay).where(
            BusinessDashboardDay.business_id == business_id,
            BusinessDashboardDay.day >= start,
            BusinessDashboardDay.day < end,
        )
    )
    await db.exec(
        delete(ProductDashboardDay).where(
            ProductDashboardDay.business_id == business_id,
            ProductDashboardDay.day >= start,
            ProductDashboardDay.day < end,
        )
    )
    await db.flush()

    stmt = (
        select(Sale)
        .where(Sale.business_id == business_id)
        .where(Sale.status == SaleStatus.COMPLETED)
        .where(Sale.created_at >= start)
        .where(Sale.created_at < end)
    )
    if hasattr(Sale, "deleted_at"):
        stmt = stmt.where(col(Sale.deleted_at).is_(None))
    sales = (await db.exec(stmt)).all()

    applied = 0
    for sale in sales:
        payload = await apply_completed_sale(db, sale.id)
        if payload:
            applied += 1

    await db.commit()
    logger.info(
        "dashboard rebuild business={} start={} end={} sales={}",
        business_id,
        start.date(),
        end.date(),
        applied,
    )
    return {
        "business_id": str(business_id),
        "start": start.isoformat(),
        "end": end.isoformat(),
        "sales_applied": applied,
    }


async def sum_business_days(
    db: AsyncSession,
    *,
    business_id: UUID,
    start: datetime,
    end: datetime,
) -> Dict[str, float]:
    """Read-path aggregate for dashboard API (no recompute)."""
    rows = (
        await db.exec(
            select(BusinessDashboardDay)
            .where(BusinessDashboardDay.business_id == business_id)
            .where(BusinessDashboardDay.day >= start)
            .where(BusinessDashboardDay.day < end)
        )
    ).all()
    keys = [
        "orders_count",
        "product_sales",
        "service_revenue",
        "discounts_granted",
        "cogs",
        "product_profit",
        "gross_profit",
        "amount_collected",
        "cash_collected",
        "mpesa_collected",
        "card_collected",
        "other_collected",
        "missing_cost_line_count",
    ]
    out = {k: 0.0 for k in keys}
    for r in rows:
        for k in keys:
            out[k] += float(getattr(r, k, 0) or 0)
    out["orders_count"] = int(out["orders_count"])
    out["missing_cost_line_count"] = int(out["missing_cost_line_count"])
    return out
