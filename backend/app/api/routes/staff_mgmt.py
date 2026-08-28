"""Tenant staff management under org:staff:manage."""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import selectinload
from sqlmodel import select, func

from app.api.deps import SessionDep, AuthUser, get_redis, AsyncRedis
from app.api.rbac_deps import require_permissions, purge_staff_rbac_cache
from app.core.rbac import Permission, effective_role, has_permission
from app.core.security import security
from app.models.models import (
    Staff,
    StaffRole,
    StaffBusinessAssignment,
    Business,
)
from app.schemas.schemas import StaffResponse, MiniStoreResponse, ApiResponse
from app.schemas.staff_mgmt import (
    StaffUpdateIn,
    StaffBusinessesIn,
    StaffResetPasswordIn,
    StaffCreateManagedIn,
)
from app.services.audit import record_audit
from app.utils.logging import logger

router = APIRouter()


def _role_val(staff: Staff) -> StaffRole:
    r = effective_role(staff)
    if r is None:
        raise HTTPException(403, detail="Unknown actor role")
    return r


def _assert_can_manage_target(actor: Staff, target: Staff) -> None:
    actor_role = _role_val(actor)
    target_role = effective_role(target)

    if actor.organization_id and target.organization_id:
        if actor.organization_id != target.organization_id:
            raise HTTPException(403, detail={"code": "RBAC_DENIED", "message": "Cross-org staff access denied"})

    if target_role == StaffRole.OWNER and actor_role != StaffRole.OWNER:
        raise HTTPException(
            403,
            detail={"code": "RBAC_DENIED", "message": "Only an OWNER may modify OWNER accounts"},
        )


async def _count_owners(db, organization_id: UUID) -> int:
    stmt = (
        select(func.count())
        .select_from(Staff)
        .where(Staff.organization_id == organization_id)
        .where(Staff.role == StaffRole.OWNER)
        .where(Staff.active == True)  # noqa: E712
        .where(Staff.deleted_at.is_(None))
    )
    return int((await db.exec(stmt)).one() or 0)


async def _staff_response(db, staff: Staff) -> StaffResponse:
    stmt = (
        select(Staff)
        .where(Staff.id == staff.id)
        .options(selectinload(Staff.assigned_businesses))
    )
    row = (await db.exec(stmt)).unique().first() or staff
    businesses = []
    for b in getattr(row, "assigned_businesses", None) or []:
        businesses.append(
            MiniStoreResponse(
                id=b.id,
                name=getattr(b, "name", "") or "",
            )
            if hasattr(MiniStoreResponse, "model_fields")
            else MiniStoreResponse.model_validate(
                {"id": b.id, "name": getattr(b, "name", "") or ""}
            )
        )
    try:
        return StaffResponse(
            id=row.id,
            organization_id=row.organization_id,
            email=row.email,
            full_name=row.full_name,
            role=row.role,
            active=row.active,
            assigned_businesses=businesses,
        )
    except Exception:
        # Fallback if MiniStoreResponse shape differs
        return StaffResponse(
            id=row.id,
            organization_id=row.organization_id,
            email=row.email,
            full_name=row.full_name,
            role=row.role,
            active=row.active,
            assigned_businesses=[],
        )


