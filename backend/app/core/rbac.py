"""Tenant staff RBAC: role → fine-grained permissions + org/staff overrides.

Source of truth for *ceiling and default* is Staff.role → ROLE_PERMISSIONS.
Organization and staff overrides may only DENY or (staff) GRANT within that ceiling.
OWNER is immune to overrides.
"""
from __future__ import annotations

from enum import Enum
from typing import Iterable, Optional
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


class OverrideEffect(str, Enum):
    DENY = "DENY"
    GRANT = "GRANT"


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


# Owner-facing catalog: plain language + resources affected.
PERMISSION_CATALOG: list[dict] = [
    {
        "code": Permission.ORG_READ.value,
        "group": "Organization",
        "label": "View organization",
        "description": "See organization home, branches list, and basic org profile. Does not allow changing settings.",
        "resources": ["Organization home", "Branch list", "Org profile (read)"],
    },
    {
        "code": Permission.ORG_WRITE.value,
        "group": "Organization",
        "label": "Edit organization",
        "description": "Change organization name, contact details, and settings that affect the whole business.",
        "resources": ["Org settings", "Branch create/edit"],
    },
    {
        "code": Permission.ORG_BILLING.value,
        "group": "Organization",
        "label": "Billing & subscription",
        "description": "View plans, manage subscription, and billing details. Typically Owner only.",
        "resources": ["Billing page", "Plan changes", "Invoices"],
    },
    {
        "code": Permission.ORG_STAFF_MANAGE.value,
        "group": "Team",
        "label": "Manage team",
        "description": "Invite staff, change roles, assign branches, reset passwords, and deactivate members.",
        "resources": ["Team directory", "Staff workspace", "Invites"],
    },
    {
        "code": Permission.CATALOG_READ.value,
        "group": "Catalog",
        "label": "View products",
        "description": "Browse the product catalog and product details.",
        "resources": ["Product list", "Product detail"],
    },
    {
        "code": Permission.CATALOG_WRITE.value,
        "group": "Catalog",
        "label": "Edit products",
        "description": "Create and update products, prices, and catalog settings.",
        "resources": ["Product create/edit", "Pricing"],
    },
    {
        "code": Permission.STOCK_READ.value,
        "group": "Inventory",
        "label": "View stock",
        "description": "See on-hand quantities and stock history.",
        "resources": ["Stock levels", "Stock history"],
    },
    {
        "code": Permission.STOCK_ADJUST.value,
        "group": "Inventory",
        "label": "Adjust stock",
        "description": "Receive stock, write off, and change quantities. High impact on inventory accuracy.",
        "resources": ["Stock adjustments", "Receiving"],
    },
    {
        "code": Permission.SALES_WRITE.value,
        "group": "Sales",
        "label": "Make sales",
        "description": "Use the terminal to ring up sales and process checkouts.",
        "resources": ["POS terminal", "Checkout"],
    },
    {
        "code": Permission.SALES_READ_OWN.value,
        "group": "Sales",
        "label": "View own sales",
        "description": "See sales history for transactions this person made.",
        "resources": ["Own sale history"],
    },
    {
        "code": Permission.SALES_READ_BUSINESS.value,
        "group": "Sales",
        "label": "View branch sales",
        "description": "See sales for the whole branch or business, not only own transactions.",
        "resources": ["Branch sale history", "Business sales lists"],
    },
    {
        "code": Permission.REPORTS_READ.value,
        "group": "Reports",
        "label": "View reports",
        "description": "Open dashboards and reports (sales, expenses, overview).",
        "resources": ["Overview reports", "Expense reports", "Analytics"],
    },
]


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


def role_permission_set(role: StaffRole | None) -> frozenset[Permission]:
    if role is None:
        return frozenset()
    return ROLE_PERMISSIONS.get(role, frozenset())


def permissions_for(
    staff: Staff,
    *,
    org_denies: Optional[Iterable[str]] = None,
    staff_effects: Optional[dict[str, str]] = None,
) -> frozenset[Permission]:
    """
    Effective permissions for a staff member.

    Role is hard ceiling and default. Overrides only revoke or restore within role.
    OWNER ignores overrides.
    """
    role = effective_role(staff)
    ceiling = role_permission_set(role)
    if not ceiling:
        return frozenset()

    if role == StaffRole.OWNER:
        return ceiling

    org_deny = {str(x) for x in (org_denies or [])}
    staff_map = {str(k): str(v).upper() for k, v in (staff_effects or {}).items()}

    effective: set[Permission] = set()
    for perm in ceiling:
        code = perm.value
        # Org deny wins
        if code in org_deny:
            # Staff GRANT can restore within role after org deny
            if staff_map.get(code) == OverrideEffect.GRANT.value:
                effective.add(perm)
            continue
        # Staff deny
        if staff_map.get(code) == OverrideEffect.DENY.value:
            continue
        # Staff grant (redundant if already in ceiling, but keeps restore path clear)
        if staff_map.get(code) == OverrideEffect.GRANT.value:
            effective.add(perm)
            continue
        # Role default
        effective.add(perm)
    return frozenset(effective)


def has_permission(
    staff: Staff,
    permission: Permission | str,
    *,
    org_denies: Optional[Iterable[str]] = None,
    staff_effects: Optional[dict[str, str]] = None,
) -> bool:
    perm = (
        permission
        if isinstance(permission, Permission)
        else Permission(str(permission))
    )
    return perm in permissions_for(
        staff, org_denies=org_denies, staff_effects=staff_effects
    )


def has_all_permissions(
    staff: Staff,
    required: Iterable[Permission | str],
    *,
    org_denies: Optional[Iterable[str]] = None,
    staff_effects: Optional[dict[str, str]] = None,
) -> bool:
    return all(
        has_permission(
            staff, p, org_denies=org_denies, staff_effects=staff_effects
        )
        for p in required
    )


def is_org_wide_role(staff: Staff) -> bool:
    """OWNER and ADMIN may access all businesses in their organization."""
    return effective_role(staff) in (StaffRole.OWNER, StaffRole.ADMIN)


def default_roles_for_permission(code: str) -> list[str]:
    out: list[str] = []
    for role, perms in ROLE_PERMISSIONS.items():
        if any(p.value == code for p in perms):
            out.append(role.value)
    return out


def catalog_with_roles() -> list[dict]:
    rows = []
    for item in PERMISSION_CATALOG:
        rows.append(
            {
                **item,
                "default_roles": default_roles_for_permission(item["code"]),
            }
        )
    return rows


RBAC_PERMS_KEY = "rbac:staff:{staff_id}:perms"
RBAC_BIZ_KEY = "rbac:staff:{staff_id}:businesses"
RBAC_ORG_DENY_KEY = "rbac:org:{org_id}:denies"


def perms_cache_key(staff_id: UUID) -> str:
    return RBAC_PERMS_KEY.format(staff_id=staff_id)


def businesses_cache_key(staff_id: UUID) -> str:
    return RBAC_BIZ_KEY.format(staff_id=staff_id)


def org_deny_cache_key(org_id: UUID) -> str:
    return RBAC_ORG_DENY_KEY.format(org_id=org_id)
