"""Financial document generation (receipt / invoice snapshots).

Primary path: FastAPI BackgroundTasks (in-process, after response is sent).
Jobs table (background_jobs) is the durable source of truth for status.

Celery task remains registered for optional workers / replay tooling but is
not used on the hot checkout path.
"""
from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from app.utils.logging import logger

if TYPE_CHECKING:
    from fastapi import BackgroundTasks


def _org_for_sale(sale_id: str) -> tuple[UUID | None, UUID | None]:
    """Best-effort org/business for a sale (sync helper)."""
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


async def run_document_generation_job(
    sale_id: UUID,
    *,
    job_id: Optional[UUID] = None,
) -> str:
    """
    Generate financial document and update background_jobs row.
    Safe to call from FastAPI BackgroundTasks (async).
    """
    from app.services.background_jobs import record_job_event
    from app.tasks.worker import async_process_document_generation

    task_key = str(job_id or uuid4())
    org_id, biz_id = None, None
    try:
        from app.core.session import AsyncSessionLocal
        from app.models.models import Sale
        from sqlmodel import select

        async with AsyncSessionLocal() as db:
            sale = (
                await db.exec(select(Sale).where(Sale.id == sale_id))
            ).one_or_none()
            if sale:
                org_id = getattr(sale, "organization_id", None)
                biz_id = getattr(sale, "business_id", None)
    except Exception as e:  # noqa: BLE001
        logger.debug("org lookup async failed: %s", e)

    await record_job_event(
        celery_task_id=task_key,
        name="documents.generate_financial_document",
        status="STARTED",
        organization_id=org_id,
        business_id=biz_id,
        sale_id=sale_id,
        args_summary={"sale_id": str(sale_id), "runner": "fastapi_background"},
    )
    logger.info(
        "background documents.generate_financial_document sale_id=%s job=%s",
        sale_id,
        task_key,
    )
    try:
        result = await async_process_document_generation(sale_id)
        await record_job_event(
            celery_task_id=task_key,
            name="documents.generate_financial_document",
            status="SUCCESS",
            organization_id=org_id,
            business_id=biz_id,
            sale_id=sale_id,
            args_summary={"sale_id": str(sale_id), "runner": "fastapi_background"},
            result_preview=(result or "ok")[:512],
        )
        logger.info(
            "background document done sale_id=%s result=%s",
            sale_id,
            (result or "")[:120],
        )
        return result or "ok"
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "background document failed sale_id=%s", sale_id
        )
        await record_job_event(
            celery_task_id=task_key,
            name="documents.generate_financial_document",
            status="FAILURE",
            organization_id=org_id,
            business_id=biz_id,
            sale_id=sale_id,
            args_summary={"sale_id": str(sale_id), "runner": "fastapi_background"},
            error_message=str(exc)[:2000],
        )
        raise


def schedule_document_generation(
    background_tasks: "BackgroundTasks",
    sale_id: UUID,
) -> str:
    """
    Dispatch document generation via FastAPI BackgroundTasks immediately after
    the response is sent. Records a PENDING row in background_jobs.
    Returns a correlation id stored in celery_task_id column (legacy column name).
    """
    from app.services.background_jobs import record_job_event_sync

    job_key = str(uuid4())
    org_id, biz_id = _org_for_sale(str(sale_id))
    try:
        record_job_event_sync(
            celery_task_id=job_key,
            name="documents.generate_financial_document",
            status="PENDING",
            organization_id=org_id,
            business_id=biz_id,
            sale_id=sale_id,
            args_summary={"sale_id": str(sale_id), "runner": "fastapi_background"},
        )
    except Exception as e:  # noqa: BLE001
        logger.warning("record PENDING job failed sale_id=%s err=%s", sale_id, e)

    background_tasks.add_task(
        run_document_generation_job,
        sale_id,
        job_id=UUID(job_key),
    )
    logger.info(
        "scheduled background document generation sale_id=%s job_id=%s",
        sale_id,
        job_key,
    )
    return job_key


def enqueue_document_generation(sale_id: UUID) -> str | None:
    """
    Legacy entry: no BackgroundTasks available (e.g. some routes).

    Runs generation in a daemon thread so the caller is not blocked for long.
    Prefer schedule_document_generation when BackgroundTasks is available.
    """
    import threading

    job_key = str(uuid4())
    org_id, biz_id = _org_for_sale(str(sale_id))
    try:
        from app.services.background_jobs import record_job_event_sync

        record_job_event_sync(
            celery_task_id=job_key,
            name="documents.generate_financial_document",
            status="PENDING",
            organization_id=org_id,
            business_id=biz_id,
            sale_id=sale_id,
            args_summary={"sale_id": str(sale_id), "runner": "thread"},
        )
    except Exception as e:  # noqa: BLE001
        logger.warning("record PENDING (thread) failed: %s", e)

    def _runner() -> None:
        try:
            asyncio.run(run_document_generation_job(sale_id, job_id=UUID(job_key)))
        except Exception as exc:  # noqa: BLE001
            logger.exception("thread document generation failed sale_id=%s", sale_id)

    t = threading.Thread(target=_runner, name=f"doc-gen-{sale_id}", daemon=True)
    t.start()
    logger.info(
        "thread-scheduled document generation sale_id=%s job_id=%s", sale_id, job_key
    )
    return job_key


# ---------------------------------------------------------------------------
# Optional Celery task (kept for tooling / replay; not used on checkout path)
# ---------------------------------------------------------------------------
try:
    from app.core.celery_app import celery_app

    @celery_app.task(
        name="documents.generate_financial_document",
        bind=True,
        max_retries=3,
        default_retry_delay=20,
    )
    def generate_financial_document(self, sale_id: str) -> str:
        """Celery path kept for optional workers; prefer BackgroundTasks."""
        return asyncio.run(
            run_document_generation_job(
                UUID(str(sale_id)),
                job_id=UUID(str(getattr(getattr(self, "request", None), "id", uuid4()))),
            )
        )
except Exception:  # noqa: BLE001
    # Celery not configured in some test environments
    def generate_financial_document(*args, **kwargs):  # type: ignore[misc]
        raise RuntimeError("Celery document task unavailable")