@router.get("", response_model=ApiResponse[List[StaffResponse]])
async def list_org_staff(
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    if not user.organization_id:
        raise HTTPException(400, detail="Actor has no organization")
    stmt = (
        select(Staff)
        .where(Staff.organization_id == user.organization_id)
        .where(Staff.deleted_at.is_(None))
        .options(selectinload(Staff.assigned_businesses))
        .order_by(Staff.full_name)
    )
    rows = (await db.exec(stmt)).unique().all()
    data = []
    for s in rows:
        data.append(await _staff_response(db, s))
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.post("", response_model=ApiResponse[StaffResponse], status_code=201)
async def create_staff(
    payload: StaffCreateManagedIn,
    db: SessionDep,
    redis: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    actor_role = _role_val(user)
    if payload.role == StaffRole.OWNER and actor_role != StaffRole.OWNER:
        raise HTTPException(403, detail={"code": "RBAC_DENIED", "message": "Only OWNER may create OWNER"})

    org_id = payload.organization_id or user.organization_id
    if not org_id or (user.organization_id and org_id != user.organization_id):
        raise HTTPException(403, detail="Invalid organization")

    existing = (
        await db.exec(select(Staff).where(Staff.email == payload.email))
    ).first()
    if existing:
        raise HTTPException(400, detail="Email already registered")

    # Validate businesses belong to org
    for bid in payload.business_ids:
        biz = (await db.exec(select(Business).where(Business.id == bid))).first()
        if not biz or biz.organization_id != org_id:
            raise HTTPException(400, detail=f"Business {bid} not in organization")

    staff = Staff(
        id=uuid4(),
        tenant_id=org_id,
        organization_id=org_id,
        email=str(payload.email),
        full_name=payload.full_name,
        hashed_password=security.hash_password(payload.password),
        role=payload.role,
        active=True,
    )
    db.add(staff)
    await db.flush()

    for bid in payload.business_ids:
        db.add(
            StaffBusinessAssignment(
                id=uuid4(),
                staff_id=staff.id,
                business_id=bid,
                organization_id=org_id,
                role=payload.role,
            )
        )

    await db.commit()
    await purge_staff_rbac_cache(redis, staff.id)
    await record_audit(
        actor=user,
        action="staff.create",
        resource_type="staff",
        resource_id=staff.id,
        organization_id=org_id,
        meta={"role": payload.role.value, "email": str(payload.email)},
        independent=True,
    )
    return ApiResponse(
        status=True,
        status_code=201,
        message="Staff created",
        data=await _staff_response(db, staff),
    )


@router.patch("/{staff_id}", response_model=ApiResponse[StaffResponse])
async def update_staff(
    staff_id: UUID,
    payload: StaffUpdateIn,
    db: SessionDep,
    redis: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    target = (await db.exec(select(Staff).where(Staff.id == staff_id))).first()
    if not target:
        raise HTTPException(404, detail="Staff not found")
    _assert_can_manage_target(user, target)

    actor_role = _role_val(user)
    before = {
        "role": str(target.role),
        "active": target.active,
        "full_name": target.full_name,
    }

    if payload.role is not None:
        if payload.role == StaffRole.OWNER and actor_role != StaffRole.OWNER:
            raise HTTPException(403, detail="Only OWNER may assign OWNER role")
        if (
            effective_role(target) == StaffRole.OWNER
            and payload.role != StaffRole.OWNER
            and target.organization_id
        ):
            owners = await _count_owners(db, target.organization_id)
            if owners <= 1:
                raise HTTPException(400, detail="Cannot demote the last OWNER")
        target.role = payload.role

    if payload.active is not None:
        if (
            payload.active is False
            and effective_role(target) == StaffRole.OWNER
            and target.organization_id
        ):
            owners = await _count_owners(db, target.organization_id)
            if owners <= 1:
                raise HTTPException(400, detail="Cannot deactivate the last OWNER")
        target.active = payload.active

    if payload.full_name is not None:
        target.full_name = payload.full_name

    db.add(target)
    await db.commit()
    await purge_staff_rbac_cache(redis, target.id)
    await record_audit(
        actor=user,
        action="staff.update",
        resource_type="staff",
        resource_id=target.id,
        organization_id=target.organization_id,
        meta={"before": before, "after": payload.model_dump(exclude_none=True)},
        independent=True,
    )
    return ApiResponse(
        status=True,
        status_code=200,
        message="Staff updated",
        data=await _staff_response(db, target),
    )


@router.put("/{staff_id}/businesses", response_model=ApiResponse[StaffResponse])
async def set_staff_businesses(
    staff_id: UUID,
    payload: StaffBusinessesIn,
    db: SessionDep,
    redis: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    target = (await db.exec(select(Staff).where(Staff.id == staff_id))).first()
    if not target:
        raise HTTPException(404, detail="Staff not found")
    _assert_can_manage_target(user, target)
    org_id = target.organization_id or user.organization_id

    for bid in payload.business_ids:
        biz = (await db.exec(select(Business).where(Business.id == bid))).first()
        if not biz or (org_id and biz.organization_id != org_id):
            raise HTTPException(400, detail=f"Business {bid} not in organization")

    existing = (
        await db.exec(
            select(StaffBusinessAssignment).where(
                StaffBusinessAssignment.staff_id == staff_id
            )
        )
    ).all()
    for row in existing:
        await db.delete(row)
    await db.flush()

    for bid in payload.business_ids:
        db.add(
            StaffBusinessAssignment(
                id=uuid4(),
                staff_id=staff_id,
                business_id=bid,
                organization_id=org_id,
                role=target.role,
            )
        )
    await db.commit()
    await purge_staff_rbac_cache(redis, staff_id)
    await record_audit(
        actor=user,
        action="staff.assign_businesses",
        resource_type="staff",
        resource_id=staff_id,
        organization_id=org_id,
        meta={"business_ids": [str(b) for b in payload.business_ids]},
        independent=True,
    )
    return ApiResponse(
        status=True,
        status_code=200,
        message="Assignments updated",
        data=await _staff_response(db, target),
    )


@router.post("/{staff_id}/reset-password", response_model=ApiResponse[dict])
async def reset_staff_password(
    staff_id: UUID,
    payload: StaffResetPasswordIn,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    target = (await db.exec(select(Staff).where(Staff.id == staff_id))).first()
    if not target:
        raise HTTPException(404, detail="Staff not found")
    _assert_can_manage_target(user, target)
    target.hashed_password = security.hash_password(payload.password)
    db.add(target)
    await db.commit()
    await record_audit(
        actor=user,
        action="staff.reset_password",
        resource_type="staff",
        resource_id=staff_id,
        organization_id=target.organization_id,
        meta={},
        independent=True,
    )
    return ApiResponse(status=True, status_code=200, message="Password updated", data={})
