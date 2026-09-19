"""Health endpoint tests for Core (M1/M3)."""

from __future__ import annotations

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_ok(client):
    response = await client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "tawala-core"


@pytest.mark.asyncio
async def test_ready_without_database(client):
    response = await client.get("/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["service"] == "tawala-core"
    assert body["database"] == "not_configured"
    assert body["database_ok"] is False


def test_settings_default_no_url():
    from app.core_platform.shared.settings import Settings

    s = Settings()
    assert s.database_url is None
    assert s.app_name == "tawala-core"
