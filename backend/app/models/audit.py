"""Audit event model for tenant staff actions."""
from __future__ import annotations

from typing import Any, Dict, Optional
from uuid import UUID

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlmodel import Field

from app.models.base import BaseMixin, EffectiveJSON


class AuditEvent(BaseMixin, table=True):
    """Immutable-ish log of who did what when (plus outcome and safe metadata)."""

    __tablename__ = "audit_events"

    actor_staff_id: Optional[UUID] = Field(
        default=None,
        index=True,
        sa_type=PG_UUID(as_uuid=True),
    )
    actor_email: Optional[str] = Field(default=None, max_length=255, index=True)
    actor_role: Optional[str] = Field(default=None, max_length=32, index=True)

    action: str = Field(max_length=128, index=True)
    resource_type: Optional[str] = Field(default=None, max_length=64, index=True)
    resource_id: Optional[str] = Field(default=None, max_length=64, index=True)

    organization_id: Optional[UUID] = Field(
        default=None,
        index=True,
        sa_type=PG_UUID(as_uuid=True),
    )
    business_id: Optional[UUID] = Field(
        default=None,
        index=True,
        sa_type=PG_UUID(as_uuid=True),
    )

    outcome: str = Field(default="success", max_length=32, index=True)
    meta: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(EffectiveJSON, nullable=False),
    )
    request_id: Optional[str] = Field(default=None, max_length=64, index=True)
