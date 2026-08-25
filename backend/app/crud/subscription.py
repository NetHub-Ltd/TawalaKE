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

TRIAL_DAYS = 7
NDOVU_CODE = "NDOVU"


def _as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


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


async def start_ndovu_trial(
    db: AsyncSession, organization_id: UUID
) -> Tuple[Subscription, Plan]:
    plan = await get_plan_by_code(db, NDOVU_CODE)
    existing = await get_active_subscription(db, organization_id)
    if existing:
        return existing, plan

    now = datetime.now(timezone.utc)
    end = now + timedelta(days=TRIAL_DAYS)
    sub = Subscription(
        organization_id=organization_id,
        tier=SubscriptionTier.TRIAL,
        active=True,
        start_date=now,
        end_date=end,
        plan_id=plan.id,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    logger.info(
        f"Started {TRIAL_DAYS}-day NDOVU trial for org {organization_id} sub={sub.id}"
    )
    return sub, plan
