"""Organization staff management HTTP surface.

Sole mount: /api/v1/staff
All domain logic lives in app.crud.staff.staff_crud.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import SessionDep, get_redis, AsyncRedis
from app.api.rbac_deps import require_permissions
from app.core.rbac import Permission
from app.crud.staff import staff_crud
from app.models.models import Staff
from app.schemas.schemas import StaffResponse, ApiResponse
from app.schemas.staff_mgmt import (
    StaffUpdateIn,
    StaffBusinessesIn,
    StaffResetPasswordIn,
    StaffCreateManagedIn,
)

router = APIRouter()


@router.get("", response_model=ApiResponse[List[StaffResponse]])
async def list_org_staff(
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    if not user.organization_id:
        from fastapi import HTTPException

        raise HTTPException(400, detail="Actor has no organization")
    data = await staff_crud.list_org_staff(db, user.organization_id)
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.post("", response_model=ApiResponse[StaffResponse], status_code=201)
async def create_staff(
    payload: StaffCreateManagedIn,
    db: SessionDep,
    redis: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    data = await staff_crud.create_managed(
        db, actor=user, payload=payload, redis=redis
    )
    return ApiResponse(
        status=True, status_code=201, message="Staff created", data=data
    )


@router.get("/activity", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_staff_activity(
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
    staff_id: Optional[UUID] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    if not user.organization_id:
        from fastapi import HTTPException

        raise HTTPException(400, detail="Actor has no organization")
    data = await staff_crud.list_activity(
        db,
        organization_id=user.organization_id,
        staff_id=staff_id,
        limit=limit,
    )
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.get("/{staff_id}", response_model=ApiResponse[StaffResponse])
async def get_staff(
    staff_id: UUID,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    if not user.organization_id:
        from fastapi import HTTPException

        raise HTTPException(400, detail="Actor has no organization")
    target = await staff_crud.get_in_org(db, staff_id, user.organization_id)
    data = await staff_crud.to_response(db, target)
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.get("/{staff_id}/activity", response_model=ApiResponse[List[Dict[str, Any]]])
async def get_staff_activity(
    staff_id: UUID,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
    limit: int = Query(50, ge=1, le=200),
):
    if not user.organization_id:
        from fastapi import HTTPException

        raise HTTPException(400, detail="Actor has no organization")
    await staff_crud.get_in_org(db, staff_id, user.organization_id)
    data = await staff_crud.list_activity(
        db,
        organization_id=user.organization_id,
        staff_id=staff_id,
        limit=limit,
    )
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.patch("/{staff_id}", response_model=ApiResponse[StaffResponse])
async def update_staff(
    staff_id: UUID,
    payload: StaffUpdateIn,
    db: SessionDep,
    redis: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    data = await staff_crud.update_managed(
        db, actor=user, staff_id=staff_id, payload=payload, redis=redis
    )
    return ApiResponse(
        status=True, status_code=200, message="Staff updated", data=data
    )


@router.put("/{staff_id}/businesses", response_model=ApiResponse[StaffResponse])
async def set_staff_businesses(
    staff_id: UUID,
    payload: StaffBusinessesIn,
    db: SessionDep,
    redis: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    data = await staff_crud.set_businesses(
        db, actor=user, staff_id=staff_id, payload=payload, redis=redis
    )
    return ApiResponse(
        status=True, status_code=200, message="Assignments updated", data=data
    )


@router.post("/{staff_id}/reset-password", response_model=ApiResponse[dict])
async def reset_staff_password(
    staff_id: UUID,
    payload: StaffResetPasswordIn,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    await staff_crud.reset_password(
        db, actor=user, staff_id=staff_id, payload=payload
    )
    return ApiResponse(
        status=True, status_code=200, message="Password updated", data={}
    )
