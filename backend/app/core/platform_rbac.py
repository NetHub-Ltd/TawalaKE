"""Platform-level RBAC: PlatformUser.role → fine-grained permissions.

Separate from tenant Staff RBAC (app.core.rbac). Platform actors must never
share JWT subjects or appear in tenant staff lists.
"""
from __future__ import annotations

from enum import Enum
from typing import Iterable

from app.models.models import PlatformRole, PlatformUser


class PlatformPermission(str, Enum):
    """Fine-grained platform permissions (resource:action)."""

    USERS_READ = "platform:users:read"
    USERS_WRITE = "platform:users:write"
    ORGS_READ = "platform:orgs:read"
    ORGS_WRITE = "platform:orgs:write"
    ORGS_IMPERSONATE = "platform:orgs:impersonate"
    PLANS_READ = "platform:plans:read"
    PLANS_WRITE = "platform:plans:write"
    BILLING_READ = "platform:billing:read"
    BILLING_WRITE = "platform:billing:write"
    AUDIT_READ = "platform:audit:read"
    JOBS_RUN = "platform:jobs:run"
    SYSTEM_CONFIG = "platform:system:config"


# Full set for SUPER_ADMIN
_ALL = frozenset(PlatformPermission)

ROLE_PERMISSIONS: dict[PlatformRole, frozenset[PlatformPermission]] = {
    PlatformRole.SUPER_ADMIN: _ALL,
    PlatformRole.SUPPORT: frozenset(
        {
            PlatformPermission.USERS_READ,
            PlatformPermission.ORGS_READ,
            PlatformPermission.ORGS_IMPERSONATE,  # Slice C; permission reserved
            PlatformPermission.PLANS_READ,
            PlatformPermission.BILLING_READ,
            PlatformPermission.AUDIT_READ,
        }
    ),
    PlatformRole.BILLING: frozenset(
        {
            PlatformPermission.ORGS_READ,
            PlatformPermission.PLANS_READ,
            PlatformPermission.PLANS_WRITE,
            PlatformPermission.BILLING_READ,
            PlatformPermission.BILLING_WRITE,
            PlatformPermission.AUDIT_READ,
        }
    ),
    PlatformRole.AUDITOR: frozenset(
        {
            PlatformPermission.USERS_READ,
            PlatformPermission.ORGS_READ,
            PlatformPermission.PLANS_READ,
            PlatformPermission.BILLING_READ,
            PlatformPermission.AUDIT_READ,
        }
    ),
}


def effective_platform_role(user: PlatformUser) -> PlatformRole | None:
    """Resolve PlatformUser.role to a known enum member."""
    role = getattr(user, "role", None)
    if role is None:
        return None
    if isinstance(role, PlatformRole):
        return role
    try:
        return PlatformRole(str(role).upper())
    except ValueError:
        return None


def permissions_for(user: PlatformUser) -> frozenset[PlatformPermission]:
    """Return the permission set for a platform user (empty if unknown/inactive role)."""
    role = effective_platform_role(user)
    if role is None:
        return frozenset()
    return ROLE_PERMISSIONS.get(role, frozenset())


def has_all_permissions(
    user: PlatformUser, required: Iterable[PlatformPermission | str]
) -> bool:
    """True if user holds every required permission."""
    held = permissions_for(user)
    needed = [
        p if isinstance(p, PlatformPermission) else PlatformPermission(str(p))
        for p in required
    ]
    return all(p in held for p in needed)


def has_any_permission(
    user: PlatformUser, required: Iterable[PlatformPermission | str]
) -> bool:
    """True if user holds at least one of the required permissions."""
    held = permissions_for(user)
    needed = [
        p if isinstance(p, PlatformPermission) else PlatformPermission(str(p))
        for p in required
    ]
    return any(p in held for p in needed)
