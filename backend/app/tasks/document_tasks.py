"""Celery tasks for financial document generation (receipt / invoice snapshots).

Internal-only: workers do not check staff permissions. Viewing documents is
gated on the API with Permission.DOCUMENTS_READ (and tenant scope).
"""
from __future__ import annotations

import asyncio
from uuid import UUID

from app.core.celery_app import celery_app
from app.utils.logging import logger


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
    logger.info(
        "celery documents.generate_financial_document sale_id=%s attempt=%s",
        sale_id,
        self.request.retries,
    )
    from app.tasks.worker import async_process_document_generation

    try:
        result = asyncio.run(async_process_document_generation(UUID(str(sale_id))))
        logger.info(
            "celery documents.generate_financial_document done sale_id=%s result=%s",
            sale_id,
            (result or "")[:120],
        )
        return result or "ok"
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "celery documents.generate_financial_document failed sale_id=%s", sale_id
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
        return async_result.id
    except Exception as exc:  # noqa: BLE001
        logger.error(
            "failed to enqueue document generation sale_id=%s err=%s",
            sale_id,
            exc,
        )
        return None
