# from fastapi import FastAPI
# from app.api.router import api_router
# from app.core.config import settings
#
# # disables docs on production
# description = f"{settings.app_name} | {settings.app_version} | Environment: {settings.environment}"
# app = FastAPI(title=settings.app_name, version=settings.app_version, docs_url=None, redoc_url=None, description=description) \
#     if settings.is_prod else FastAPI(title=f"{settings.environment}: {settings.app_name}", debug=True, version=settings.app_version,
#                                    description=description)
#
#
#
#
#
# app.include_router(api_router)
#
#
# @app.get("/health")
# async def health_check():
#     return {"status": "healthy",
#             "app_name": settings.app_name,
#             "version": settings.app_version,
#             "environment": "Development" if not settings.is_prod else "Production"}
#


from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession
from starlette.middleware.cors import CORSMiddleware

from app.api.api_router import api_router
from app.core.config import settings
from app.core.session import engine

from app.utils.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        f"Starting {settings.app_name} "
        f"Version: {settings.app_version} "
        f"Environment: {settings.environment}"
    )

    # --------------------------------------------------------------
    # 1. Database Connectivity
    # --------------------------------------------------------------
    try:
        async with AsyncSession(engine) as session:
            logger.info("Verifying database connectivity...")
            await session.exec(text("SELECT 1"))
        logger.info("Database connectivity verified.")
    except Exception as e:
        logger.critical(f"Database connection failed: {e}")
        raise RuntimeError("Database unavailable. Aborting startup.") from e
    yield

    logger.info(f"Shutting down {settings.app_name}")


def create_application() -> FastAPI:
    """
    Factory function to initialize the FastAPI app.
    """
    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
        # docs_url="/docs" if settings.environment != "production" else None,
        redoc_url=None,
    )
    logger.info(f"Allowed Origins: {settings.cors_origins}")
    # 1. Middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,  # In production, specify allowed origins
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return application


app: FastAPI = create_application()

app.include_router(api_router)

@app.get("/health")
async def health_check():
    return {"status": "healthy",
            "app_name": settings.app_name,
            "version": settings.app_version,
            "environment": "Development" if not settings.is_prod else "Production"}




