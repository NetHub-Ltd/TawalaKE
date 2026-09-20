"""Tawala Core FastAPI application factory.

This is the Core platform entrypoint on branch core/v2.
It must not import product POS modules and must never be merged into main/dev.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.core_platform.shared.settings import get_settings
from app.db.session import check_database, reset_engine


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Refuse to serve traffic if Postgres is unreachable."""
    settings = get_settings()
    settings.require_database_url()
    reset_engine()
    ok = await check_database()
    if not ok:
        raise RuntimeError(
            "Database connectivity check failed. "
            "Ensure Postgres is up and DB_* / DATABASE_URL are correct. "
            "Application will not start."
        )
    yield
    reset_engine()


def create_application() -> FastAPI:
    """Build the Core API application."""
    application = FastAPI(
        title="Tawala Core",
        version="0.1.0",
        description=(
            "Tawala Core platform foundation. "
            "Isolated branch core/v2 — not the product POS API."
        ),
        lifespan=lifespan,
    )
    application.include_router(api_router)
    return application


app = create_application()
