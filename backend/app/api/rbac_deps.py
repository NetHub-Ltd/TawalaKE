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
)
from app.core.config import settings
from app.models.models import Staff, StaffBusinessAssignment, Business
from app.services.audit import record_audit
from app.utils.logging import logger


def _cache_ttl() -> int:
    return int(getattr(settings, "rbac_cache_ttl_sec", 120) or 120)


async def _cached_perm_values(
    redis: AsyncRedis, staff: Staff
) -> list[str]:
    key = perms_cache_key(staff.id)
    try:
        raw = await redis.get(key)
        if raw:
            if isinstance(raw, bytes):
                raw = raw.decode()
            return json.loads(raw)
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"rbac perms cache read failed: {exc}")

    perms = [p.value for p in permissions_for(staff)]
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
        enforce = getattr(settings, "rbac_enforce", True)
        if not enforce:
            return user

        ok = has_all_permissions(user, required_perms)
        # Prefer cache for observability / future soft checks; matrix is DB-backed via Staff.role
        try:
            await _cached_perm_values(redis, user)
        except Exception:  # noqa: BLE001
            pass

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
        enforce = getattr(settings, "rbac_enforce", True)
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
            # Some endpoints carry business only on nested payload; caller must pass explicitly
            return user  # type: ignore[return-value]

        if not enforce:
            return biz_id

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
