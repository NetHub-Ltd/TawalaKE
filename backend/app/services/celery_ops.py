"""Celery worker/queue inspection and safe task replay."""
from __future__ import annotations

from typing import Any
from uuid import UUID

from app.core.celery_app import celery_app
from app.utils.logging import logger

KNOWN_TASKS = {
    "documents.generate_financial_document": {
        "queue": "tawala.documents",
        "args": ["sale_id"],
        "description": "Build receipt/invoice snapshot for a sale",
    },
    "dashboard.backfill_business_days": {
        "queue": "tawala.default",
        "args": ["business_id", "start_date?", "end_date?"],
        "description": "Rebuild daily dashboard rows for a business",
    },
}


def inspect_cluster(timeout: float = 2.0) -> dict[str, Any]:
    """Snapshot workers, queues, and in-flight work (best-effort)."""
    insp = celery_app.control.inspect(timeout=timeout)
    if insp is None:
        return {
            "ok": False,
            "error": "Celery inspect unavailable",
            "workers": [],
            "queues": list({r.get("queue") for r in KNOWN_TASKS.values()}),
            "active": {},
            "reserved": {},
            "scheduled": {},
            "registered": {},
            "stats": {},
            "known_tasks": KNOWN_TASKS,
        }

    try:
        active = insp.active() or {}
        reserved = insp.reserved() or {}
        scheduled = insp.scheduled() or {}
        registered = insp.registered() or {}
        stats = insp.stats() or {}
        ping = insp.ping() or {}
    except Exception as e:
        logger.warning("celery inspect failed: %s", e)
        return {
            "ok": False,
            "error": str(e),
            "workers": [],
            "queues": ["tawala.default", "tawala.documents"],
            "active": {},
            "reserved": {},
            "scheduled": {},
            "registered": {},
            "stats": {},
            "known_tasks": KNOWN_TASKS,
        }

    workers = sorted(set(ping.keys()) | set(stats.keys()) | set(active.keys()))
    # Flatten active tasks for UI
    active_flat = []
    for worker, tasks in (active or {}).items():
        for t in tasks or []:
            active_flat.append(
                {
                    "worker": worker,
                    "id": t.get("id"),
                    "name": t.get("name"),
                    "args": t.get("args"),
                    "kwargs": t.get("kwargs"),
                    "time_start": t.get("time_start"),
                }
            )
    reserved_flat = []
    for worker, tasks in (reserved or {}).items():
        for t in tasks or []:
            reserved_flat.append(
                {
                    "worker": worker,
                    "id": t.get("id"),
                    "name": t.get("name"),
                    "args": t.get("args"),
                    "kwargs": t.get("kwargs"),
                }
            )

    return {
        "ok": True,
        "workers": workers,
        "worker_count": len(workers),
        "queues": ["tawala.default", "tawala.documents"],
        "active": active_flat,
        "reserved": reserved_flat,
        "scheduled": scheduled,
        "registered": registered,
        "stats": {
            w: {
                "pool": (stats.get(w) or {}).get("pool"),
                "total": (stats.get(w) or {}).get("total"),
            }
            for w in workers
        },
        "known_tasks": KNOWN_TASKS,
        "broker": "redis",
    }


def replay_task(task_name: str, kwargs: dict[str, Any] | None = None) -> dict[str, Any]:
    """Enqueue a known task. Returns celery task id."""
    if task_name not in KNOWN_TASKS:
        raise ValueError(f"Unknown or disallowed task: {task_name}")
    kwargs = dict(kwargs or {})

    if task_name == "documents.generate_financial_document":
        sale_id = kwargs.get("sale_id")
        if not sale_id:
            raise ValueError("sale_id is required")
        # validate uuid shape
        UUID(str(sale_id))
        async_result = celery_app.send_task(
            task_name,
            args=[str(sale_id)],
            queue=KNOWN_TASKS[task_name]["queue"],
        )
        return {"task_id": async_result.id, "task": task_name, "sale_id": str(sale_id)}

    if task_name == "dashboard.backfill_business_days":
        business_id = kwargs.get("business_id")
        if not business_id:
            raise ValueError("business_id is required")
        UUID(str(business_id))
        args = [str(business_id)]
        start = kwargs.get("start_date") or kwargs.get("start_iso")
        end = kwargs.get("end_date") or kwargs.get("end_iso")
        if start:
            args.append(str(start))
        if end:
            args.append(str(end))
        async_result = celery_app.send_task(
            task_name,
            args=args,
            queue=KNOWN_TASKS[task_name]["queue"],
        )
        return {
            "task_id": async_result.id,
            "task": task_name,
            "business_id": str(business_id),
        }

    raise ValueError(f"No replay handler for {task_name}")
