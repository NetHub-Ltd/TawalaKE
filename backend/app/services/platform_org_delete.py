"""Platform-operated hard delete of an organization (temporary cleanup tool).

WARNING: Irreversible. Gated by settings.platform_org_hard_delete and route-level
friction (confirm_name + phrase DELETE). Prefer soft-delete for product flows.

Deletes dependent tenant rows in dependency order inside one transaction, then
the organization row. See issue #297.
"""
from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import delete, func, select, text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import (
    Business,
    Customer,
    Organization,
    Product,
    Sale,
    Staff,
    Subscription,
)
from app.utils.logging import logger


# Leaf → parent. Align with models that carry organization_id.
# Missing tables are skipped via SAVEPOINT (rowcount 0) so schema drift is safe.
_ORG_SCOPED_TABLES_ORDERED: tuple[str, ...] = (
    "sale_items",
    "payments",
    "financial_documents",
    "analytics_outbox",
    "product_sales_summaries",
    "staff_sales_summaries",
    "business_sales_hourly",
    "sale_analytics_summaries",
    "sales",
    "stock_history",
    "products",
    "categories",
    "expenses",
    "customers",
    "staff_business_assignments",
    "data_deletion_requests",
    "data_archive_jobs",
    "subscriptions",
    "businesses",
    "staff",
)

# Second pass: rows that may only be keyed by business_id (legacy / partial org_id).
_BUSINESS_SCOPED_TABLES: tuple[str, ...] = (
    "sale_items",
    "payments",
    "financial_documents",
    "sales",
    "stock_history",
    "products",
    "categories",
    "expenses",
    "customers",
)


async def collect_org_delete_stats(db: AsyncSession, org_id: UUID) -> dict[str, Any]:
    """Snapshot counts for audit meta and platform UI."""
    stats: dict[str, Any] = {}
    for label, model in (
        ("sales", Sale),
        ("staff", Staff),
        ("businesses", Business),
        ("subscriptions", Subscription),
        ("products", Product),
        ("customers", Customer),
    ):
        try:
            q = await db.execute(
                select(func.count()).select_from(model).where(
                    model.organization_id == org_id  # type: ignore[attr-defined]
                )
            )
            stats[label] = int(q.scalar_one() or 0)
        except Exception:
            stats[label] = 0
    return stats


async def _delete_org_scoped(
    db: AsyncSession, table: str, org_id: UUID
) -> int:
    """Delete rows for org_id from one table (SAVEPOINT on missing table)."""
    try:
        async with db.begin_nested():
            result = await db.execute(
                text(f"DELETE FROM {table} WHERE organization_id = :oid"),
                {"oid": str(org_id)},
            )
            return int(result.rowcount or 0)
    except ProgrammingError:
        logger.warning(
            "platform_org_hard_delete table_absent_or_error table=%s org=%s",
            table,
            org_id,
        )
        return 0


async def _delete_business_scoped(
    db: AsyncSession, table: str, business_ids: list[UUID]
) -> int:
    if not business_ids:
        return 0
    total = 0
    for bid in business_ids:
        try:
            async with db.begin_nested():
                r = await db.execute(
                    text(f"DELETE FROM {table} WHERE business_id = :bid"),
                    {"bid": str(bid)},
                )
                total += int(r.rowcount or 0)
        except ProgrammingError:
            logger.warning(
                "platform_org_hard_delete business_scoped_skip table=%s",
                table,
            )
            return total
    return total


async def hard_delete_organization(
    db: AsyncSession,
    *,
    org_id: UUID,
) -> dict[str, Any]:
    """
    Permanently remove an organization and org-scoped dependents.

    Caller must enforce flag, permissions, and confirm_name friction.
    Returns stats dict for audit logging.
    """
    org = (
        await db.execute(select(Organization).where(Organization.id == org_id))
    ).scalar_one_or_none()
    if org is None:
        raise LookupError("organization_not_found")

    stats = await collect_org_delete_stats(db, org_id)
    org_name = org.name
    org_email = org.email

    # Capture business ids before cascade for orphan cleanup.
    biz_rows = (
        await db.execute(
            select(Business.id).where(Business.organization_id == org_id)
        )
    ).scalars().all()
    business_ids = list(biz_rows)

    deleted_tables: dict[str, int] = {}
    for table in _ORG_SCOPED_TABLES_ORDERED:
        deleted_tables[table] = await _delete_org_scoped(db, table, org_id)

    # Sweep leftovers that only had business_id set.
    for table in _BUSINESS_SCOPED_TABLES:
        extra = await _delete_business_scoped(db, table, business_ids)
        if extra:
            deleted_tables[table] = deleted_tables.get(table, 0) + extra

    deleted_tables["audit_logs"] = await _delete_org_scoped(db, "audit_logs", org_id)

    await db.execute(delete(Organization).where(Organization.id == org_id))
    await db.commit()

    logger.info(
        "platform_org_hard_delete ok org_id=%s name=%s pre=%s",
        org_id,
        org_name,
        {k: stats.get(k) for k in ("sales", "staff", "businesses", "products")},
    )
    return {
        "organization_id": str(org_id),
        "name": org_name,
        "email": org_email,
        "pre_delete_counts": {
            k: stats.get(k, 0)
            for k in (
                "sales",
                "staff",
                "businesses",
                "subscriptions",
                "products",
                "customers",
            )
        },
        "deleted_table_rows": deleted_tables,
    }
