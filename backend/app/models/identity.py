"""Identity models: User, Credential, Session (SPEC D.1 / M4)."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import Column, Text, UniqueConstraint
from sqlmodel import Field, SQLModel


class UserStatus(StrEnum):
    ACTIVE = "active"
    DISABLED = "disabled"
    PENDING = "pending"


class CredentialType(StrEnum):
    PASSWORD = "password"


class User(SQLModel, table=True):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
        UniqueConstraint("phone", name="uq_users_phone"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str | None = Field(default=None, max_length=320, index=True)
    phone: str | None = Field(default=None, max_length=32, index=True)
    display_name: str | None = Field(default=None, max_length=255)
    status: UserStatus = Field(default=UserStatus.ACTIVE)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Credential(SQLModel, table=True):
    __tablename__ = "credentials"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    type: CredentialType = Field(default=CredentialType.PASSWORD)
    secret_hash: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    rotated_at: datetime | None = Field(default=None)


class Session(SQLModel, table=True):
    __tablename__ = "sessions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    token_hash: str = Field(sa_column=Column(Text, nullable=False, unique=True))
    expires_at: datetime = Field(nullable=False)
    revoked_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_agent: str | None = Field(default=None, max_length=512)
    ip: str | None = Field(default=None, max_length=64)
