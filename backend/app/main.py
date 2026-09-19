"""Tawala Core FastAPI application factory.

This is the Core platform entrypoint on branch core/v2.
It must not import product POS modules and must never be merged into main/dev.
"""

from __future__ import annotations

from fastapi import FastAPI

from app.api.router import api_router


def create_application() -> FastAPI:
    """Build the Core API application.

    Returns:
        Configured FastAPI app with Core routers only.
    """
    application = FastAPI(
        title="Tawala Core",
        version="0.1.0",
        description=(
            "Tawala Core platform foundation. "
            "Isolated branch core/v2 — not the product POS API."
        ),
    )
    application.include_router(api_router)
    return application


app = create_application()
