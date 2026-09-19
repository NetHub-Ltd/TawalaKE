"""Core SQLModel tables — import all models for Alembic metadata."""

from app.models.audit import AuditRecord
from app.models.base import BaseMixin
from app.models.catalog import Category, Product, Service
from app.models.configuration import BusinessConfig
from app.models.events import DomainEvent, OutboxEntry
from app.models.identity import Credential, Session, User
from app.models.organization import Branch, Business, Location
from app.models.parties import Party, PartyBusinessLink
from app.models.security import (
    Membership,
    MembershipRole,
    Permission,
    Role,
    RolePermission,
    ScopeAssignment,
)

__all__ = [
    "BaseMixin",
    "User",
    "Credential",
    "Session",
    "Business",
    "Branch",
    "Location",
    "Membership",
    "Permission",
    "Role",
    "RolePermission",
    "MembershipRole",
    "ScopeAssignment",
    "Party",
    "PartyBusinessLink",
    "Category",
    "Product",
    "Service",
    "DomainEvent",
    "OutboxEntry",
    "AuditRecord",
    "BusinessConfig",
]
