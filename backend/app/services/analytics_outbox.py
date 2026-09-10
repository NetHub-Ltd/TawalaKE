"""Durable analytics outbox — enqueue on COMPLETED sale, drain asynchronously."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from loguru import logger
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlmodel import select, col
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.models import AnalyticsOutbox
from app.services.analytics_rollup import apply_sale_to_rollups, publish_rollup_event


async def enqueue_analytics_outbox(
    db: AsyncSession,
    *,
    sale_id: UUID,
    business_id: UUID,
    organization_id: Optional[UUID] = None,
) -> None:
    """Idempotent insert — one outbox row per sale."""
    stmt = (
        pg_insert(AnalyticsOutbox)
        .values(
            sale_id=sale_id,
            business_id=business_id,
            organization_id=organization_id,
            status="PENDING",
            attempts=0,
        )
        .on_conflict_do_nothing(constraint="uq_analytics_outbox_sale")
    )
    await db.exec(stmt)
    await db.flush()


async def process_outbox_entry(
    db: AsyncSession,
    entry: AnalyticsOutbox,
    redis: Any = None,
) -> bool:
    """Apply rollups for one outbox row. Returns True on success."""
    entry.status = "PROCESSING"
    entry.attempts = int(entry.attempts or 0) + 1
    db.add(entry)
    await db.flush()
    try:
        payload = await apply_sale_to_rollups(db, entry.sale_id, sign=1)
        entry.status = "DONE"
        entry.processed_at = datetime.now(timezone.utc)
        entry.last_error = None
        db.add(entry)
        await db.flush()
        if payload and redis is not None:
            await publish_rollup_event(redis, payload)
        return True
    except Exception as e:
        logger.exception("analytics outbox failed sale={}", entry.sale_id)
        entry.status = "FAILED"
        entry.last_error = str(e)[:1000]
        db.add(entry)
        await db.flush()
        return False


async def drain_pending_outbox(
    db: AsyncSession,
    *,
    limit: int = 50,
    redis: Any = None,
) -> Dict[str, int]:
    """Process pending/failed outbox rows (retry failed with attempts < 5)."""
    stmt = (
        select(AnalyticsOutbox)
        .where(
            col(AnalyticsOutbox.status).in_(["PENDING", "FAILED"]),
            col(AnalyticsOutbox.attempts) < 5,
        )
        .order_by(col(AnalyticsOutbox.created_at).asc())
        .limit(limit)
    )
    rows = (await db.exec(stmt)).all()
    ok = fail = 0
    for entry in rows:
        if await process_outbox_entry(db, entry, redis=redis):
            ok += 1
        else:
            fail += 1
    await db.commit()
    return {"processed_ok": ok, "processed_fail": fail, "scanned": len(rows)}
