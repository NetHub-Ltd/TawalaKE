"""Tests for platform org hard-delete friction and flag (issue #297)."""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.core.config import settings
from app.core.platform_rbac import PlatformPermission, has_all_permissions
from app.models.models import PlatformRole
from app.schemas.platform import PlatformOrgHardDeleteRequest


def _platform_user(role: PlatformRole = PlatformRole.SUPER_ADMIN):
    return SimpleNamespace(
        id=uuid4(),
        email="ops@nethub.co.ke",
        full_name="Ops",
        role=role,
        active=True,
        deleted_at=None,
    )


def test_super_admin_has_orgs_write():
    user = _platform_user(PlatformRole.SUPER_ADMIN)
    assert has_all_permissions(user, [PlatformPermission.ORGS_WRITE])


def test_support_lacks_orgs_write():
    user = _platform_user(PlatformRole.SUPPORT)
    assert not has_all_permissions(user, [PlatformPermission.ORGS_WRITE])


def test_hard_delete_request_requires_fields():
    with pytest.raises(Exception):
        PlatformOrgHardDeleteRequest(confirm_name="", confirm_phrase="DELETE", reason="x")
    body = PlatformOrgHardDeleteRequest(
        confirm_name="Test Org",
        confirm_phrase="DELETE",
        reason="test cleanup",
    )
    assert body.confirm_phrase == "DELETE"


def test_flag_default_off():
    """Hard delete must ship disabled so prod is safe until cleanup window."""
    assert settings.platform_org_hard_delete is False


@pytest.mark.asyncio
async def test_hard_delete_organization_not_found():
    from app.services.platform_org_delete import hard_delete_organization

    db = AsyncMock()
    # scalar_one_or_none path via execute result
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=result)

    with pytest.raises(LookupError, match="organization_not_found"):
        await hard_delete_organization(db, org_id=uuid4())


@pytest.mark.asyncio
async def test_hard_delete_organization_success_path():
    from app.services import platform_org_delete as mod

    org_id = uuid4()
    org = SimpleNamespace(id=org_id, name="Shell Co", email="shell@test.com")

    db = AsyncMock()
    org_result = MagicMock()
    org_result.scalar_one_or_none.return_value = org
    db.execute = AsyncMock(return_value=org_result)
    db.begin_nested = MagicMock(return_value=AsyncMock(
        __aenter__=AsyncMock(),
        __aexit__=AsyncMock(return_value=None),
    ))
    db.commit = AsyncMock()

    with patch.object(mod, "collect_org_delete_stats", new_callable=AsyncMock) as stats:
        stats.return_value = {
            "sales": 0,
            "staff": 1,
            "businesses": 1,
            "subscriptions": 0,
        }
        with patch.object(mod, "_delete_org_scoped", new_callable=AsyncMock) as dele:
            dele.return_value = 0
            out = await mod.hard_delete_organization(db, org_id=org_id)

    assert out["organization_id"] == str(org_id)
    assert out["name"] == "Shell Co"
    assert out["pre_delete_counts"]["staff"] == 1
    db.commit.assert_awaited()
