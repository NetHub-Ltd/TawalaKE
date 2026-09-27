"""Celery: rebuild dedicated dashboard day tables from COMPLETED sales."""
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Optional
from uuid import UUID

from app.core.celery_app import celery_app
from app.utils.logging import logger


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
        return result
    except Exception as exc:
        logger.exception("celery dashboard.backfill failed business_id=%s", business_id)
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
        return async_result.id
    except Exception as e:
        logger.warning("enqueue dashboard backfill failed: %s", e)
        return None
