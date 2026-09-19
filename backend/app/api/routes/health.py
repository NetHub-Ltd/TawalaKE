"""Liveness and readiness endpoints (SPEC Part F.1)."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe — process is up."""
    return {"status": "ok", "service": "tawala-core"}


@router.get("/ready")
async def ready() -> dict[str, str]:
    """Readiness probe — skeleton has no DB dependency yet.

    When the database layer is added (milestone M3), this endpoint must
    verify connectivity and fail closed if the database is unavailable.
    """
    return {"status": "ready", "service": "tawala-core", "database": "not_configured"}
