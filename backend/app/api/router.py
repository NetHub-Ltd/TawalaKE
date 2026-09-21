"""Aggregate Core API routers."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import (
    audit,
    catalog,
    configuration,
    entitlements,
    health,
    identity,
    organization,
    parties,
    security,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(identity.router)
api_router.include_router(organization.router)
api_router.include_router(security.router)
api_router.include_router(parties.router)
api_router.include_router(catalog.router)
api_router.include_router(audit.router)
api_router.include_router(configuration.router)
api_router.include_router(entitlements.router)
