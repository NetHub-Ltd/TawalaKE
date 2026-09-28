"""Celery tasks for financial document generation (receipt / invoice snapshots).

Internal-only: workers do not check staff permissions. Viewing documents is
gated on the API with Permission.DOCUMENTS_READ (and tenant scope).
"""
from __future__ import annotations

import asyncio
from uuid import UUID

from app.core.celery_app import celery_app
from app.utils.logging import logger


def _org_for_sale(sale_id: str) -> tuple[UUID | None, UUID | None]:
    """Best-effort org/business for a sale (sync helper for workers)."""
    try:
        from app.core.session import AsyncSessionLocal
        from app.models.models import Sale
        from sqlmodel import select

        async def _run():
            async with AsyncSessionLocal() as db:
                sale = (
                    await db.exec(select(Sale).where(Sale.id == UUID(str(sale_id))))
                ).one_or_none()
                if not sale:
                    return None, None
                return getattr(sale, "organization_id", None), getattr(
                    sale, "business_id", None
                )

        return asyncio.run(_run())
    except Exception as e:  # noqa: BLE001
        logger.debug("org lookup for sale failed: %s", e)
        return None, None


@celery_app.task(
    name="documents.generate_financial_document",
    bind=True,
    max_retries=5,
    default_retry_delay=20,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
)
def generate_financial_document(self, sale_id: str) -> str:
    """Build FinancialDocument row + immutable JSON snapshot for a completed/credit sale."""
    from app.services.background_jobs import record_job_event_sync

    task_id = getattr(getattr(self, "request", None), "id", None)
    retries = int(getattr(getattr(self, "request", None), "retries", 0) or 0)
    org_id, biz_id = _org_for_sale(sale_id)

    record_job_event_sync(
        celery_task_id=task_id,
        name="documents.generate_financial_document",
        status="STARTED" if retries == 0 else "RETRY",
        organization_id=org_id,
        business_id=biz_id,
        sale_id=UUID(str(sale_id)) if sale_id else None,
        args_summary={"sale_id": str(sale_id)},
        retries=retries,
    )

    logger.info(
        "celery documents.generate_financial_document sale_id=%s attempt=%s",
        sale_id,
        retries,
    )
    from app.tasks.worker import async_process_document_generation

    try:
        result = asyncio.run(async_process_document_generation(UUID(str(sale_id))))
        logger.info(
            "celery documents.generate_financial_document done sale_id=%s result=%s",
            sale_id,
            (result or "")[:120],
        )
        record_job_event_sync(
            celery_task_id=task_id,
            name="documents.generate_financial_document",
            status="SUCCESS",
            organization_id=org_id,
            business_id=biz_id,
            sale_id=UUID(str(sale_id)) if sale_id else None,
            args_summary={"sale_id": str(sale_id)},
            result_preview=(result or "ok")[:512],
            retries=retries,
        )
        return result or "ok"
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "celery documents.generate_financial_document failed sale_id=%s", sale_id
        )
        record_job_event_sync(
            celery_task_id=task_id,
            name="documents.generate_financial_document",
            status="FAILURE",
            organization_id=org_id,
            business_id=biz_id,
            sale_id=UUID(str(sale_id)) if sale_id else None,
            args_summary={"sale_id": str(sale_id)},
            error_message=str(exc)[:2000],
            retries=retries,
        )
        raise self.retry(exc=exc)


def enqueue_document_generation(sale_id: UUID) -> str | None:
    """
    Queue document generation after sale finalize.

    Returns Celery task id, or None if enqueue failed (caller should log; sale still committed).
    """
    try:
        async_result = generate_financial_document.delay(str(sale_id))
        logger.info(
            "enqueued documents.generate_financial_document sale_id=%s task_id=%s",
            sale_id,
            async_result.id,
        )
        try:
            from app.services.background_jobs import record_job_event_sync

            org_id, biz_id = _org_for_sale(str(sale_id))
            record_job_event_sync(
                celery_task_id=async_result.id,
                name="documents.generate_financial_document",
                status="PENDING",
                organization_id=org_id,
                business_id=biz_id,
                sale_id=sale_id,
                args_summary={"sale_id": str(sale_id)},
            )
        except Exception as e:  # noqa: BLE001
            logger.debug("pending job record failed: %s", e)
        return async_result.id
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "failed to enqueue document generation sale_id=%s err=%s",
            sale_id,
            exc,
        )
        return None
