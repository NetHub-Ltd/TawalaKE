"""Redis warm-cache for financial document snapshots (receipt/invoice).

Written after successful document generation so GET /receipts/{sale_id}
can return immediately after checkout or collect without waiting on DB/worker.
"""
from __future__ import annotations

import json
from typing import Any, Optional
from uuid import UUID

from app.utils.logging import logger

DOC_SNAPSHOT_TTL_SEC = 600  # 10 minutes
DOC_SNAPSHOT_KEY_PREFIX = "doc:snapshot:"


def snapshot_key(sale_id: UUID | str) -> str:
    return f"{DOC_SNAPSHOT_KEY_PREFIX}{sale_id}"


async def cache_document_snapshot(sale_id: UUID | str, snapshot: dict[str, Any]) -> None:
    """Best-effort SET of snapshot JSON. Never raises to callers."""
    try:
        from app.core.redis_client import redis_manager

        client = redis_manager.get_async_client()
        if client is None:
            return
        key = snapshot_key(sale_id)
        payload = json.dumps(snapshot, default=str)
        await client.set(key, payload, ex=DOC_SNAPSHOT_TTL_SEC)
        logger.debug("cached document snapshot sale_id=%s ttl=%s", sale_id, DOC_SNAPSHOT_TTL_SEC)
    except Exception as exc:  # noqa: BLE001
        logger.warning("document snapshot cache write failed sale_id=%s err=%s", sale_id, exc)


async def get_cached_document_snapshot(sale_id: UUID | str) -> Optional[dict[str, Any]]:
    """Best-effort GET. Returns None on miss or error."""
    try:
        from app.core.redis_client import redis_manager

        client = redis_manager.get_async_client()
        if client is None:
            return None
        raw = await client.get(snapshot_key(sale_id))
        if raw is None:
            return None
        if isinstance(raw, bytes):
            raw = raw.decode("utf-8")
        data = json.loads(raw)
        return data if isinstance(data, dict) else None
    except Exception as exc:  # noqa: BLE001
        logger.warning("document snapshot cache read failed sale_id=%s err=%s", sale_id, exc)
        return None


async def invalidate_document_snapshot(sale_id: UUID | str) -> None:
    """Best-effort delete (next generate will rewrite)."""
    try:
        from app.core.redis_client import redis_manager

        client = redis_manager.get_async_client()
        if client is None:
            return
        await client.delete(snapshot_key(sale_id))
    except Exception as exc:  # noqa: BLE001
        logger.warning("document snapshot cache invalidate failed sale_id=%s err=%s", sale_id, exc)
