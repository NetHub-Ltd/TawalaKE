"""Celery: rebuild dedicated dashboard day tables from COMPLETED sales."""
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Optional
from uuid import UUID

from app.core.celery_app import celery_app
from app.utils.logging import logger


def _org_for_business(business_id: str) -> UUID | None:
    try:
        from app.core.session import AsyncSessionLocal
        from app.models.models import Business
        from sqlmodel import select

        async def _run():
            async with AsyncSessionLocal() as db:
                biz = (
                    await db.exec(
                        select(Business).where(Business.id == UUID(str(business_id)))
                    )
                ).one_or_none()
                return getattr(biz, "organization_id", None) if biz else None

        return asyncio.run(_run())
    except Exception as e:  # noqa: BLE001
        logger.debug("org lookup for business failed: %s", e)
        return None


@celery_app.task(
    name="dashboard.backfill_business_days",
    bind=True,
    max_retries=2,
    default_retry_delay=30,
)
def backfill_business_dashboard_days(
    self,
    business_id: str,
    start_iso: Optional[str] = None,
    end_iso: Optional[str] = None,
):
    from app.services.background_jobs import record_job_event_sync

    task_id = getattr(getattr(self, "request", None), "id", None)
    retries = int(getattr(getattr(self, "request", None), "retries", 0) or 0)
    org_id = _org_for_business(business_id)
    args = {
        "business_id": str(business_id),
        "start": start_iso,
        "end": end_iso,
    }

    record_job_event_sync(
        celery_task_id=task_id,
        name="dashboard.backfill_business_days",
        status="STARTED" if retries == 0 else "RETRY",
        organization_id=org_id,
        business_id=UUID(str(business_id)) if business_id else None,
        args_summary=args,
        retries=retries,
    )

    logger.info(
        "celery dashboard.backfill business_id=%s start=%s end=%s",
        business_id,
        start_iso,
        end_iso,
    )
    from app.core.session import AsyncSessionLocal
    from app.services.dashboard_daily import rebuild_business_range

    async def _go():
        start = datetime.fromisoformat(start_iso) if start_iso else None
        end = datetime.fromisoformat(end_iso) if end_iso else None
        async with AsyncSessionLocal() as db:
            return await rebuild_business_range(
                db,
                business_id=UUID(business_id),
                start=start,
                end=end,
            )

    try:
        result = asyncio.run(_go())
        logger.info("celery dashboard.backfill done %s", result)
        record_job_event_sync(
            celery_task_id=task_id,
            name="dashboard.backfill_business_days",
            status="SUCCESS",
            organization_id=org_id,
            business_id=UUID(str(business_id)) if business_id else None,
            args_summary=args,
            result_preview=str(result)[:512] if result is not None else "ok",
            retries=retries,
        )
        return result
    except Exception as exc:
        logger.exception("celery dashboard.backfill failed business_id=%s", business_id)
        record_job_event_sync(
            celery_task_id=task_id,
            name="dashboard.backfill_business_days",
            status="FAILURE",
            organization_id=org_id,
            business_id=UUID(str(business_id)) if business_id else None,
            args_summary=args,
            error_message=str(exc)[:2000],
            retries=retries,
        )
        raise self.retry(exc=exc)


def enqueue_dashboard_backfill(
    business_id: UUID,
    *,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
) -> Optional[str]:
    try:
        async_result = backfill_business_dashboard_days.delay(
            str(business_id),
            start.isoformat() if start else None,
            end.isoformat() if end else None,
        )
        try:
            from app.services.background_jobs import record_job_event_sync

            org_id = _org_for_business(str(business_id))
            record_job_event_sync(
                celery_task_id=async_result.id,
                name="dashboard.backfill_business_days",
                status="PENDING",
                organization_id=org_id,
                business_id=business_id,
                args_summary={
                    "business_id": str(business_id),
                    "start": start.isoformat() if start else None,
                    "end": end.isoformat() if end else None,
                },
            )
        except Exception as e:  # noqa: BLE001
            logger.debug("pending job record failed: %s", e)
        return async_result.id
    except Exception as e:
        logger.warning("enqueue dashboard backfill failed: %s", e)
        return None
