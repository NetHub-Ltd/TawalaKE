"""FastAPI dependencies for hard tenant RBAC."""
from __future__ import annotations

import json
from typing import Callable, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.deps import SessionDep, AuthUser, get_redis, AsyncRedis
from app.core.rbac import (
    Permission,
    has_all_permissions,
    permissions_for,
    is_org_wide_role,
    perms_cache_key,
    businesses_cache_key,
    effective_role,
    org_deny_cache_key,
)
from app.core.config import settings
from app.models.models import (
    Staff,
    StaffBusinessAssignment,
    Business,
    OrganizationPermissionOverride,
    StaffPermissionOverride,
)
from app.services.audit import record_audit
from app.utils.logging import logger


def _cache_ttl() -> int:
    return int(getattr(settings, "rbac_cache_ttl_sec", 120) or 120)


async def _load_org_denies(db: AsyncSession, organization_id: UUID | None) -> list[str]:
    if not organization_id:
        return []
    rows = list(
        await db.exec(
            select(OrganizationPermissionOverride).where(
                OrganizationPermissionOverride.organization_id == organization_id,
                OrganizationPermissionOverride.deleted_at.is_(None),
                OrganizationPermissionOverride.effect == "DENY",
            )
        )
    )
    return [r.permission_code for r in rows]


async def _load_staff_effects(db: AsyncSession, staff_id: UUID) -> dict[str, str]:
    rows = list(
        await db.exec(
            select(StaffPermissionOverride).where(
                StaffPermissionOverride.staff_id == staff_id,
                StaffPermissionOverride.deleted_at.is_(None),
            )
        )
    )
    return {r.permission_code: r.effect for r in rows}


async def _cached_perm_values(
    redis: AsyncRedis,
    staff: Staff,
    db: AsyncSession | None = None,
) -> list[str]:
    """Effective permission codes (role ⊕ org/staff overrides), Redis-cached."""
    key = perms_cache_key(staff.id)
    try:
        raw = await redis.get(key)
        if raw:
            if isinstance(raw, bytes):
                raw = raw.decode()
            return json.loads(raw)
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"rbac perms cache read failed: {exc}")

    org_denies: list[str] = []
    staff_effects: dict[str, str] = {}
    if db is not None:
        org_denies = await _load_org_denies(db, getattr(staff, "organization_id", None))
        staff_effects = await _load_staff_effects(db, staff.id)

    perms = [
        p.value
        for p in permissions_for(
            staff, org_denies=org_denies, staff_effects=staff_effects
        )
    ]
    try:
        await redis.set(key, json.dumps(perms), ex=_cache_ttl())
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"rbac perms cache write failed: {exc}")
    return perms


async def purge_staff_rbac_cache(redis: AsyncRedis, staff_id: UUID) -> None:
    try:
        await redis.delete(perms_cache_key(staff_id), businesses_cache_key(staff_id))
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"rbac cache purge failed for {staff_id}: {exc}")


async def purge_org_rbac_cache(redis: AsyncRedis, organization_id: UUID, db: AsyncSession) -> None:
    """Drop cached effective perms for all non-deleted staff in the org."""
    try:
        await redis.delete(org_deny_cache_key(organization_id))
    except Exception:  # noqa: BLE001
        pass
    staff_ids = list(
        await db.exec(
            select(Staff.id).where(
                Staff.organization_id == organization_id,
                Staff.deleted_at.is_(None),
            )
        )
    )
    for sid in staff_ids:
        await purge_staff_rbac_cache(redis, sid)


def require_permissions(*required: Permission | str) -> Callable:
    """Dependency factory: require all listed permissions or 403."""

    required_perms = [
        p if isinstance(p, Permission) else Permission(str(p)) for p in required
    ]

    async def _dep(
        request: Request,
        user: AuthUser,
        db: SessionDep,
        redis: AsyncRedis = Depends(get_redis),
    ) -> Staff:
        effective = await _cached_perm_values(redis, user, db)
        required_codes = {p.value for p in required_perms}
        ok = required_codes.issubset(set(effective))

        if not ok:
            missing = [p.value for p in required_perms]
            await record_audit(
                db,
                actor=user,
                action="rbac.denied",
                outcome="denied",
                resource_type="endpoint",
                resource_id=str(request.url.path),
                meta={
                    "permissions": missing,
                    "method": request.method,
                    "role": (effective_role(user).value if effective_role(user) else None),
                },
                request_id=request.headers.get("x-request-id"),
                independent=True,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "RBAC_DENIED",
                    "message": "Insufficient permissions",
                    "permissions": missing,
                },
            )
        return user

    return _dep



