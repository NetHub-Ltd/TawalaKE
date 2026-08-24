"""Pytest configuration and shared fixtures for Tawala backend tests."""
import os
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel.ext.asyncio.session import AsyncSession

# Force test environment before any app imports
os.environ.setdefault("APP_NAME", "TawalaTest")
os.environ.setdefault("APP_VERSION", "0.0.1")
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("DATABASE_NAME", "test_db")
os.environ.setdefault("DATABASE_USER", "test_user")
os.environ.setdefault("DATABASE_HOST", "localhost")
os.environ.setdefault("DATABASE_PORT", "5432")
os.environ.setdefault("DATABASE_PASSWORD", "test_pass")
os.environ.setdefault("SECRET_KEY", "test-secret-key-32-chars-long!!")
os.environ.setdefault("ISSUER", "test")
os.environ.setdefault("AUDIENCE", "test")
os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("REFRESH_TOKEN_EXPIRE_DAYS", "7")
os.environ.setdefault("PIN_TOKEN_EXPIRE_HOURS", "8")
os.environ.setdefault("ADMIN_NAME", "Test Admin")
os.environ.setdefault("ADMIN_EMAIL", "admin@test.com")
os.environ.setdefault("ADMIN_PASSWORD", "testpass123")
os.environ.setdefault("RESOURCE_SERVER", "http://localhost:8000")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")
os.environ.setdefault("RESEND_API_KEY", "test_key")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

# Patch lifespan BEFORE importing create_application (avoids real DB/Redis startup)
import app.main as main_module


async def mock_lifespan(app):
    """Bypass DB check, admin creation, and Redis init for unit tests."""
    yield


main_module.lifespan = mock_lifespan

from app.core.config import settings, Environment

settings.environment = Environment.DEVELOPMENT

from app.main import create_application
from app.api.deps import get_current_user, get_current_staff, get_session, get_redis
from app.models.models import Staff, StaffRole


def _make_mock_redis():
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock(return_value=True)
    redis.delete = AsyncMock(return_value=1)
    redis.scan_iter = AsyncMock(return_value=AsyncMock())
    # async for support on scan_iter
    async def _empty_scan(*args, **kwargs):
        if False:
            yield None

    redis.scan_iter = _empty_scan
    return redis


def _make_mock_session():
    session = AsyncMock(spec=AsyncSession)
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.delete = AsyncMock()
    session.exec = AsyncMock()
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=None)
    return session


@pytest.fixture(scope="function")
def mock_session():
    return _make_mock_session()


@pytest.fixture(scope="function")
def mock_redis():
    return _make_mock_redis()


@pytest.fixture(scope="function")
def app_instance(mock_session, mock_redis):
    """App with lifespan mocked and core deps overridable."""
    app = create_application()
    # Default dependency overrides so route handlers never touch real IO
    app.dependency_overrides[get_session] = lambda: mock_session
    app.dependency_overrides[get_redis] = lambda: mock_redis
    yield app
    app.dependency_overrides.clear()


def _build_staff(role: StaffRole, email: str, full_name: str) -> MagicMock:
    org_id = uuid4()
    business_id = uuid4()
    staff_id = uuid4()
    staff = MagicMock(spec=Staff)
    staff.id = staff_id
    staff.email = email
    staff.full_name = full_name
    staff.role = role
    staff.active = True
    staff.organization_id = org_id
    staff.tenant_id = org_id
    business = MagicMock()
    business.id = business_id
    business.name = "Test Store"
    staff.assigned_businesses = [business]
    staff.hashed_password = "hashed_password"
    staff.pin_hash = None
    staff.pin_salt = None
    staff.created_at = datetime.now(timezone.utc)
    staff.updated_at = datetime.now(timezone.utc)
    staff.deleted_at = None
    return staff


@pytest.fixture(scope="function")
def mock_staff_user():
    return _build_staff(StaffRole.OWNER, "test@nethub.co.ke", "Test User")


@pytest.fixture(scope="function")
def mock_cashier_user():
    return _build_staff(StaffRole.CASHIER, "cashier@nethub.co.ke", "Test Cashier")


@pytest.fixture(scope="function")
def mock_manager_user():
    return _build_staff(StaffRole.MANAGER, "manager@nethub.co.ke", "Test Manager")


def _authed_client(app, user):
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_current_staff] = lambda: user
    with TestClient(app) as client:
        yield client
    # leave session/redis overrides; only clear auth
    for dep in (get_current_user, get_current_staff):
        app.dependency_overrides.pop(dep, None)


@pytest.fixture(scope="function")
def client_as_owner(app_instance, mock_staff_user):
    yield from _authed_client(app_instance, mock_staff_user)


@pytest.fixture(scope="function")
def client_as_cashier(app_instance, mock_cashier_user):
    yield from _authed_client(app_instance, mock_cashier_user)


@pytest.fixture(scope="function")
def client_as_manager(app_instance, mock_manager_user):
    yield from _authed_client(app_instance, mock_manager_user)


@pytest.fixture(scope="function")
def client_unauthenticated(app_instance):
    with TestClient(app_instance) as client:
        yield client


@pytest.fixture(scope="function")
def client_as_admin(app_instance, mock_staff_user):
    original = settings.admin_route
    settings.admin_route = True
    # Rebuild app so management router is included
    app = create_application()
    app.dependency_overrides[get_session] = app_instance.dependency_overrides.get(
        get_session, lambda: _make_mock_session()
    )
    app.dependency_overrides[get_redis] = app_instance.dependency_overrides.get(
        get_redis, lambda: _make_mock_redis()
    )
    app.dependency_overrides[get_current_user] = lambda: mock_staff_user
    app.dependency_overrides[get_current_staff] = lambda: mock_staff_user
    with TestClient(app) as client:
        yield client
    settings.admin_route = original
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def sample_org_id():
    return uuid4()


@pytest.fixture(scope="function")
def sample_business_id():
    return uuid4()


@pytest.fixture(scope="function")
def sample_product_id():
    return uuid4()


@pytest.fixture(scope="function")
def sample_staff_id():
    return uuid4()
