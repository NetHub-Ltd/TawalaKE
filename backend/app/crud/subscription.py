"""Subscription helpers for trial start and entitlement checks."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.models import Plan, Subscription, Organization, SubscriptionTier
from app.utils.logging import logger
from app.services.paywall import paywall
from app.core.redis_client import redis_manager

TRIAL_DAYS = 14
TRIAL_ELIGIBLE_CODES = {"BASIC", "NDOVU"}

# Live Postgres subscription_tier_enum = FREE | BRONZE | SILVER | GOLD (issue #108).
# plan_id carries product identity; tier stays a legal legacy label only.
_PLAN_CODE_TO_LEGACY_TIER = {
    "BASIC": SubscriptionTier.BRONZE,
    "NDOVU": SubscriptionTier.SILVER,
    "ENTERPRISE": SubscriptionTier.GOLD,
}


def _as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _legacy_tier_for_trial(plan_code: str) -> SubscriptionTier:
    """Trials always use FREE (valid in prod). Paid mapping reserved for later."""
    return SubscriptionTier.FREE


def _legacy_tier_for_plan_code(code: str) -> SubscriptionTier:
    return _PLAN_CODE_TO_LEGACY_TIER.get((code or "").upper(), SubscriptionTier.FREE)


async def get_active_subscription(
    db: AsyncSession, organization_id: UUID
) -> Optional[Subscription]:
    now = datetime.now(timezone.utc)
    stmt = select(Subscription).where(
        Subscription.organization_id == organization_id,
        Subscription.active == True,  # noqa: E712
    )
    subs = list(await db.exec(stmt))
    for sub in subs:
        end = _as_utc(sub.end_date)
        if end is not None and end < now:
            continue
        return sub
    return None


async def get_plan_by_code(db: AsyncSession, code: str) -> Plan:
    stmt = select(Plan).where(Plan.code == code.upper(), Plan.is_active == True)  # noqa: E712
    plan = (await db.exec(stmt)).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{code}' is not available",
        )
    return plan


async def list_public_plans(db: AsyncSession) -> List[Plan]:
    stmt = (
        select(Plan)
        .where(Plan.is_active == True, Plan.is_public == True)  # noqa: E712
        .order_by(Plan.sort_order)
    )
    return list(await db.exec(stmt))


def profile_looks_complete(org: Organization) -> bool:
    name = (org.name or "").strip()
    phone = (org.phone or "").strip()
    address = (org.address or "").strip()
    if not name or name.endswith("-workspace"):
        return False
    return bool(phone and address)


async def maybe_mark_onboarding_complete(
    db: AsyncSession, org: Organization
) -> Organization:
    if org.onboarding:
        return org
    sub = await get_active_subscription(db, org.id)
    if sub and profile_looks_complete(org):
        org.onboarding = True
        db.add(org)
        await db.commit()
        await db.refresh(org)
        logger.info(f"Organization {org.id} onboarding marked complete")
    return org


async def _invalidate_org(org_id: UUID) -> None:
    """Best-effort Redis entitlements/validity invalidation after billing writes."""
    try:
        redis = redis_manager.get_async_client()
        await paywall.invalidate(redis, org_id)
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"paywall invalidate failed org={org_id}: {exc}")


async def start_plan_trial(
    db: AsyncSession, organization_id: UUID, plan_code: str = "NDOVU"
) -> Tuple[Subscription, Plan]:
    code = (plan_code or "NDOVU").upper()
    if code not in TRIAL_ELIGIBLE_CODES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Plan '{code}' is not available for self-serve trial. Contact sales.",
        )

    plan = await get_plan_by_code(db, code)
    existing = await get_active_subscription(db, organization_id)
    if existing:
        return existing, plan

    days = TRIAL_DAYS
    if getattr(plan, "trial_days", None) and plan.trial_days > 0:
        days = int(plan.trial_days)

    now = datetime.now(timezone.utc)
    end = now + timedelta(days=days)
    # plan_id = product truth; tier = FREE only (valid on live subscription_tier_enum)
    sub = Subscription(
        organization_id=organization_id,
        tier=_legacy_tier_for_trial(code),
        active=True,
        start_date=now,
        end_date=end,
        plan_id=plan.id,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    await _invalidate_org(organization_id)
    logger.info(
        f"Started {days}-day {code} trial for org {organization_id} "
        f"sub={sub.id} tier={sub.tier} plan_id={plan.id}"
    )
    return sub, plan


async def start_ndovu_trial(
    db: AsyncSession, organization_id: UUID
) -> Tuple[Subscription, Plan]:
    return await start_plan_trial(db, organization_id, "NDOVU")



async def deactivate_subscription(
    db: AsyncSession,
    organization_id: UUID,
    *,
    reason: str = "cancelled",
) -> Optional[Subscription]:
    """Mark all active subscriptions for the org inactive and drop paywall cache."""
    stmt = select(Subscription).where(
        Subscription.organization_id == organization_id,
        Subscription.active == True,  # noqa: E712
    )
    subs = list(await db.exec(stmt))
    if not subs:
        await _invalidate_org(organization_id)
        return None
    now = datetime.now(timezone.utc)
    last = None
    for sub in subs:
        sub.active = False
        # Keep end_date as historical; if open-ended, close at now
        if sub.end_date is None:
            sub.end_date = now
        db.add(sub)
        last = sub
    await db.commit()
    if last is not None:
        await db.refresh(last)
    await _invalidate_org(organization_id)
    logger.info(f"Deactivated subscription(s) for org={organization_id} reason={reason}")
    return last


async def activate_or_extend_subscription(
    db: AsyncSession,
    organization_id: UUID,
    plan_code: str,
    *,
    days: int = 30,
) -> Tuple[Subscription, Plan]:
    """
    Paid activation path (webhooks / admin): set plan, active, new window.
    Deactivates other active rows for the org first.
    """
    plan = await get_plan_by_code(db, plan_code)
    # Deactivate existing active rows without nested invalidate until end
    stmt = select(Subscription).where(
        Subscription.organization_id == organization_id,
        Subscription.active == True,  # noqa: E712
    )
    for sub in list(await db.exec(stmt)):
        sub.active = False
        db.add(sub)

    now = datetime.now(timezone.utc)
    end = now + timedelta(days=max(1, int(days)))
    sub = Subscription(
        organization_id=organization_id,
        tier=_legacy_tier_for_plan_code(plan.code),
        active=True,
        start_date=now,
        end_date=end,
        plan_id=plan.id,
        current_usage={},
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    await _invalidate_org(organization_id)
    logger.info(
        f"Activated plan={plan.code} org={organization_id} days={days} sub={sub.id}"
    )
    return sub, plan


async def mark_expired_subscriptions(db: AsyncSession, organization_id: UUID) -> int:
    """Flip active=False for org subs past end_date; invalidate cache."""
    now = datetime.now(timezone.utc)
    stmt = select(Subscription).where(
        Subscription.organization_id == organization_id,
        Subscription.active == True,  # noqa: E712
    )
    count = 0
    for sub in list(await db.exec(stmt)):
        end = _as_utc(sub.end_date)
        if end is not None and end < now:
            sub.active = False
            db.add(sub)
            count += 1
    if count:
        await db.commit()
        await _invalidate_org(organization_id)
        logger.info(f"Marked {count} expired sub(s) inactive org={organization_id}")
    return count
