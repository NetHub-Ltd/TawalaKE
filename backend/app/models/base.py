"""Shared SQLModel base with audit / soft-delete metadata.

All Core tables extend :class:`BaseMixin` so identity, tenancy, and domain
models share the same primary key and lifecycle columns.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


def _utcnow() -> datetime:
    return datetime.now(UTC)


class BaseMixin(SQLModel):
    """Default metadata fields for every Core entity.

    Attributes:
        id: UUID primary key.
        created_at: Row creation time (UTC).
        updated_at: Last update time (UTC).
        deleted_at: Soft-delete timestamp; null means active.
        deleted_by: User who soft-deleted the row, if any.
    """

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=_utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=_utcnow, nullable=False)
    deleted_at: datetime | None = Field(default=None, nullable=True)
    deleted_by: UUID | None = Field(default=None, nullable=True)

    def touch(self) -> None:
        """Bump ``updated_at`` to now (call before commit on updates)."""
        self.updated_at = _utcnow()

    def soft_delete(self, *, by_user_id: UUID | None = None) -> None:
        """Mark row as soft-deleted without removing it."""
        self.deleted_at = _utcnow()
        self.deleted_by = by_user_id
        self.touch()

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None
