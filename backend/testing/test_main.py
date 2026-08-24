"""Application lifecycle and health endpoint tests."""
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings, Environment
from app.main import create_application


def test_health_endpoint_returns_healthy(app_instance):
    """Health endpoint responds with healthy status under mocked lifespan."""
    with TestClient(app_instance) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "environment" in data


def test_documentation_endpoints_stripped_in_production(monkeypatch):
    """In production, /docs and /openapi.json must be unavailable."""
    monkeypatch.setattr(settings, "environment", Environment.PRODUCTION)
    prod_app = create_application()
    with TestClient(prod_app) as client:
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json()["environment"] == "Production"
        assert client.get("/docs").status_code == 404
        assert client.get("/openapi.json").status_code == 404
    monkeypatch.setattr(settings, "environment", Environment.DEVELOPMENT)


def test_application_startup_aborts_on_database_failure():
    """If the real lifespan is used and DB fails, startup must abort."""
    import app.main as main_module

    async def failing_lifespan(app):
        raise RuntimeError("Database unavailable. Aborting startup.")
        yield  # pragma: no cover

    original = main_module.lifespan
    main_module.lifespan = failing_lifespan
    try:
        app = create_application()
        with pytest.raises(RuntimeError, match="Database unavailable"):
            with TestClient(app):
                pass
    finally:
        main_module.lifespan = original
