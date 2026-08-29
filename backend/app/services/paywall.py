"""Plan-based paywall: resolve entitlements and enforce limits / features.

Backend paywall logic loads the active Subscription → Plan and enforces
`limits` + `features` + subscription dates (see Plan model docstring).

Status conventions (approved):
- 402 Payment Required — capacity / quota exceeded (PLAN_LIMIT_REACHED)
- 403 Forbidden — feature not on plan, or subscription inactive/expired
  (FEATURE_NOT_AVAILABLE, SUBSCRIPTION_INACTIVE, SUBSCRIPTION_EXPIRED)
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.models import (
    Business,
    Plan,
    Product,
    Staff,
    Subscription,
)
from app.utils.logging import logger

# Limit keys stored on Plan.limits (see docs/billing.md + PLANS_SEED)
LIMIT_BUSINESSES = "max_businesses"
LIMIT_STAFF = "max_staff"
LIMIT_PRODUCTS = "max_products"
LIMIT_CUSTOMERS = "max_customers"
LIMIT_TX_MONTH = "max_transactions_per_month"
LIMIT_INVOICES_MONTH = "max_invoices_per_month"

# Human labels for client messages
_LIMIT_LABELS = {
    LIMIT_BUSINESSES: "businesses / branches",
    LIMIT_STAFF: "staff accounts",
    LIMIT_PRODUCTS: "products / services",
    LIMIT_CUSTOMERS: "customers",
    LIMIT_TX_MONTH: "transactions this month",
    LIMIT_INVOICES_MONTH: "invoices this month",
}


@dataclass(frozen=True)
class Entitlements:
    """Resolved plan entitlements for an organization."""

    organization_id: UUID
    subscription_id: Optional[UUID]
    plan_id: Optional[UUID]
    plan_code: str
    plan_name: str
    active: bool
    trial: bool
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    limits: Dict[str, Any]
    features: Dict[str, Any]

    def limit(self, key: str) -> Optional[int]:
        """Return numeric limit or None if unlimited / missing."""
        raw = self.limits.get(key)
        if raw is None:
            return None
        try:
            return int(raw)
        except (TypeError, ValueError):
            return None

    def has_feature(self, key: str) -> bool:
        """True if feature is enabled (True or non-false string grade)."""
        val = self.features.get(key)
        if val is True:
            return True
        if val is False or val is None:
            return False
        # Grades like "limited" / "standard" / "basic" count as present
        if isinstance(val, str) and val.strip().lower() not in ("", "false", "off", "none"):
            return True
        return bool(val)


def _as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _is_expired(end: Optional[datetime], now: datetime) -> bool:
    end_u = _as_utc(end)
    if end_u is None:
        return False
    return end_u < now


async def resolve_entitlements(
    db: AsyncSession, organization_id: UUID
) -> Entitlements:
    """
    Load active subscription + plan for the org.

    Prefer plan_id. If subscription exists without plan_id, treat as free/empty
    entitlements (safe deny for paid features, zero limits).
    """
    now = datetime.now(timezone.utc)

    stmt = (
        select(Subscription)
        .where(
            Subscription.organization_id == organization_id,
            Subscription.active == True,  # noqa: E712
        )
        .order_by(Subscription.start_date.desc())
    )
    subs = list(await db.exec(stmt))
    sub: Optional[Subscription] = None
    for candidate in subs:
        if not _is_expired(candidate.end_date, now):
            sub = candidate
            break

    if sub is None:
        return Entitlements(
            organization_id=organization_id,
            subscription_id=None,
            plan_id=None,
            plan_code="NONE",
            plan_name="No active plan",
            active=False,
            trial=False,
            start_date=None,
            end_date=None,
            limits={},
            features={},
        )

    plan: Optional[Plan] = None
    if sub.plan_id is not None:
        plan = await db.get(Plan, sub.plan_id)

    if plan is None:
        logger.warning(
            f"Subscription {sub.id} for org {organization_id} has no resolvable plan"
        )
        return Entitlements(
            organization_id=organization_id,
            subscription_id=sub.id,
            plan_id=sub.plan_id,
            plan_code="UNKNOWN",
            plan_name="Unknown plan",
            active=True,
            trial=False,
            start_date=_as_utc(sub.start_date),
            end_date=_as_utc(sub.end_date),
            limits={},
            features={},
        )

    # Trial heuristic: end_date within trial_days of start, or legacy FREE tier
    trial = False
    if plan.trial_days and sub.start_date and sub.end_date:
        span = (_as_utc(sub.end_date) - _as_utc(sub.start_date)).days
        if 0 < span <= int(plan.trial_days) + 1:
            trial = True

    return Entitlements(
        organization_id=organization_id,
        subscription_id=sub.id,
        plan_id=plan.id,
        plan_code=plan.code,
        plan_name=plan.name,
        active=True,
        trial=trial,
        start_date=_as_utc(sub.start_date),
        end_date=_as_utc(sub.end_date),
        limits=dict(plan.limits or {}),
        features=dict(plan.features or {}),
    )


def _paywall_detail(
    code: str,
    message: str,
    *,
    limit_key: Optional[str] = None,
    current: Optional[int] = None,
    maximum: Optional[int] = None,
    feature: Optional[str] = None,
    plan_code: Optional[str] = None,
) -> Dict[str, Any]:
    detail: Dict[str, Any] = {
        "code": code,
        "message": message,
    }
    if limit_key is not None:
        detail["limit_key"] = limit_key
    if current is not None:
        detail["current"] = current
    if maximum is not None:
        detail["maximum"] = maximum
    if feature is not None:
        detail["feature"] = feature
    if plan_code is not None:
        detail["plan_code"] = plan_code
    return detail


async def require_active_subscription(
    db: AsyncSession, organization_id: UUID
) -> Entitlements:
    """Raise 403 if no active (non-expired) subscription."""
    ent = await resolve_entitlements(db, organization_id)
    if not ent.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_paywall_detail(
                "SUBSCRIPTION_INACTIVE",
                "No active subscription. Start a trial or choose a plan to continue.",
                plan_code=ent.plan_code,
            ),
        )
    if ent.end_date and _is_expired(ent.end_date, datetime.now(timezone.utc)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_paywall_detail(
                "SUBSCRIPTION_EXPIRED",
                "Your subscription has expired. Renew or upgrade to continue.",
                plan_code=ent.plan_code,
            ),
        )
    return ent


async def require_feature(
    db: AsyncSession, organization_id: UUID, feature_key: str
) -> Entitlements:
    """Raise 403 if the plan does not include the feature."""
    ent = await require_active_subscription(db, organization_id)
    if not ent.has_feature(feature_key):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_paywall_detail(
                "FEATURE_NOT_AVAILABLE",
                f"'{feature_key}' is not included in your current plan ({ent.plan_name}). Upgrade to unlock it.",
                feature=feature_key,
                plan_code=ent.plan_code,
            ),
        )
    return ent


async def _count_businesses(db: AsyncSession, organization_id: UUID) -> int:
    stmt = (
        select(func.count())
        .select_from(Business)
        .where(
            Business.organization_id == organization_id,
            Business.active == True,  # noqa: E712
        )
    )
    return int((await db.exec(stmt)).one())


async def _count_staff(db: AsyncSession, organization_id: UUID) -> int:
    stmt = (
        select(func.count())
        .select_from(Staff)
        .where(
            Staff.organization_id == organization_id,
            Staff.active == True,  # noqa: E712
        )
    )
    return int((await db.exec(stmt)).one())


async def _count_products(db: AsyncSession, organization_id: UUID) -> int:
    stmt = (
        select(func.count())
        .select_from(Product)
        .where(Product.organization_id == organization_id)
    )
    return int((await db.exec(stmt)).one())


_COUNTERS = {
    LIMIT_BUSINESSES: _count_businesses,
    LIMIT_STAFF: _count_staff,
    LIMIT_PRODUCTS: _count_products,
}


async def check_limit(
    db: AsyncSession,
    organization_id: UUID,
    limit_key: str,
    *,
    increment: int = 1,
) -> Entitlements:
    """
    Ensure current usage + increment does not exceed plan limit.

    Raises 402 PLAN_LIMIT_REACHED when over capacity.
    """
    ent = await require_active_subscription(db, organization_id)
    maximum = ent.limit(limit_key)
    if maximum is None:
        # No cap configured → allow
        return ent

    counter = _COUNTERS.get(limit_key)
    if counter is None:
        logger.warning(f"No usage counter for limit_key={limit_key}; skipping hard enforce")
        return ent

    current = await counter(db, organization_id)
    if current + increment > maximum:
        label = _LIMIT_LABELS.get(limit_key, limit_key)
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=_paywall_detail(
                "PLAN_LIMIT_REACHED",
                f"Plan limit reached for {label} ({current}/{maximum}). "
                f"Upgrade from {ent.plan_name} to add more.",
                limit_key=limit_key,
                current=current,
                maximum=maximum,
                plan_code=ent.plan_code,
            ),
        )
    return ent


async def enforce_create_business(db: AsyncSession, organization_id: UUID) -> Entitlements:
    return await check_limit(db, organization_id, LIMIT_BUSINESSES)


async def enforce_create_staff(db: AsyncSession, organization_id: UUID) -> Entitlements:
    return await check_limit(db, organization_id, LIMIT_STAFF)


async def enforce_create_product(db: AsyncSession, organization_id: UUID) -> Entitlements:
    return await check_limit(db, organization_id, LIMIT_PRODUCTS)


async def get_usage_snapshot(
    db: AsyncSession, organization_id: UUID
) -> Dict[str, Any]:
    """Usage vs limits for billing UI / diagnostics."""
    ent = await resolve_entitlements(db, organization_id)
    usage = {
        LIMIT_BUSINESSES: await _count_businesses(db, organization_id),
        LIMIT_STAFF: await _count_staff(db, organization_id),
        LIMIT_PRODUCTS: await _count_products(db, organization_id),
    }
    return {
        "plan_code": ent.plan_code,
        "plan_name": ent.plan_name,
        "active": ent.active,
        "trial": ent.trial,
        "start_date": ent.start_date.isoformat() if ent.start_date else None,
        "end_date": ent.end_date.isoformat() if ent.end_date else None,
        "limits": ent.limits,
        "features": ent.features,
        "usage": usage,
    }
