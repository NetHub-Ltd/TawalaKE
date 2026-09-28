"""Org-scoped job history, SSE, Celery inspect, and retry (Owner / Admin / Manager)."""
from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import Any, AsyncIterator, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlmodel import col, select

from app.api.deps import SessionDep
from app.api.rbac_deps import require_permissions
from app.core.rbac import Permission
from app.models.models import BackgroundJob, Business, Sale, Staff
from app.schemas.schemas import ApiResponse
from app.services import celery_ops
from app.services.background_jobs import REDIS_JOBS_CHANNEL, record_job_event
from app.utils.logging import logger

router = APIRouter()


class ReplayBody(BaseModel):
    task: str = Field(..., description="Celery task name")
    sale_id: Optional[UUID] = None
    business_id: Optional[UUID] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


def _job_to_dict(j: BackgroundJob) -> dict[str, Any]:
    return {
        "id": str(j.id),
        "celery_task_id": j.celery_task_id,
        "name": j.name,
        "status": j.status,
        "organization_id": str(j.organization_id) if j.organization_id else None,
        "business_id": str(j.business_id) if j.business_id else None,
        "sale_id": str(j.sale_id) if j.sale_id else None,
        "triggered_by_id": str(j.triggered_by_id) if j.triggered_by_id else None,
        "triggered_by_role": j.triggered_by_role,
        "triggered_by_email": j.triggered_by_email,
        "args_summary": j.args_summary or {},
        "error_message": j.error_message,
        "result_preview": j.result_preview,
        "retries": j.retries,
        "started_at": j.started_at.isoformat() if j.started_at else None,
        "finished_at": j.finished_at.isoformat() if j.finished_at else None,
        "created_at": j.created_at.isoformat() if j.created_at else None,
        "updated_at": j.updated_at.isoformat() if j.updated_at else None,
    }


@router.get("/status", response_model=ApiResponse[dict])
async def jobs_status(
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.JOBS_MANAGE)),
):
    """Workers, queues, active/reserved tasks (cluster-wide snapshot)."""
    data = celery_ops.inspect_cluster()
    return ApiResponse(status=True, status_code=200, message="ok", data=data)


