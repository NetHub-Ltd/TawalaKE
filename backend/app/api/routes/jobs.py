"""Org-scoped Celery job visibility and replay (Owner / Admin / Manager)."""
from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import select

from app.api.deps import SessionDep
from app.api.rbac_deps import require_permissions
from app.core.rbac import Permission
from app.models.models import Business, Sale, Staff
from app.schemas.schemas import ApiResponse
from app.services import celery_ops

router = APIRouter()


class ReplayBody(BaseModel):
    task: str = Field(..., description="Celery task name")
    sale_id: Optional[UUID] = None
    business_id: Optional[UUID] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@router.get("/status", response_model=ApiResponse[dict])
async def jobs_status(
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.JOBS_MANAGE)),
):
    """Workers, queues, active/reserved tasks (cluster-wide snapshot)."""
    data = celery_ops.inspect_cluster()
    return ApiResponse(message="ok", data=data)


@router.post("/replay", response_model=ApiResponse[dict])
async def jobs_replay(
    body: ReplayBody,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.JOBS_MANAGE)),
):
    """
    Re-queue a known task. Document replay is limited to sales in the caller's org.
    Dashboard backfill limited to businesses in the caller's org.
    """
    org_id = getattr(user, "organization_id", None) or getattr(user, "tenant_id", None)
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization context")

    try:
        if body.task == "documents.generate_financial_document":
            if not body.sale_id:
                raise HTTPException(status_code=400, detail="sale_id required")
            sale = (
                await db.exec(select(Sale).where(Sale.id == body.sale_id))
            ).one_or_none()
            if not sale or sale.organization_id != org_id:
                raise HTTPException(status_code=404, detail="Sale not found in your organization")
            result = celery_ops.replay_task(
                body.task, {"sale_id": str(body.sale_id)}
            )
        elif body.task == "dashboard.backfill_business_days":
            if not body.business_id:
                raise HTTPException(status_code=400, detail="business_id required")
            biz = (
                await db.exec(select(Business).where(Business.id == body.business_id))
            ).one_or_none()
            if not biz or biz.organization_id != org_id:
                raise HTTPException(
                    status_code=404, detail="Business not found in your organization"
                )
            result = celery_ops.replay_task(
                body.task,
                {
                    "business_id": str(body.business_id),
                    "start_date": body.start_date,
                    "end_date": body.end_date,
                },
            )
        else:
            raise HTTPException(status_code=400, detail="Task not allowed")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return ApiResponse(message="queued", data=result)
