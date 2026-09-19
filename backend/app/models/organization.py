"""Organization models: Business, Branch, Location (SPEC D.2 / M5)."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel


class BusinessStatus(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CLOSED = "closed"


class BranchStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class LocationKind(StrEnum):
    SHOP = "shop"
    WAREHOUSE = "warehouse"
    STOREROOM = "storeroom"
    OFFICE = "office"
    OTHER = "other"


class LocationStatus(StrEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class Business(SQLModel, table=True):
    __tablename__ = "businesses"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=255)
    slug: str | None = Field(default=None, max_length=64, unique=True, index=True)
    status: BusinessStatus = Field(default=BusinessStatus.ACTIVE)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Branch(SQLModel, table=True):
    __tablename__ = "branches"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    business_id: UUID = Field(foreign_key="businesses.id", index=True)
    name: str = Field(max_length=255)
    code: str | None = Field(default=None, max_length=64)
    status: BranchStatus = Field(default=BranchStatus.ACTIVE)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Location(SQLModel, table=True):
    __tablename__ = "locations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    business_id: UUID = Field(foreign_key="businesses.id", index=True)
    branch_id: UUID = Field(foreign_key="branches.id", index=True)
    name: str = Field(max_length=255)
    kind: LocationKind = Field(default=LocationKind.OTHER)
    status: LocationStatus = Field(default=LocationStatus.ACTIVE)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
