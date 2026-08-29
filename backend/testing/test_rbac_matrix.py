"""Unit tests for tenant RBAC permission matrix."""
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.core.rbac import (
    Permission,
    ROLE_PERMISSIONS,
    effective_role,
    has_permission,
    permissions_for,
    is_org_wide_role,
)
from app.models.models import StaffRole


def _staff(role: StaffRole):
    return SimpleNamespace(
        id=uuid4(),
        email="t@example.com",
        role=role,
        organization_id=uuid4(),
        active=True,
    )


@pytest.mark.parametrize(
    "role,perm,expected",
    [
        (StaffRole.CASHIER, Permission.SALES_WRITE, True),
        (StaffRole.CASHIER, Permission.ORG_BILLING, False),
        (StaffRole.CASHIER, Permission.CATALOG_READ, True),
        (StaffRole.CASHIER, Permission.CATALOG_WRITE, False),
        (StaffRole.CASHIER, Permission.SALES_READ_BUSINESS, False),
        (StaffRole.CASHIER, Permission.SALES_READ_OWN, True),
        (StaffRole.MANAGER, Permission.SALES_READ_BUSINESS, True),
        (StaffRole.MANAGER, Permission.ORG_BILLING, False),
        (StaffRole.MANAGER, Permission.STOCK_ADJUST, True),
        (StaffRole.ADMIN, Permission.ORG_WRITE, True),
        (StaffRole.ADMIN, Permission.ORG_BILLING, False),
        (StaffRole.ADMIN, Permission.ORG_STAFF_MANAGE, True),
        (StaffRole.OWNER, Permission.ORG_BILLING, True),
        (StaffRole.OWNER, Permission.SALES_WRITE, True),
    ],
)
def test_matrix(role, perm, expected):
    staff = _staff(role)
    assert has_permission(staff, perm) is expected


def test_owner_has_all():
    staff = _staff(StaffRole.OWNER)
    assert permissions_for(staff) == frozenset(Permission)


def test_admin_is_org_wide():
    assert is_org_wide_role(_staff(StaffRole.ADMIN)) is True
    assert is_org_wide_role(_staff(StaffRole.CASHIER)) is False


def test_effective_role_string():
    staff = SimpleNamespace(role="cashier")
    assert effective_role(staff) == StaffRole.CASHIER


def test_unknown_role_no_perms():
    staff = SimpleNamespace(role="NOPE")
    assert permissions_for(staff) == frozenset()
