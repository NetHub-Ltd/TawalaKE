# # # tests/conftest.py
# # import pytest
# # from unittest.mock import AsyncMock, MagicMock, patch
# # from fastapi.testclient import TestClient

# # # Force testing environment attributes prior to core app evaluation
# # with patch("app.core.config.settings.environment", "testing"), \
# #      patch("app.core.config.settings.is_prod", False):
# #     from app.core.config import settings
# #     from app.core.redis_client import redis_manager
# #     from app.main import create_application

# # @pytest.fixture(scope="function")
# # def mock_db_engine():
# #     """
# #     Interceptors for the SQLAlchemy/SQLModel async database context.
# #     Mocks 'AsyncSession(engine)' to cleanly return a successful SELECT 1 response.
# #     """
# #     with patch("app.main.AsyncSession") as mock_session_cls:
# #         mock_session_instance = AsyncMock()
# #         # Mock the session.exec() context wrapper behavior
# #         mock_session_instance.exec = AsyncMock(return_value=MagicMock())
# #         mock_session_cls.return_value.__aenter__.return_value = mock_session_instance
# #         yield mock_session_cls

# # @pytest.fixture(scope="function")
# # def mock_redis_manager():
# #     """
# #     Interceptors for the global Redis client instance state.
# #     Prevents live pool compilation hooks during test runners.
# #     """
# #     with patch.object(redis_manager, "get_async_client") as mock_get_client, \
# #          patch.object(redis_manager, "close", new_callable=AsyncMock) as mock_close:
        
# #         mock_client = MagicMock()
# #         mock_get_client.return_value = mock_client
        
# #         yield {
# #             "manager": redis_manager,
# #             "get_async_client": mock_get_client,
# #             "close": mock_close
# #         }

# # @pytest.fixture(scope="function")
# # def app_instance(mock_db_engine, mock_redis_manager):
# #     """
# #     Generates a freshly created instance of the FastAPI application factory
# #     with all peripheral IO systems safely mocked.
# #     """
# #     app = create_application()
# #     return app

# # tests/conftest.py
# import pytest
# from unittest.mock import AsyncMock, MagicMock, patch

# # 1. Import settings and configure absolute baseline test constraints immediately
# from app.core.config import settings, Environment

# settings.environment = Environment.DEVELOPMENT

# # 2. Safely import downstream dependencies now that settings are primed
# from app.core.redis_client import redis_manager
# from app.main import create_application


# @pytest.fixture(scope="function")
# def mock_db_engine():
#     """
#     Mocks the SQLModel/SQLAlchemy AsyncSession environment 
#     to prevent physical database socket handshakes.
#     """
#     with patch("app.main.AsyncSession") as mock_session_cls:
#         mock_session_instance = AsyncMock()
#         mock_session_instance.exec = AsyncMock(return_value=MagicMock())
#         mock_session_cls.return_value.__aenter__.return_value = mock_session_instance
#         yield mock_session_cls


# @pytest.fixture(scope="function")
# def mock_redis_manager():
#     """
#     Intercepts the application Redis manager state to isolate testing 
#     from active shared memory environments.
#     """
#     with patch.object(redis_manager, "get_async_client") as mock_get_client, \
#          patch.object(redis_manager, "close", new_callable=AsyncMock) as mock_close:
        
#         mock_client = MagicMock()
#         mock_get_client.return_value = mock_client
        
#         yield {
#             "manager": redis_manager,
#             "get_async_client": mock_get_client,
#             "close": mock_close
#         }


# @pytest.fixture(scope="function")
# def app_instance(mock_db_engine, mock_redis_manager):
#     """Generates an isolated instance of the FastAPI application."""
#     return create_application()

# testing/conftest.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

# 1. Force the baseline environment config first
from app.core.config import settings, Environment
settings.environment = Environment.DEVELOPMENT

# 2. Import down-stream resources safely
from app.core.redis_client import redis_manager
from app.main import create_application

@pytest.fixture(scope="function")
def mock_db_engine():
    """Mocks SQLModel AsyncSession to isolate persistence loops during test cycles."""
    with patch("app.main.AsyncSession") as mock_session_cls:
        mock_session_instance = AsyncMock()
        mock_session_instance.exec = AsyncMock(return_value=MagicMock())
        mock_session_cls.return_value.__aenter__.return_value = mock_session_instance
        yield mock_session_cls

@pytest.fixture(scope="function")
def mock_redis_manager():
    """Intercepts active Redis connections to use isolated mock instances."""
    with patch.object(redis_manager, "get_async_client") as mock_get_client, \
         patch.object(redis_manager, "close", new_callable=AsyncMock) as mock_close:
        
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        
        yield {
            "manager": redis_manager,
            "get_async_client": mock_get_client,
            "close": mock_close
        }

@pytest.fixture(scope="function")
def app_instance(mock_db_engine, mock_redis_manager):
    """Provides a cleanly initialized application factory instance."""
    return create_application()