@router.get("/history", response_model=ApiResponse[dict])
async def jobs_history(
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.JOBS_MANAGE)),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Historical background jobs for the caller's organization."""
    org_id = getattr(user, "organization_id", None) or getattr(user, "tenant_id", None)
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization context")

    q = select(BackgroundJob).where(BackgroundJob.organization_id == org_id)
    if status_filter:
        q = q.where(BackgroundJob.status == status_filter.upper())
    q = q.order_by(col(BackgroundJob.created_at).desc()).offset(offset).limit(limit)
    rows = (await db.exec(q)).all()
    return ApiResponse(
        status=True,
        status_code=200,
        message="ok",
        data={"items": [_job_to_dict(r) for r in rows], "limit": limit, "offset": offset},
    )


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
            await record_job_event(
                celery_task_id=result.get("task_id") if isinstance(result, dict) else None,
                name=body.task,
                status="PENDING",
                organization_id=org_id,
                business_id=getattr(sale, "business_id", None),
                sale_id=body.sale_id,
                triggered_by_id=user.id,
                triggered_by_role="STAFF",
                triggered_by_email=getattr(user, "email", None),
                args_summary={"sale_id": str(body.sale_id), "replay": True},
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
            await record_job_event(
                celery_task_id=result.get("task_id") if isinstance(result, dict) else None,
                name=body.task,
                status="PENDING",
                organization_id=org_id,
                business_id=body.business_id,
                triggered_by_id=user.id,
                triggered_by_role="STAFF",
                triggered_by_email=getattr(user, "email", None),
                args_summary={
                    "business_id": str(body.business_id),
                    "start_date": body.start_date,
                    "end_date": body.end_date,
                    "replay": True,
                },
            )
        else:
            raise HTTPException(status_code=400, detail="Task not allowed")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    return ApiResponse(status=True, status_code=200, message="queued", data=result)


@router.post("/{job_id}/retry", response_model=ApiResponse[dict])
async def jobs_retry(
    job_id: UUID,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.JOBS_MANAGE)),
):
    """Retry a failed (or any) historical job row for this organization."""
    org_id = getattr(user, "organization_id", None) or getattr(user, "tenant_id", None)
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization context")

    job = (
        await db.exec(select(BackgroundJob).where(BackgroundJob.id == job_id))
    ).one_or_none()
    if not job or job.organization_id != org_id:
        raise HTTPException(status_code=404, detail="Job not found")

    args = job.args_summary or {}
    if job.name == "documents.generate_financial_document":
        sale_id = args.get("sale_id") or (str(job.sale_id) if job.sale_id else None)
        if not sale_id:
            raise HTTPException(status_code=400, detail="Job has no sale_id")
        result = celery_ops.replay_task(job.name, {"sale_id": str(sale_id)})
    elif job.name == "dashboard.backfill_business_days":
        business_id = args.get("business_id") or (
            str(job.business_id) if job.business_id else None
        )
        if not business_id:
            raise HTTPException(status_code=400, detail="Job has no business_id")
        result = celery_ops.replay_task(
            job.name,
            {
                "business_id": str(business_id),
                "start_date": args.get("start") or args.get("start_date"),
                "end_date": args.get("end") or args.get("end_date"),
            },
        )
    else:
        raise HTTPException(status_code=400, detail="Task not retryable")

    new_task_id = result.get("task_id") if isinstance(result, dict) else None
    await record_job_event(
        celery_task_id=new_task_id,
        name=job.name,
        status="PENDING",
        organization_id=org_id,
        business_id=job.business_id,
        sale_id=job.sale_id,
        triggered_by_id=user.id,
        triggered_by_role="STAFF",
        triggered_by_email=getattr(user, "email", None),
        args_summary={**args, "retry_of": str(job.id)},
    )
    return ApiResponse(status=True, status_code=200, message="queued", data=result)


@router.get("/stream")
async def jobs_stream(
    request: Request,
    db: SessionDep,
    user: Staff = Depends(require_permissions(Permission.JOBS_MANAGE)),
):
    """SSE stream of job status updates for the caller's organization."""
    org_id = getattr(user, "organization_id", None) or getattr(user, "tenant_id", None)
    if not org_id:
        raise HTTPException(status_code=403, detail="No organization context")
    org_str = str(org_id)

    async def event_generator() -> AsyncIterator[str]:
        yield f"data: {json.dumps({'type': 'connected', 'organization_id': org_str})}\n\n"
        try:
            from app.core.redis_client import redis_manager

            client = redis_manager.get_async_client()
            pubsub = client.pubsub()
            await pubsub.subscribe(REDIS_JOBS_CHANNEL)
            try:
                while True:
                    if await request.is_disconnected():
                        break
                    msg = await pubsub.get_message(
                        ignore_subscribe_messages=True, timeout=1.0
                    )
                    if msg and msg.get("type") == "message":
                        raw = msg.get("data")
                        if isinstance(raw, bytes):
                            raw = raw.decode("utf-8", errors="replace")
                        try:
                            payload = json.loads(raw)
                            job = payload.get("job") or {}
                            if job.get("organization_id") == org_str or job.get(
                                "organization_id"
                            ) is None:
                                yield f"data: {json.dumps(payload)}\n\n"
                        except Exception:  # noqa: BLE001
                            pass
                    else:
                        # heartbeat keeps proxies from closing idle streams
                        yield f": heartbeat {datetime.utcnow().isoformat()}\n\n"
                        await asyncio.sleep(0.05)
            finally:
                await pubsub.unsubscribe(REDIS_JOBS_CHANNEL)
                await pubsub.close()
        except Exception as e:  # noqa: BLE001
            logger.warning("jobs SSE error: {}", e)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
