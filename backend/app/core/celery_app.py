"""Celery application — broker = Redis (same redis_url as cache).

Workers are internal process actors: no HTTP auth. Authorization for *viewing*
documents remains on API routes (documents:read).
"""
from __future__ import annotations

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "tawala",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.document_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    task_default_queue="tawala.default",
    task_routes={
        "documents.generate_financial_document": {"queue": "tawala.documents"},
    },
)
