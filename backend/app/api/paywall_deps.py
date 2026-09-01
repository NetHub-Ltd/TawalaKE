"""FastAPI dependencies for plan feature gates and active-subscription checks.

Use at router or endpoint level:

    Depends(require_paywall("full_inventory", "low_stock_alerts", "multi_business"))
    Depends(require_active_plan)
    Depends(get_entitlements)
"""
from __future__ import annotations

from typing import Callable, Optional, Sequence
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from redis.asyncio.client import Redis as AsyncRedis
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import SessionDep, AuthUser, get_redis
from app.models.models import Staff
from app.services.paywall import Entitlements, paywall


def _org_id_from_user(user: Staff) -> UUID:
    org_id = getattr(user, "organization_id", None) or getattr(user, "tenant_id", None)
    if org_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "ORG_REQUIRED",
                "message": "Staff must belong to an organization",
            },
        )
    return org_id


async def get_entitlements(
    user: AuthUser,
    db: SessionDep,
    redis: AsyncRedis = Depends(get_redis),
) -> Entitlements:
    """Inject resolved entitlements (Redis-cached, DB-backed)."""
    org_id = _org_id_from_user(user)
    return await paywall.resolve(db, org_id, redis)


async def require_active_plan(
    user: AuthUser,
    db: SessionDep,
    redis: AsyncRedis = Depends(get_redis),
) -> Entitlements:
    """Endpoint/router gate: subscription must be active and not expired."""
    org_id = _org_id_from_user(user)
    ent = await paywall.resolve(db, org_id, redis)
    return paywall.require_active(ent)


def require_paywall(*features: str, mode: str = "all") -> Callable:
    """
    Dependency factory: require listed plan features.

    mode='all' (default): every feature must be on the plan.
    mode='any': at least one feature must be present.

    Example (root inventory gate — three features):
        dependencies=[Depends(require_paywall(
            "basic_stock_tracking", "pos_and_sales", "invoicing"
        ))]
    """

    feature_list: Sequence[str] = tuple(features)

    async def _dep(
        user: AuthUser,
        db: SessionDep,
        redis: AsyncRedis = Depends(get_redis),
    ) -> Entitlements:
        org_id = _org_id_from_user(user)
        ent = await paywall.resolve(db, org_id, redis)
        return paywall.require_features(ent, feature_list, mode=mode)

    return _dep


def require_paywall_any(*features: str) -> Callable:
    return require_paywall(*features, mode="any")
