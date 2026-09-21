"""Outbox publisher claim / publish / retry (T4)."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from sqlmodel import select

from app.core_platform.events.publisher import OutboxPublisher
from app.core_platform.events.service import EventService
from app.models.events import OutboxEntry, OutboxStatus


@pytest.mark.asyncio
async def test_publisher_marks_published(db_session):
    biz = uuid4()
    event = await EventService(db_session).emit(
        event_type="test.created",
        aggregate_type="test",
        aggregate_id=uuid4(),
        payload={"ok": True},
        business_id=biz,
        commit=True,
    )
    pub = OutboxPublisher(db_session)
    stats = await pub.process_batch(limit=10)
    assert stats["claimed"] >= 1
    assert stats["published"] >= 1
    assert stats["failed"] == 0

    entry = (await db_session.exec(
        select(OutboxEntry).where(OutboxEntry.event_id == event.id)
    )).first()
    assert entry is not None
    assert entry.status == OutboxStatus.PUBLISHED
    assert entry.attempts >= 1


@pytest.mark.asyncio
async def test_publisher_retry_on_failure(db_session):
    event = await EventService(db_session).emit(
        event_type="test.fail",
        aggregate_type="test",
        aggregate_id=uuid4(),
        payload={},
        commit=True,
    )

    async def boom(_event, _entry):
        raise RuntimeError("delivery down")

    pub = OutboxPublisher(db_session, deliver=boom, max_attempts=3)
    stats = await pub.process_batch(limit=10)
    assert stats["failed"] >= 1

    entry = (await db_session.exec(
        select(OutboxEntry).where(OutboxEntry.event_id == event.id)
    )).first()
    assert entry is not None
    assert entry.status == OutboxStatus.FAILED
    assert entry.attempts >= 1
    assert entry.last_error is not None
    assert "delivery down" in (entry.last_error or "")
    assert entry.next_attempt_at is not None


@pytest.mark.asyncio
async def test_published_not_reclaimed(db_session):
    event = await EventService(db_session).emit(
        event_type="test.once",
        aggregate_type="test",
        aggregate_id=uuid4(),
        payload={},
        commit=True,
    )
    pub = OutboxPublisher(db_session)
    await pub.process_batch(limit=50)
    # second pass should not re-claim the published row
    claimed = await OutboxPublisher(db_session).claim_batch(limit=50)
    ids = {e.event_id for e, _ in claimed}
    assert event.id not in ids
