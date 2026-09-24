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
GRACE_DAYS = 7
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


def _grace_end_for(sub: Subscription) -> Optional[datetime]:
    """Latest moment full access is allowed (trial paid period + grace)."""
    explicit = _as_utc(getattr(sub, "grace_end_date", None))
    if explicit is not None:
        return explicit
    end = _as_utc(sub.end_date)
    if end is None:
        return None
    # Trials get a default grace window after plan end
    if getattr(sub, "is_trial", False):
        return end + timedelta(days=GRACE_DAYS)
    return end


def access_phase_for(sub: Optional[Subscription], now: Optional[datetime] = None) -> str:
    """
    active  — within subscription end_date
    grace   — after end_date, before grace_end (reminders; full access)
    locked  — after grace (login ok; product UI/API locked)
    none    — no subscription row
    """
    now = now or datetime.now(timezone.utc)
    if sub is None or not sub.active:
        return "none"
    end = _as_utc(sub.end_date)
    grace = _grace_end_for(sub)
    if end is None or now < end:
        return "active"
    if grace is not None and now < grace:
        return "grace"
    return "locked"


async def get_active_subscription(
    db: AsyncSession, organization_id: UUID
) -> Optional[Subscription]:
    """Return the active subscription if still in paid period OR grace window."""
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
    for sub in subs:
        phase = access_phase_for(sub, now)
        if phase in ("active", "grace"):
            return sub
    return None


async def get_latest_subscription(
    db: AsyncSession, organization_id: UUID
) -> Optional[Subscription]:
    """Latest active=True row even if locked (for status / lock UI)."""
    stmt = (
        select(Subscription)
        .where(
            Subscription.organization_id == organization_id,
            Subscription.active == True,  # noqa: E712
        )
        .order_by(Subscription.start_date.desc())
    )
    return (await db.exec(stmt)).first()


async def org_has_consumed_trial(db: AsyncSession, organization_id: UUID) -> bool:
    org = await db.get(Organization, organization_id)
    if org is not None and getattr(org, "trial_consumed_at", None) is not None:
        return True
    stmt = select(Subscription).where(
        Subscription.organization_id == organization_id,
        Subscription.is_trial == True,  # noqa: E712
    )
    return (await db.exec(stmt)).first() is not None


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




def build_trial_invoice(
    *,
    org: Organization,
    plan: Plan,
    sub: Subscription,
    currency: str = "KES",
) -> dict:
    """
    Zero-amount commercial invoice for self-serve trial activation.
    Persisted on subscription.current_usage["trial_invoice"] and emailed to owner.
    """
    start = _as_utc(sub.start_date)
    end = _as_utc(sub.end_date)
    days = TRIAL_DAYS
    if start and end:
        days = max(1, (end.date() - start.date()).days)
    inv_no = f"TRIAL-{start.strftime('%Y%m%d') if start else 'NA'}-{str(sub.id).replace('-', '')[:8].upper()}"
    unit = 0.0
    line_desc = f"{plan.name} — {days}-day free trial"
    return {
        "invoice_number": inv_no,
        "status": "PAID",
        "currency": currency or getattr(plan, "currency", None) or "KES",
        "issue_date": (start or datetime.now(timezone.utc)).strftime("%Y-%m-%d"),
        "due_date": (start or datetime.now(timezone.utc)).strftime("%Y-%m-%d"),
        "bill_to": {
            "name": (org.name or "").strip() or "Organization",
            "email": (getattr(org, "email", None) or "").strip(),
            "phone": (getattr(org, "phone", None) or "").strip() or None,
            "address": (getattr(org, "address", None) or "").strip() or None,
        },
        "plan_code": plan.code,
        "plan_name": plan.name,
        "trial_days": days,
        "trial_start": start.strftime("%Y-%m-%d") if start else None,
        "trial_end": end.strftime("%Y-%m-%d") if end else None,
        "subscription_id": str(sub.id),
        "line_items": [
            {
                "description": line_desc,
                "quantity": 1,
                "unit_price": unit,
                "amount": unit,
            }
        ],
        "subtotal": 0.0,
        "tax_amount": 0.0,
        "total_amount": 0.0,
        "amount_due": 0.0,
        "amount_paid": 0.0,
        "notes": "No payment required for the trial period. Upgrade before trial end to keep access without interruption.",
    }


async def start_plan_trial(
    db: AsyncSession, organization_id: UUID, plan_code: str = "NDOVU"
) -> Tuple[Subscription, Plan]:
    """
    Start the org's single self-serve trial (all plans share one lifetime trial).
    Sets grace_end_date = trial end + GRACE_DAYS.
    """
    code = (plan_code or "NDOVU").upper()
    if code not in TRIAL_ELIGIBLE_CODES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Plan '{code}' is not available for self-serve trial. Contact sales.",
        )

    if await org_has_consumed_trial(db, organization_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This organization has already used its free trial. Choose a paid plan to continue.",
        )

    plan = await get_plan_by_code(db, code)
    existing = await get_active_subscription(db, organization_id)
    if existing:
        # Still in trial/grace — do not create another
        return existing, plan

    days = TRIAL_DAYS
    if getattr(plan, "trial_days", None) and plan.trial_days > 0:
        days = int(plan.trial_days)

    now = datetime.now(timezone.utc)
    end = now + timedelta(days=days)
    grace_end = end + timedelta(days=GRACE_DAYS)

    sub = Subscription(
        organization_id=organization_id,
        tier=_legacy_tier_for_trial(code),
        active=True,
        start_date=now,
        end_date=end,
        plan_id=plan.id,
        is_trial=True,
        grace_end_date=grace_end,
    )
    db.add(sub)

    org = await db.get(Organization, organization_id)
    if org is not None:
        org.trial_consumed_at = now
        db.add(org)
        inv = build_trial_invoice(org=org, plan=plan, sub=sub, currency=plan.currency or "KES")
        usage = dict(sub.current_usage or {})
        usage["trial_invoice"] = inv
        sub.current_usage = usage
        db.add(sub)

    await db.commit()
    await db.refresh(sub)
    await _invalidate_org(organization_id)
    logger.info(
        f"Started {days}-day {code} trial for org {organization_id} "
        f"sub={sub.id} grace_until={grace_end.isoformat()}"
    )
    return sub, plan


