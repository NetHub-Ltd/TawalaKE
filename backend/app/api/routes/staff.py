"""Organization staff management HTTP surface.

Sole mount: /api/v1/staff
All domain logic lives in app.crud.staff.staff_crud.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, Query

from app.api.deps import SessionDep, get_redis, AsyncRedis
from app.api.rbac_deps import require_permissions
from app.core.config import settings
from app.core.mailer import mailer
from app.core.rbac import Permission
from app.crud.organization import organization_crud
from app.crud.staff import staff_crud
from app.models.models import Staff
from app.schemas.schemas import StaffResponse, ApiResponse
from app.schemas.staff_mgmt import (
    StaffUpdateIn,
    StaffBusinessesIn,
    StaffResetPasswordIn,
    StaffCreateManagedIn,
)
from app.utils.logging import logger

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


def _frontend_origin() -> str:
    url = (getattr(settings, "frontend_url", None) or "").strip()
    if not url:
        url = "https://tawala.nethub.co.ke"
    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"https://{url}"
    return url.rstrip("/")


async def _send_invite_email(
    *,
    background_tasks: BackgroundTasks,
    staff: Staff,
    actor: Staff,
    redis: AsyncRedis,
    db,
) -> None:
    token = await staff_crud.issue_staff_invite_token(staff=staff, redis=redis)
    invite_url = f"{_frontend_origin()}/invite/set-password?token={token}"
    org_name = None
    if actor.organization_id:
        try:
            org = await organization_crud.get_organization_by_id(
                db=db, org_id=actor.organization_id
            )
            org_name = getattr(org, "name", None)
        except Exception:
            org_name = None
    role_label = staff.role.value if hasattr(staff.role, "value") else str(staff.role)
    background_tasks.add_task(
        mailer.send_staff_invite,
        to_email=staff.email,
        invite_url=invite_url,
        user_name=staff.full_name,
        org_name=org_name,
        role_label=role_label,
        invited_by_name=getattr(actor, "full_name", None),
        expire_hours=48,
    )
    logger.info(f"Staff invite email queued for {staff.id}")


@router.post("", response_model=ApiResponse[StaffResponse], status_code=201)
async def create_staff(
    payload: StaffCreateManagedIn,
    background_tasks: BackgroundTasks,
    db: SessionDep,
    redis: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    """Create pending staff and email invite. Any role with ORG_STAFF_MANAGE."""
    data = await staff_crud.create_managed(
        db, actor=user, payload=payload, redis=redis
    )
    staff_row = await staff_crud.get_in_org(db, data.id, user.organization_id)
    await _send_invite_email(
        background_tasks=background_tasks,
        staff=staff_row,
        actor=user,
        redis=redis,
        db=db,
    )
    return ApiResponse(
        status=True,
        status_code=201,
        message="Invite sent. The team member must set a password from their email link.",
        data=data,
    )


@router.post("/{staff_id}/resend-invite", response_model=ApiResponse[StaffResponse])
async def resend_staff_invite(
    staff_id: UUID,
    background_tasks: BackgroundTasks,
    db: SessionDep,
    redis: AsyncRedis = Depends(get_redis),
    user: Staff = Depends(require_permissions(Permission.ORG_STAFF_MANAGE)),
):
    """Resend invite. Gated by ORG_STAFF_MANAGE (not ADMIN role specifically)."""
    data = await staff_crud.resend_invite(
        db, actor=user, staff_id=staff_id, redis=redis
    )
    staff_row = await staff_crud.get_in_org(db, staff_id, user.organization_id)
    await _send_invite_email(
        background_tasks=background_tasks,
        staff=staff_row,
        actor=user,
        redis=redis,
        db=db,
    )
    return ApiResponse(
        status=True, status_code=200, message="Invite resent", data=data
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