def require_any_permissions(*required: Permission | str) -> Callable:
    """Dependency factory: require at least one of the listed permissions or 403."""

    required_perms = [
        p if isinstance(p, Permission) else Permission(str(p)) for p in required
    ]

    async def _dep(
        request: Request,
        user: AuthUser,
        db: SessionDep,
        redis: AsyncRedis = Depends(get_redis),
    ) -> Staff:
        effective = set(await _cached_perm_values(redis, user, db))
        codes = [p.value for p in required_perms]
        ok = any(c in effective for c in codes)
        if not ok:
            await record_audit(
                db,
                actor=user,
                action="rbac.denied",
                outcome="denied",
                resource_type="endpoint",
                resource_id=str(request.url.path),
                meta={
                    "permissions_any": codes,
                    "method": request.method,
                    "role": (effective_role(user).value if effective_role(user) else None),
                },
                request_id=request.headers.get("x-request-id"),
                independent=True,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "RBAC_DENIED",
                    "message": "Insufficient permissions",
                    "permissions_any": codes,
                },
            )
        return user

    return _dep


async def load_assigned_business_ids(
    db: AsyncSession,
    staff: Staff,
    redis: Optional[AsyncRedis] = None,
) -> set[UUID]:
    if is_org_wide_role(staff):
        # All businesses in org — resolve from DB when needed by caller
        return set()  # empty means "org-wide" sentinel handled by caller

    key = businesses_cache_key(staff.id)
    if redis is not None:
        try:
            raw = await redis.get(key)
            if raw:
                if isinstance(raw, bytes):
                    raw = raw.decode()
                return {UUID(x) for x in json.loads(raw)}
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"rbac businesses cache read failed: {exc}")

    stmt = select(StaffBusinessAssignment.business_id).where(
        StaffBusinessAssignment.staff_id == staff.id
    )
    rows = (await db.exec(stmt)).all()
    ids = {row if isinstance(row, UUID) else row[0] for row in rows}

    if redis is not None:
        try:
            await redis.set(
                key, json.dumps([str(i) for i in ids]), ex=_cache_ttl()
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"rbac businesses cache write failed: {exc}")
    return ids


async def assert_business_access(
    db: AsyncSession,
    user: Staff,
    business_id: UUID,
    redis: Optional[AsyncRedis] = None,
) -> Business:
    """
    Hard check: business exists, same org as caller, and assigned (unless org-wide role).
    Use from handlers when path/body already resolved a business_id.
    """
    biz = (await db.exec(select(Business).where(Business.id == business_id))).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    caller_org = user.organization_id or getattr(user, "tenant_id", None)
    if caller_org is None or biz.organization_id is None or str(caller_org) != str(biz.organization_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "RBAC_DENIED", "message": "Business not in your organization"},
        )

    if not is_org_wide_role(user):
        assigned = await load_assigned_business_ids(db, user, redis)
        if business_id not in assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "RBAC_DENIED", "message": "No access to this business"},
            )
    return biz


def require_business_access(
    business_id_param: str = "business_id",
    from_body: bool = False,
) -> Callable:
    """Ensure staff may access the given business (org-wide or assignment)."""

    async def _dep(
        request: Request,
        user: AuthUser,
        db: SessionDep,
        redis: AsyncRedis = Depends(get_redis),
    ) -> UUID:
        biz_id: Optional[UUID] = None

        if from_body:
            try:
                body = await request.json()
                raw = body.get(business_id_param) or body.get("business_id")
                if raw:
                    biz_id = UUID(str(raw))
            except Exception:  # noqa: BLE001
                biz_id = None
        else:
            raw = request.path_params.get(business_id_param) or request.query_params.get(
                business_id_param
            )
            if raw:
                biz_id = UUID(str(raw))

        if biz_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "RBAC_DENIED",
                    "message": "business_id is required for this action",
                },
            )

        # Org match
        biz = (
            await db.exec(select(Business).where(Business.id == biz_id))
        ).first()
        if not biz:
            raise HTTPException(status_code=404, detail="Business not found")

        if user.organization_id and biz.organization_id and user.organization_id != biz.organization_id:
            await record_audit(
                db,
                actor=user,
                action="rbac.denied",
                outcome="denied",
                resource_type="business",
                resource_id=str(biz_id),
                business_id=biz_id,
                meta={"reason": "org_mismatch"},
                independent=True,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "RBAC_DENIED", "message": "Business not in your organization"},
            )

        if is_org_wide_role(user):
            return biz_id

        assigned = await load_assigned_business_ids(db, user, redis)
        if biz_id not in assigned:
            await record_audit(
                db,
                actor=user,
                action="rbac.denied",
                outcome="denied",
                resource_type="business",
                resource_id=str(biz_id),
                business_id=biz_id,
                meta={"reason": "not_assigned"},
                independent=True,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "RBAC_DENIED", "message": "No access to this business"},
            )
        return biz_id

    return _dep
