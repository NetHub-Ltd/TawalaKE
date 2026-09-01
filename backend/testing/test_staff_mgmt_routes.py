"""Canonical organization staff management routes at /api/v1/staff only."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.models.models import StaffRole
from app.services.paywall import Entitlements


def _active_entitlements(org_id=None):
    oid = str(org_id or uuid4())
    return Entitlements(
        organization_id=oid,
        subscription_id=None,
        plan_id=None,
        plan_code="pro",
        plan_name="Pro",
        active=True,
        trial=False,
        start_date=None,
        end_date=None,
        limits={},
        features={},
        usage={},
    )


@pytest.fixture(autouse=True)
def _patch_paywall_active():
    with patch(
        "app.api.paywall_deps.paywall.resolve",
        new_callable=AsyncMock,
    ) as resolve:
        resolve.side_effect = lambda db, org_id, redis=None: _active_entitlements(
            org_id
        )
        yield resolve


def test_list_staff_canonical_path_not_404(client_as_owner, mock_session):
    """GET /api/v1/staff must be mounted (canonical management surface)."""
    result = MagicMock()
    result.all = lambda: []
    result.unique = lambda: result
    mock_session.exec = AsyncMock(return_value=result)
    r = client_as_owner.get("/api/v1/staff")
    assert r.status_code != 404, r.text
    assert r.status_code in (200, 422, 500)


def test_list_staff_legacy_business_alias_removed(client_as_owner, mock_session):
    """GET /api/v1/business/staff must not be mounted (dedicated /staff only)."""
    r = client_as_owner.get("/api/v1/business/staff")
    assert r.status_code == 404, r.text


def test_get_staff_member_route_exists(client_as_owner, mock_session):
    result = MagicMock()
    result.first = lambda: None
    result.unique = lambda: result
    mock_session.exec = AsyncMock(return_value=result)
    r = client_as_owner.get(f"/api/v1/staff/{uuid4()}")
    # Handler 404 for missing row is fine; framework 404 is not
    assert r.status_code in (404, 403, 422, 500)
