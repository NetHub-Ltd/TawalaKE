"""Plan-based data retention resolution.

Source of truth: active subscription → plan.limits.data_retention_months.
Fallback: settings.data_retention_fallback_months (default 6 = Basic).
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession
from loguru import logger

from app.core.config import settings
from app.models.models import Organization, Plan, Subscription


DEFAULT_RETENTION_MONTHS = 6


async def resolve_retention_months(
    db: AsyncSession,
    organization_id: UUID,
) -> int:
    """
    Return retention months for an organization from its plan limits.
    Uses last known / active subscription plan; falls back to configured default.
    """
    try:
        stmt = (
            select(Subscription)
            .where(col(Subscription.organization_id) == organization_id)
            .where(col(Subscription.deleted_at).is_(None))
            .order_by(col(Subscription.created_at).desc())
        )
        sub = (await db.exec(stmt)).first()
        if sub is None:
            return int(settings.data_retention_fallback_months)

        if sub.plan_id is None:
            # Legacy rows: map tier roughly to seeded retention
            tier = getattr(sub.tier, "value", str(sub.tier or "")).upper()
            if tier in ("ENTERPRISE",):
                return 36
            if tier in ("NDOVU", "PRO", "PREMIUM"):
                return 12
            return int(settings.data_retention_fallback_months)

        plan_stmt = select(Plan).where(col(Plan.id) == sub.plan_id)
        plan = (await db.exec(plan_stmt)).first()
        if plan is None:
            return int(settings.data_retention_fallback_months)

        limits = plan.limits or {}
        months = limits.get("data_retention_months")
        if months is None:
            return int(settings.data_retention_fallback_months)
        return max(1, int(months))
    except (SQLAlchemyError, TypeError, ValueError) as e:
        logger.warning("retention resolve failed for org {}: {}", organization_id, e)
        return int(settings.data_retention_fallback_months)


def retention_cutoff(retention_months: int, *, now: Optional[datetime] = None) -> datetime:
    """Rows with deleted_at older than this cutoff are eligible for archive/purge (R1)."""
    now = now or datetime.now(timezone.utc)
    # Approximate months as 30 days for eligibility queries (documented)
    return now - timedelta(days=30 * retention_months)
