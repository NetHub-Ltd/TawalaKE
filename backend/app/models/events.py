"""Domain events and outbox (SPEC D.6 / M9)."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from sqlmodel import Field

from app.models.base import BaseMixin


class OutboxStatus(StrEnum):
    PENDING = "pending"
    PUBLISHED = "published"
    FAILED = "failed"


class DomainEvent(BaseMixin, table=True):
    """Immutable domain event record (payload must not be updated in app code)."""

    __tablename__ = "domain_events"

    event_type: str = Field(max_length=128, index=True)
    occurred_at: datetime = Field(nullable=False)
    business_id: UUID | None = Field(default=None, index=True)
    actor_user_id: UUID | None = Field(default=None)
    request_id: UUID | None = Field(default=None)
    aggregate_type: str = Field(max_length=64)
    aggregate_id: UUID = Field(index=True)
    version: int = Field(default=1)
    payload: dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON().with_variant(JSONB(), "postgresql"), nullable=False),
    )


class OutboxEntry(BaseMixin, table=True):
    __tablename__ = "outbox_entries"

    event_id: UUID = Field(foreign_key="domain_events.id", unique=True, index=True)
    status: OutboxStatus = Field(default=OutboxStatus.PENDING)
    attempts: int = Field(default=0)
    next_attempt_at: datetime | None = Field(default=None)
    last_error: str | None = Field(default=None, max_length=1024)
