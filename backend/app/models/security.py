"""Minimal membership for org isolation (full RBAC in M6).

SPEC: no business data access without active membership.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel


class MembershipStatus(StrEnum):
    INVITED = "invited"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"


class Membership(SQLModel, table=True):
    __tablename__ = "memberships"
    __table_args__ = (
        UniqueConstraint(
            "business_id", "user_id", name="uq_membership_business_user"
        ),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    business_id: UUID = Field(foreign_key="businesses.id", index=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    status: MembershipStatus = Field(default=MembershipStatus.ACTIVE)
    invited_at: datetime | None = Field(default=None)
    activated_at: datetime | None = Field(default_factory=datetime.utcnow)
    revoked_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
