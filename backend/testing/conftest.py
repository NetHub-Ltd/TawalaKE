"""Pytest configuration and shared fixtures for Tawala backend tests."""
import os
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlmodel.ext.asyncio.session import AsyncSession

# Force test environment before any app imports
for k, v in {
    "APP_NAME": "TawalaTest",
    "APP_VERSION": "0.0.1",
    "ENVIRONMENT": "development",
    "DATABASE_NAME": "test_db",
    "DATABASE_USER": "test_user",
    "DATABASE_HOST": "localhost",
    "DATABASE_PORT": "5432",
    "DATABASE_PASSWORD": "test_pass",
    "SECRET_KEY": "test-secret-key-32-chars-long!!",
    "ISSUER": "test",
    "AUDIENCE": "test",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "30",
    "REFRESH_TOKEN_EXPIRE_DAYS": "7",
    "PIN_TOKEN_EXPIRE_HOURS": "8",
    "ADMIN_NAME": "Test Admin",
    "ADMIN_EMAIL": "admin@test.com",
    "ADMIN_PASSWORD": "testpass123",
    "RESOURCE_SERVER": "http://localhost:8000",
    "ALLOWED_ORIGINS": "http://localhost:3000",
    "RESEND_API_KEY": "test_key",
    "REDIS_URL": "memory://",
    "FRONTEND_URL": "http://localhost:3000",
}.items():
    os.environ.setdefault(k, v)

# Patch lifespan BEFORE importing create_application
import app.main as main_module


async def mock_lifespan(app):
    yield


main_module.lifespan = mock_lifespan

# Make rate limiter a no-op so tests don't need Redis
import app.core.redis_client as redis_client_mod


def _noop_limit(*args, **kwargs):
    def decorator(func):
        return func

    return decorator



redis_client_mod.limiter.limit = _noop_limit

# Prevent any real Redis socket usage
_mock_redis_global = AsyncMock()
_mock_redis_global.get = AsyncMock(return_value=None)
_mock_redis_global.set = AsyncMock(return_value=True)
_mock_redis_global.delete = AsyncMock(return_value=1)
_mock_redis_global.ping = AsyncMock(return_value=True)
async def _empty_scan(*a, **k):
    if False:
        yield None
_mock_redis_global.scan_iter = _empty_scan
redis_client_mod.redis_manager.get_async_client = lambda *a, **k: _mock_redis_global
redis_client_mod.redis_manager.close = AsyncMock()


# Make fastapi_cache decorator a no-op
try:
    import fastapi_cache.decorator as cache_decorator

    def _noop_cache(*args, **kwargs):
        def decorator(func):
            return func

        return decorator

    cache_decorator.cache = _noop_cache
except Exception:
    pass

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
    app = create_application()
    app.dependency_overrides[get_session] = lambda: mock_session
    app.dependency_overrides[get_redis] = lambda: mock_redis
    yield app
    app.dependency_overrides.clear()


def _build_staff(role: StaffRole, email: str, full_name: str) -> MagicMock:
    org_id = uuid4()
    business_id = uuid4()
    staff = MagicMock(spec=Staff)
    staff.id = uuid4()
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
    staff.phone = None
    return staff


@pytest.fixture
def mock_staff_user():
    return _build_staff(StaffRole.OWNER, "test@nethub.co.ke", "Test User")


@pytest.fixture
def mock_cashier_user():
    return _build_staff(StaffRole.CASHIER, "cashier@nethub.co.ke", "Test Cashier")


@pytest.fixture
def mock_manager_user():
    return _build_staff(StaffRole.MANAGER, "manager@nethub.co.ke", "Test Manager")


def _authed_client(app, user):
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_current_staff] = lambda: user
    with TestClient(app, raise_server_exceptions=False) as client:
        yield client
    for dep in (get_current_user, get_current_staff):
        app.dependency_overrides.pop(dep, None)


@pytest.fixture
def client_as_owner(app_instance, mock_staff_user):
    yield from _authed_client(app_instance, mock_staff_user)


@pytest.fixture
def client_as_cashier(app_instance, mock_cashier_user):
    yield from _authed_client(app_instance, mock_cashier_user)


@pytest.fixture
def client_as_manager(app_instance, mock_manager_user):
    yield from _authed_client(app_instance, mock_manager_user)


@pytest.fixture
def client_unauthenticated(app_instance):
    with TestClient(app_instance, raise_server_exceptions=False) as client:
        yield client


@pytest.fixture
def client_as_admin(mock_staff_user, mock_session, mock_redis):
    original = settings.admin_route
    settings.admin_route = True
    app = create_application()
    app.dependency_overrides[get_session] = lambda: mock_session
    app.dependency_overrides[get_redis] = lambda: mock_redis
    app.dependency_overrides[get_current_user] = lambda: mock_staff_user
    app.dependency_overrides[get_current_staff] = lambda: mock_staff_user
    with TestClient(app, raise_server_exceptions=False) as client:
        yield client
    settings.admin_route = original
    app.dependency_overrides.clear()


@pytest.fixture
def sample_org_id():
    return uuid4()


@pytest.fixture
def sample_business_id():
    return uuid4()


@pytest.fixture
def sample_product_id():
    return uuid4()


@pytest.fixture
def sample_staff_id():
    return uuid4()
