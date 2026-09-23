"""Unit tests for platform RBAC matrix and helpers."""
from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.core.platform_rbac import (
    PlatformPermission,
    has_all_permissions,
    has_any_permission,
    permissions_for,
    effective_platform_role,
)
from app.models.models import PlatformRole


def _user(role: PlatformRole, active: bool = True):
    return SimpleNamespace(
        id=uuid4(),
        email="ops@example.com",
        role=role,
        active=active,
    )


def test_super_admin_has_all_permissions():
    user = _user(PlatformRole.SUPER_ADMIN)
    perms = permissions_for(user)
    assert PlatformPermission.USERS_WRITE in perms
    assert PlatformPermission.SYSTEM_CONFIG in perms
    assert PlatformPermission.ORGS_IMPERSONATE in perms
    assert has_all_permissions(user, list(PlatformPermission))


def test_auditor_is_read_only():
    user = _user(PlatformRole.AUDITOR)
    perms = permissions_for(user)
    assert PlatformPermission.AUDIT_READ in perms
    assert PlatformPermission.ORGS_READ in perms
    assert PlatformPermission.USERS_WRITE not in perms
    assert PlatformPermission.BILLING_WRITE not in perms
    assert PlatformPermission.ORGS_IMPERSONATE not in perms
    assert not has_all_permissions(user, [PlatformPermission.USERS_WRITE])


def test_billing_can_write_plans_not_users():
    user = _user(PlatformRole.BILLING)
    assert has_all_permissions(
        user, [PlatformPermission.PLANS_WRITE, PlatformPermission.BILLING_WRITE]
    )
    assert not has_all_permissions(user, [PlatformPermission.USERS_WRITE])


def test_support_has_impersonate_reserved():
    user = _user(PlatformRole.SUPPORT)
    assert has_any_permission(user, [PlatformPermission.ORGS_IMPERSONATE])
    assert not has_all_permissions(user, [PlatformPermission.USERS_WRITE])


def test_unknown_role_empty_permissions():
    user = SimpleNamespace(id=uuid4(), role="NOT_A_ROLE", active=True)
    assert effective_platform_role(user) is None
    assert permissions_for(user) == frozenset()


def test_effective_role_from_string():
    user = SimpleNamespace(role="support")
    # Enum construction uppercases via PlatformRole(str)
    # our helper uppercases
    user.role = "SUPPORT"
    assert effective_platform_role(user) == PlatformRole.SUPPORT
