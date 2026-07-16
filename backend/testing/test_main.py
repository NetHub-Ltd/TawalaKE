# testing/test_main.py
import pytest
from fastapi.testclient import TestClient
from app.core.config import settings, Environment

def test_application_successful_lifespan_and_health(app_instance, mock_redis_manager):
    """Verifies standard initialization lifecycles and health metrics state."""
    with TestClient(app_instance) as client:
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["environment"] == "Development"
        
        mock_redis_manager["get_async_client"].assert_called_once()

    mock_redis_manager["close"].assert_called_once()

def test_application_startup_aborts_on_database_failure(mock_redis_manager):
    """Ensures application safely faults out if core persistence checks fail."""
    from app.main import create_application
    from unittest.mock import patch

    with patch("app.main.AsyncSession") as mock_session_cls:
        mock_session_cls.return_value.__aenter__.side_effect = Exception("Database Authentication Timed Out")
        
        app = create_application()
        
        with pytest.raises(RuntimeError) as exc_info:
            with TestClient(app):
                pass
        assert "Database unavailable. Aborting startup." in str(exc_info.value)

def test_documentation_endpoints_stripped_in_production(mock_db_engine, mock_redis_manager, monkeypatch):
    """Guarantees that when deployed in production, docs endpoints are stripped cleanly."""
    from app.main import create_application
    
    # Safely swap the environment enum out via monkeypatch
    monkeypatch.setattr(settings, "environment", Environment.PRODUCTION)
    
    prod_app = create_application()
    
    with TestClient(prod_app) as client:
        health_res = client.get("/health")
        assert health_res.json()["environment"] == "Production"

        # Assert UI documents return 404 omissions
        assert client.get("/docs").status_code == 404
        assert client.get("/openapi.json").status_code == 404