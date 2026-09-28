"""Durable background job records + Redis pub for SSE."""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlmodel import select

from app.core.session import AsyncSessionLocal
from app.models.models import BackgroundJob
from app.utils.logging import logger

REDIS_JOBS_CHANNEL = "tawala:jobs:events"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _safe_summary(data: dict[str, Any] | None) -> dict[str, Any]:
    if not data:
        return {}
    out: dict[str, Any] = {}
    for k, v in data.items():
        if k.lower() in {"password", "token", "secret", "authorization", "api_key"}:
            continue
        if isinstance(v, (str, int, float, bool)) or v is None:
            out[k] = v
        else:
            out[k] = str(v)[:200]
    return out


async def _publish(event: dict[str, Any]) -> None:
    try:
        from app.core.redis_client import redis_manager

        client = redis_manager.get_async_client()
        await client.publish(REDIS_JOBS_CHANNEL, json.dumps(event, default=str))
    except Exception as e:  # noqa: BLE001
        logger.debug("jobs publish failed: {}", e)


async def record_job_event(
    *,
    celery_task_id: Optional[str],
    name: str,
    status: str,
    organization_id: Optional[UUID] = None,
    business_id: Optional[UUID] = None,
    sale_id: Optional[UUID] = None,
    triggered_by_id: Optional[UUID] = None,
    triggered_by_role: str = "SYSTEM",
    triggered_by_email: Optional[str] = None,
    args_summary: Optional[dict[str, Any]] = None,
    error_message: Optional[str] = None,
    result_preview: Optional[str] = None,
    retries: Optional[int] = None,
) -> Optional[UUID]:
    """Insert or update a BackgroundJob row. Never raises to callers (log only)."""
    try:
        async with AsyncSessionLocal() as db:
            row: BackgroundJob | None = None
            if celery_task_id:
                row = (
                    await db.exec(
                        select(BackgroundJob).where(
                            BackgroundJob.celery_task_id == celery_task_id
                        )
                    )
                ).one_or_none()

            if row is None:
                row = BackgroundJob(
                    celery_task_id=celery_task_id,
                    name=name,
                    status=status,
                    organization_id=organization_id,
                    business_id=business_id,
                    sale_id=sale_id,
                    triggered_by_id=triggered_by_id,
                    triggered_by_role=triggered_by_role,
                    triggered_by_email=triggered_by_email,
                    args_summary=_safe_summary(args_summary),
                    error_message=error_message,
                    result_preview=(result_preview or "")[:512] or None,
                    retries=retries or 0,
                )
                if status == "STARTED":
                    row.started_at = _now()
                if status in ("SUCCESS", "FAILURE", "REVOKED"):
                    row.finished_at = _now()
                db.add(row)
            else:
                row.status = status
                if organization_id and not row.organization_id:
                    row.organization_id = organization_id
                if business_id and not row.business_id:
                    row.business_id = business_id
                if sale_id and not row.sale_id:
                    row.sale_id = sale_id
                if args_summary:
                    row.args_summary = {**(row.args_summary or {}), **_safe_summary(args_summary)}
                if error_message is not None:
                    row.error_message = error_message
                if result_preview is not None:
                    row.result_preview = (result_preview or "")[:512] or None
                if retries is not None:
                    row.retries = retries
                if status == "STARTED" and not row.started_at:
                    row.started_at = _now()
                if status in ("SUCCESS", "FAILURE", "REVOKED"):
                    row.finished_at = _now()
                db.add(row)

            await db.commit()
            await db.refresh(row)
            job_id = row.id

            await _publish(
                {
                    "type": "job_updated",
                    "job": {
                        "id": str(job_id),
                        "celery_task_id": row.celery_task_id,
                        "name": row.name,
                        "status": row.status,
                        "organization_id": str(row.organization_id) if row.organization_id else None,
                        "business_id": str(row.business_id) if row.business_id else None,
                        "sale_id": str(row.sale_id) if row.sale_id else None,
                        "error_message": row.error_message,
                        "retries": row.retries,
                        "started_at": row.started_at.isoformat() if row.started_at else None,
                        "finished_at": row.finished_at.isoformat() if row.finished_at else None,
                        "created_at": row.created_at.isoformat() if row.created_at else None,
                        "triggered_by_email": row.triggered_by_email,
                        "triggered_by_role": row.triggered_by_role,
                        "args_summary": row.args_summary,
                        "result_preview": row.result_preview,
                    },
                }
            )
            return job_id
    except Exception as e:  # noqa: BLE001
        logger.exception("record_job_event failed name=%s status=%s err=%s", name, status, e)
        return None


def record_job_event_sync(**kwargs: Any) -> Optional[UUID]:
    """Sync wrapper for Celery workers."""
    try:
        return asyncio.run(record_job_event(**kwargs))
    except Exception as e:  # noqa: BLE001
        logger.exception("record_job_event_sync failed: %s", e)
        return None
