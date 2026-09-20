"""Shared SQLModel base with audit / soft-delete metadata.

All Core tables extend :class:`BaseMixin` so identity, tenancy, and domain
models share the same primary key and lifecycle columns.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def utc_now_naive() -> datetime:
    """UTC now as naive datetime for TIMESTAMP WITHOUT TIME ZONE columns.

    PostgreSQL/asyncpg reject mixing offset-aware Python datetimes with
    TIMESTAMP WITHOUT TIME ZONE. Core stores UTC wall time without tzinfo.
    """
    return datetime.now(UTC).replace(tzinfo=None)


# Back-compat alias used across the codebase
def _utcnow() -> datetime:
    return utc_now_naive()


class BaseMixin(SQLModel):
    """Default metadata fields for every Core entity.

    Attributes:
        id: UUID primary key.
        created_at: Row creation time (UTC, naive).
        updated_at: Last update time (UTC, naive).
        deleted_at: Soft-delete timestamp; null means active.
        deleted_by: User who soft-deleted the row, if any.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=utc_now_naive, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now_naive, nullable=False)
    deleted_at: datetime | None = Field(default=None, nullable=True)
    deleted_by: UUID | None = Field(default=None, nullable=True)

    def touch(self) -> None:
        """Bump ``updated_at`` to now (call before commit on updates)."""
        self.updated_at = utc_now_naive()

    def soft_delete(self, *, by_user_id: UUID | None = None) -> None:
        """Mark row as soft-deleted without removing it."""
        self.deleted_at = utc_now_naive()
        self.deleted_by = by_user_id
        self.touch()

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
