"""Organization models: Business, Branch, Location (SPEC D.2)."""

from __future__ import annotations

from enum import StrEnum
from uuid import UUID

from sqlmodel import Field

from app.models.base import BaseMixin


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


class Business(BaseMixin, table=True):
    __tablename__ = "businesses"

    name: str = Field(max_length=255)
    slug: str | None = Field(default=None, max_length=64, unique=True, index=True)
    status: BusinessStatus = Field(default=BusinessStatus.ACTIVE)


class Branch(BaseMixin, table=True):
    __tablename__ = "branches"

    business_id: UUID = Field(foreign_key="businesses.id", index=True)
    name: str = Field(max_length=255)
    code: str | None = Field(default=None, max_length=64)
    status: BranchStatus = Field(default=BranchStatus.ACTIVE)


class Location(BaseMixin, table=True):
    __tablename__ = "locations"

    business_id: UUID = Field(foreign_key="businesses.id", index=True)
    branch_id: UUID = Field(foreign_key="branches.id", index=True)
    name: str = Field(max_length=255)
    kind: LocationKind = Field(default=LocationKind.OTHER)
    status: LocationStatus = Field(default=LocationStatus.ACTIVE)
