from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession
from starlette.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.api_router import api_router
from app.core.config import settings
from app.core.session import engine
from app.core.redis_client import redis_manager, limiter # Import slowapi limiter setup
from app.utils.logging import logger
from app.prestart import create_admin_tenant
from app.utils.helpers import utc_now


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        f"Starting {settings.app_name} | "
        f"Version: {settings.app_version} | "
        f"Environment: {settings.environment} | "
        f"System Time: {utc_now()}"
    )

    # --------------------------------------------------------------
    # 1. Database Connectivity Verification
    # --------------------------------------------------------------
    try:
        async with AsyncSession(engine) as session:
            logger.info("Verifying database connectivity...")
            await session.exec(text("SELECT 1"))
        logger.info("Database connectivity verified.")
        logger.info("Checking admin account")
        await create_admin_tenant()
    except Exception as e:
        logger.critical(f"Database connection failed: {str(e)}")
        raise RuntimeError("Database unavailable. Aborting startup.") from e

    # --------------------------------------------------------------
    # 2. Redis State Initialization
    # --------------------------------------------------------------
    try:
        logger.info("Initializing Redis connection pool...")
        # Warm up the async pool connection on startup
        _ = redis_manager.get_async_client()
        logger.info("Redis client connected successfully.")
    except Exception as e:
        logger.critical(f"Redis initialization failed: {str(e)}")
        raise RuntimeError("Cache layer unavailable. Aborting startup.") from e
    
    yield
    
    # --------------------------------------------------------------
    # 3. Graceful Clean Up & Teardown
    # --------------------------------------------------------------
    logger.info(f"Shutting down {settings.app_name}")
    await redis_manager.close()
    await engine.dispose()
    logger.info(f"{settings.app_name} shutdown complete.")


def create_application() -> FastAPI:
    """
    Factory function to initialize the FastAPI app.
    Dynamically strips documentation and redoc setups in production environments.
    """
    # Enforce strict production documentation visibility control
    is_production = settings.is_prod or settings.environment.lower() == "production"
    
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
        docs_url=None if is_production else "/docs",
        redoc_url=None if is_production else "/redoc",
        openapi_url=None if is_production else "/openapi.json"
    )

    # 1. Register Slowapi State and Core Exception Handlers
    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # 2. Middleware Stack Configuration
    logger.info(f"CORS Configurations -> Allowed Origins: {settings.cors_origins}")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 3. Base Application Router Inclusions
    application.include_router(api_router)

    # 4. Standard Health Check Endpoint
    @application.get("/health", tags=["System Operational Infrastructure"])
    async def health_check():
        return {
            "status": "healthy",
            "app_name": settings.app_name,
            "version": settings.app_version,
            "environment": "Production" if is_production else "Development"
        }

    return application


# Global application invocation instance
app: FastAPI = create_application()