async def extend_grace_period(
    db: AsyncSession,
    organization_id: UUID,
    *,
    days: int = GRACE_DAYS,
) -> Subscription:
    """
    Platform-only: extend grace by `days` from max(now, current grace_end).
    Unlocks a locked org for payment facilitation.
    """
    if days < 1 or days > 30:
        raise HTTPException(status_code=400, detail="Grace extension must be 1–30 days")

    sub = await get_latest_subscription(db, organization_id)
    if sub is None:
        raise HTTPException(status_code=404, detail="No subscription found for organization")

    now = datetime.now(timezone.utc)
    base = _grace_end_for(sub) or _as_utc(sub.end_date) or now
    if base < now:
        base = now
    new_grace = base + timedelta(days=days)
    sub.grace_end_date = new_grace
    sub.active = True
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    await _invalidate_org(organization_id)
    logger.info(
        f"Extended grace for org={organization_id} sub={sub.id} until {new_grace.isoformat()}"
    )
    return sub


def build_access_status(sub: Optional[Subscription], org: Optional[Organization] = None) -> dict:
    now = datetime.now(timezone.utc)
    phase = access_phase_for(sub, now)
    trial_consumed = bool(
        org is not None and getattr(org, "trial_consumed_at", None) is not None
    )
    if not trial_consumed and sub is not None and getattr(sub, "is_trial", False):
        trial_consumed = True

    out = {
        "access_phase": phase,
        "trial_consumed": trial_consumed,
        "trial_eligible": not trial_consumed and phase in ("none",),
        "is_trial": bool(sub and getattr(sub, "is_trial", False)),
        "subscription_id": str(sub.id) if sub else None,
        "start_date": sub.start_date.isoformat() if sub and sub.start_date else None,
        "end_date": sub.end_date.isoformat() if sub and sub.end_date else None,
        "grace_end_date": (
            _grace_end_for(sub).isoformat() if sub and _grace_end_for(sub) else None
        ),
        "days_remaining": None,
        "grace_days_remaining": None,
    }
    if sub is None:
        return out
    end = _as_utc(sub.end_date)
    grace = _grace_end_for(sub)
    if phase == "active" and end is not None:
        out["days_remaining"] = max(0, (end - now).days)
    if phase == "grace" and grace is not None:
        out["grace_days_remaining"] = max(0, (grace - now).days + (1 if (grace - now).seconds else 0))
        # more accurate:
        out["grace_days_remaining"] = max(0, int((grace - now).total_seconds() // 86400))
    return out


async def start_ndovu_trial(
    db: AsyncSession, organization_id: UUID
) -> Tuple[Subscription, Plan]:
    return await start_plan_trial(db, organization_id, "NDOVU")





async def list_orgs_in_grace(
    db: AsyncSession,
) -> List[Tuple[Subscription, Optional[Plan], Organization]]:
    """Subscriptions currently in grace (trial ended, grace_end not passed)."""
    now = datetime.now(timezone.utc)
    stmt = (
        select(Subscription)
        .where(Subscription.active == True)  # noqa: E712
        .order_by(Subscription.end_date.asc())
    )
    out: List[Tuple[Subscription, Optional[Plan], Organization]] = []
    for sub in list(await db.exec(stmt)):
        if access_phase_for(sub, now) != "grace":
            continue
        org = await db.get(Organization, sub.organization_id)
        if org is None:
            continue
        plan = await db.get(Plan, sub.plan_id) if sub.plan_id else None
        out.append((sub, plan, org))
    return out

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



async def list_trials_ending_within(
    db: AsyncSession,
    *,
    within_days: int = 3,
) -> List[Tuple[Subscription, Plan, Organization]]:
    """
    Active subscriptions whose end_date falls within [now, now+within_days].
    Used by the trial-ending reminder job.
    """
    now = datetime.now(timezone.utc)
    horizon = now + timedelta(days=max(0, int(within_days)))
    stmt = (
        select(Subscription)
        .where(
            Subscription.active == True,  # noqa: E712
            Subscription.end_date.is_not(None),
            Subscription.end_date >= now,
            Subscription.end_date <= horizon,
        )
    )
    subs = list(await db.exec(stmt))
    out: List[Tuple[Subscription, Plan, Organization]] = []
    for sub in subs:
        if not sub.organization_id:
            continue
        plan = None
        if sub.plan_id:
            plan = (
                await db.exec(select(Plan).where(Plan.id == sub.plan_id))
            ).first()
        org = (
            await db.exec(
                select(Organization).where(Organization.id == sub.organization_id)
            )
        ).first()
        if not org:
            continue
        # Prefer plan name; fall back
        if plan is None:
            from types import SimpleNamespace
            plan = SimpleNamespace(code="TRIAL", name="Trial")
        out.append((sub, plan, org))
    return out
