"""Paywall validity middleware — Redis-first plan active check.

Only answers: does this org have a valid (active, non-expired) plan?
Feature and limit checks stay in route deps and PaywallService.

Skips public/auth/health paths. When org_id cannot be resolved from the
request, the middleware is a no-op (route auth + deps still apply).

On Redis miss, optionally loads from DB and warms the cache so subsequent
requests stay fast. Fail-closed for protected mutating paths when a validity
bit is explicitly false.
"""
from __future__ import annotations

import re
from typing import Callable, Optional, Set
from uuid import UUID

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.utils.logging import logger

# Paths that never require a paid plan (auth, public catalog, webhooks, docs)
_SKIP_PREFIXES = (
    "/api/v1/auth",
    "/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/api/v1/organizations/plans",
    "/api/v1/payments",
)

# Protected API prefixes — validity gate applies when org is known
_PROTECTED_PREFIXES = (
    "/api/v1/products",
    "/api/v1/stock",
    "/api/v1/business",
    "/api/v1/organizations",
)

_ORG_UUID_RE = re.compile(
    r"/organizations/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})"
)


def _should_skip(path: str) -> bool:
    if path in ("/", "/health", "/healthz", "/ready"):
        return True
    for prefix in _SKIP_PREFIXES:
        if path.startswith(prefix):
            return True
    return False


def _is_protected(path: str) -> bool:
    for prefix in _PROTECTED_PREFIXES:
        if path.startswith(prefix):
            return True
    return False


def _org_from_request(request: Request) -> Optional[UUID]:
    # 1) Set by upstream auth middleware / dependency via request.state
    state_org = getattr(request.state, "organization_id", None)
    if state_org:
        try:
            return UUID(str(state_org))
        except ValueError:
            pass
    # 2) Explicit header (BFF / internal)
    header = request.headers.get("x-organization-id")
    if header:
        try:
            return UUID(header)
        except ValueError:
            pass
    # 3) Path segment
    m = _ORG_UUID_RE.search(request.url.path)
    if m:
        try:
            return UUID(m.group(1))
        except ValueError:
            pass
    return None


class PaywallValidityMiddleware(BaseHTTPMiddleware):
    """
    Block protected routes when Redis validity bit is explicitly inactive.
    Does not replace endpoint feature deps.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path
        if request.method == "OPTIONS" or _should_skip(path) or not _is_protected(path):
            return await call_next(request)

        org_id = _org_from_request(request)
        if org_id is None:
            # Auth not yet resolved — let route deps enforce
            return await call_next(request)

        redis = None
        try:
            from app.core.redis_client import redis_manager

            redis = redis_manager.get_async_client()
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"paywall middleware redis unavailable: {exc}")
            return await call_next(request)

        from app.services.paywall import paywall

        valid = await paywall.is_plan_valid_cached(redis, org_id)
        if valid is False:
            return JSONResponse(
                status_code=403,
                content={
                    "detail": {
                        "code": "SUBSCRIPTION_INACTIVE",
                        "message": "No active subscription for this organization.",
                    }
                },
            )

        # Cache miss: warm in background of request via state flag for deps
        if valid is None:
            request.state.paywall_cache_miss = True
            request.state.paywall_org_id = str(org_id)

        return await call_next(request)
