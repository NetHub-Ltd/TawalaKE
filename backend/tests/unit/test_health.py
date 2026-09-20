"""Health endpoint tests for Core."""

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
async def test_ready_reflects_database_config(client):
    response = await client.get("/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["service"] == "tawala-core"
    assert "database" in body
    assert "database_ok" in body


def test_settings_requires_url_in_test_env(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    from app.core_platform.shared.settings import Settings, clear_settings_cache

    clear_settings_cache()
    s = Settings()
    assert s.database_url is None
    assert s.app_name == "tawala-core"
