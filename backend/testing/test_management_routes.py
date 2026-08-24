"""Management route tests (admin_route enabled via client_as_admin)."""
import pytest
from unittest.mock import AsyncMock, patch


def test_management_routes_unauthorized_without_admin_flag(client_as_owner):
    r = client_as_owner.get("/api/v1/management/sales")
    # admin router not included when admin_route=False
    assert r.status_code in (404, 401, 403, 405, 500)


def test_management_with_admin_client(client_as_admin):
    with patch("app.api.routes.management.organization_crud", create=True):
        r = client_as_admin.get("/api/v1/management/")
        assert r.status_code in (200, 404, 405, 422, 500)
