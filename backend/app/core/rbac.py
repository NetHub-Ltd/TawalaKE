"""Tenant staff RBAC: role → fine-grained permissions.

Source of truth for authorization is Staff.role.
Business scope uses staff_business_assignments (not assignment.role).
"""
from __future__ import annotations

from enum import Enum
from typing import Iterable
from uuid import UUID

from app.models.models import Staff, StaffRole


class Permission(str, Enum):
    ORG_READ = "org:read"
    ORG_WRITE = "org:write"
    ORG_BILLING = "org:billing"
    ORG_STAFF_MANAGE = "org:staff:manage"
    CATALOG_READ = "catalog:read"
    CATALOG_WRITE = "catalog:write"
    STOCK_READ = "stock:read"
    STOCK_ADJUST = "stock:adjust"
    SALES_WRITE = "sales:write"
    SALES_READ_OWN = "sales:read:own"
    SALES_READ_BUSINESS = "sales:read:business"
    REPORTS_READ = "reports:read"


# Codify current operational access + ADMIN as org operator without billing.
ROLE_PERMISSIONS: dict[StaffRole, frozenset[Permission]] = {
    StaffRole.OWNER: frozenset(Permission),
    StaffRole.ADMIN: frozenset(
        {
            Permission.ORG_READ,
            Permission.ORG_WRITE,
            Permission.ORG_STAFF_MANAGE,
            Permission.CATALOG_READ,
            Permission.CATALOG_WRITE,
            Permission.STOCK_READ,
            Permission.STOCK_ADJUST,
            Permission.SALES_WRITE,
            Permission.SALES_READ_OWN,
            Permission.SALES_READ_BUSINESS,
            Permission.REPORTS_READ,
        }
    ),
    StaffRole.MANAGER: frozenset(
        {
            Permission.ORG_READ,
            Permission.CATALOG_READ,
            Permission.CATALOG_WRITE,
            Permission.STOCK_READ,
            Permission.STOCK_ADJUST,
            Permission.SALES_WRITE,
            Permission.SALES_READ_OWN,
            Permission.SALES_READ_BUSINESS,
            Permission.REPORTS_READ,
        }
    ),
    StaffRole.CASHIER: frozenset(
        {
            Permission.ORG_READ,
            Permission.CATALOG_READ,
            Permission.STOCK_READ,
            Permission.SALES_WRITE,
            Permission.SALES_READ_OWN,
        }
    ),
}


def effective_role(staff: Staff) -> StaffRole | None:
    """Resolve Staff.role to a known enum member."""
    role = getattr(staff, "role", None)
    if role is None:
        return None
    if isinstance(role, StaffRole):
        return role
    try:
        return StaffRole(str(role).upper())
    except ValueError:
        return None


def permissions_for(staff: Staff) -> frozenset[Permission]:
    role = effective_role(staff)
    if role is None:
        return frozenset()
    return ROLE_PERMISSIONS.get(role, frozenset())


def has_permission(staff: Staff, permission: Permission | str) -> bool:
    perm = (
        permission
        if isinstance(permission, Permission)
        else Permission(str(permission))
    )
    return perm in permissions_for(staff)


def has_all_permissions(staff: Staff, required: Iterable[Permission | str]) -> bool:
    return all(has_permission(staff, p) for p in required)


def is_org_wide_role(staff: Staff) -> bool:
    """OWNER and ADMIN may access all businesses in their organization."""
    return effective_role(staff) in (StaffRole.OWNER, StaffRole.ADMIN)


RBAC_PERMS_KEY = "rbac:staff:{staff_id}:perms"
RBAC_BIZ_KEY = "rbac:staff:{staff_id}:businesses"


def perms_cache_key(staff_id: UUID) -> str:
    return RBAC_PERMS_KEY.format(staff_id=staff_id)


def businesses_cache_key(staff_id: UUID) -> str:
    return RBAC_BIZ_KEY.format(staff_id=staff_id)
