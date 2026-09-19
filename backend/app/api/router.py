"""Aggregate Core API routers."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import health, identity, organization, security

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(identity.router)
api_router.include_router(organization.router)
api_router.include_router(security.router)
