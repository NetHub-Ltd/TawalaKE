"""Pytest configuration and shared fixtures for Tawala backend tests."""
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4, UUID

from fastapi.testclient import TestClient
from sqlmodel.ext.asyncio.session import AsyncSession

# Force development environment before any app imports
import os
os.environ["APP_NAME"] = "TawalaTest"
os.environ["APP_VERSION"] = "0.0.1"
os.environ["ENVIRONMENT"] = "development"
os.environ["DATABASE_NAME"] = "test_db"
os.environ["DATABASE_USER"] = "test_user"
os.environ["DATABASE_HOST"] = "localhost"
os.environ["DATABASE_PORT"] = "5432"
os.environ["DATABASE_PASSWORD"] = "test_pass"
os.environ["SECRET_KEY"] = "test-secret-key-32-chars-long!!"
os.environ["ISSUER"] = "test"
os.environ["AUDIENCE"] = "test"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
os.environ["REFRESH_TOKEN_EXPIRE_DAYS"] = "7"
os.environ["PIN_TOKEN_EXPIRE_HOURS"] = "8"
os.environ["ADMIN_NAME"] = "Test Admin"
os.environ["ADMIN_EMAIL"] = "admin@test.com"
os.environ["ADMIN_PASSWORD"] = "testpass123"
os.environ["RESOURCE_SERVER"] = "http://localhost:8000"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"
os.environ["RESEND_API_KEY"] = "test_key"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

# CRITICAL: Patch lifespan BEFORE importing create_application
import app.main as main_module

async def mock_lifespan(app):
    """Bypass DB check, admin creation, and Redis init for tests."""
    yield

main_module.lifespan = mock_lifespan

from app.core.config import settings, Environment
settings.environment = Environment.DEVELOPMENT

from app.main import create_application
from app.api.deps import get_current_user, get_current_staff
from app.models.models import Staff, StaffRole, Organization, Business


# ------------------------------------------------------------------
# Mock Application Instance
# ------------------------------------------------------------------
@pytest.fixture(scope="function")
def app_instance():
    """Provides a cleanly initialized application factory instance."""
    yield create_application()


# ------------------------------------------------------------------
# Mock Session Fixture
# ------------------------------------------------------------------
@pytest.fixture(scope="function")
def mock_session():
    """Provides a fully mocked AsyncSession with all required attributes."""
    session = AsyncMock(spec=AsyncSession)
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.delete = AsyncMock()
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=None)
    return session


# ------------------------------------------------------------------
# Mock User / Staff Fixtures
# ------------------------------------------------------------------
@pytest.fixture(scope="function")
def mock_staff_user():
    """Returns a mock Staff user with Owner role and assigned businesses."""
    org_id = uuid4()
    business_id = uuid4()
    staff_id = uuid4()

    staff = MagicMock(spec=Staff)
    staff.id = staff_id
    staff.email = "test@nethub.co.ke"
    staff.full_name = "Test User"
    staff.role = StaffRole.OWNER
    staff.active = True
    staff.organization_id = org_id
    staff.assigned_businesses = [MagicMock(id=business_id, name="Test Store")]
    staff.password_hash = "hashed_password"
    staff.pin_hash = None
    staff.created_at = datetime.now(timezone.utc)
    staff.updated_at = datetime.now(timezone.utc)
    return staff


@pytest.fixture(scope="function")
def mock_cashier_user():
    """Returns a mock Staff user with Cashier role."""
    org_id = uuid4()
    business_id = uuid4()
    staff_id = uuid4()

    staff = MagicMock(spec=Staff)
    staff.id = staff_id
    staff.email = "cashier@nethub.co.ke"
    staff.full_name = "Test Cashier"
    staff.role = StaffRole.CASHIER
    staff.active = True
    staff.organization_id = org_id
    staff.assigned_businesses = [MagicMock(id=business_id, name="Test Store")]
    staff.password_hash = "hashed_password"
    staff.pin_hash = None
    staff.created_at = datetime.now(timezone.utc)
    staff.updated_at = datetime.now(timezone.utc)
    return staff


@pytest.fixture(scope="function")
def mock_manager_user():
    """Returns a mock Staff user with Manager role."""
    org_id = uuid4()
    business_id = uuid4()
    staff_id = uuid4()

    staff = MagicMock(spec=Staff)
    staff.id = staff_id
    staff.email = "manager@nethub.co.ke"
    staff.full_name = "Test Manager"
    staff.role = StaffRole.MANAGER
    staff.active = True
    staff.organization_id = org_id
    staff.assigned_businesses = [MagicMock(id=business_id, name="Test Store")]
    staff.password_hash = "hashed_password"
    staff.pin_hash = None
    staff.created_at = datetime.now(timezone.utc)
    staff.updated_at = datetime.now(timezone.utc)
    return staff


# ------------------------------------------------------------------
# Authenticated TestClient Fixtures
# ------------------------------------------------------------------
@pytest.fixture(scope="function")
def client_as_owner(app_instance, mock_staff_user):
    """Returns a TestClient with Owner-level authentication."""
    app_instance.dependency_overrides[get_current_user] = lambda: mock_staff_user
    app_instance.dependency_overrides[get_current_staff] = lambda: mock_staff_user
    with TestClient(app_instance) as client:
        yield client
    app_instance.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client_as_cashier(app_instance, mock_cashier_user):
    """Returns a TestClient with Cashier-level authentication."""
    app_instance.dependency_overrides[get_current_user] = lambda: mock_cashier_user
    app_instance.dependency_overrides[get_current_staff] = lambda: mock_cashier_user
    with TestClient(app_instance) as client:
        yield client
    app_instance.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client_as_manager(app_instance, mock_manager_user):
    """Returns a TestClient with Manager-level authentication."""
    app_instance.dependency_overrides[get_current_user] = lambda: mock_manager_user
    app_instance.dependency_overrides[get_current_staff] = lambda: mock_manager_user
    with TestClient(app_instance) as client:
        yield client
    app_instance.dependency_overrides.clear()


@pytest.fixture(scope="function")
def client_unauthenticated(app_instance):
    """Returns a TestClient with no authentication overrides (raw 401/403 behavior)."""
    with TestClient(app_instance) as client:
        yield client


# ------------------------------------------------------------------
# Sample Data Fixtures
# ------------------------------------------------------------------
@pytest.fixture(scope="function")
def client_as_admin(app_instance, mock_staff_user):
    """Returns a TestClient with admin routes enabled."""
    from app.core.config import settings
    original = settings.admin_route
    settings.admin_route = True
    app_instance.dependency_overrides[get_current_user] = lambda: mock_staff_user
    app_instance.dependency_overrides[get_current_staff] = lambda: mock_staff_user
    with TestClient(app_instance) as client:
        yield client
    settings.admin_route = original
    app_instance.dependency_overrides.clear()


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
