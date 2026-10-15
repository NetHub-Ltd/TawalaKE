"""Dependencies for Path A opaque sessions (flag-gated)."""
from __future__ import annotations

from typing import Annotated, Optional

from fastapi import Depends, HTTPException, Request, status
from redis.asyncio import Redis as AsyncRedis

from app.api.deps import get_redis
from app.core.config import settings
from app.core.opaque_session import (
    OpaqueSession,
    load_session,
    opaque_session_enabled,
)


def _cookie_name() -> str:
    return getattr(settings, "auth_opaque_session_cookie_name", "tawala_session") or "tawala_session"


def extract_session_id(request: Request) -> Optional[str]:
    """Cookie first, then Authorization: Session <id> or X-Tawala-Session."""
    name = _cookie_name()
    sid = request.cookies.get(name)
    if sid:
        return sid.strip() or None
    header = request.headers.get("X-Tawala-Session")
    if header:
        return header.strip() or None
    auth = request.headers.get("Authorization") or ""
    if auth.lower().startswith("session "):
        return auth[8:].strip() or None
    return None


async def get_opaque_session_optional(
    request: Request,
    redis: AsyncRedis = Depends(get_redis),
) -> Optional[OpaqueSession]:
    if not opaque_session_enabled():
        return None
    sid = extract_session_id(request)
    if not sid:
        return None
    return await load_session(redis, sid)


async def require_opaque_session(
    request: Request,
    redis: AsyncRedis = Depends(get_redis),
) -> OpaqueSession:
    if not opaque_session_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Opaque session auth is not enabled",
        )
    sid = extract_session_id(request)
    if not sid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    session = await load_session(redis, sid)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid",
        )
    return session


async def require_platform_opaque_session(
    session: OpaqueSession = Depends(require_opaque_session),
) -> OpaqueSession:
    if session.principal_kind != "platform":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Platform session required",
        )
    return session


OpaqueSessionDep = Annotated[OpaqueSession, Depends(require_opaque_session)]
OptionalOpaqueSessionDep = Annotated[
    Optional[OpaqueSession], Depends(get_opaque_session_optional)
]
PlatformOpaqueSessionDep = Annotated[
    OpaqueSession, Depends(require_platform_opaque_session)
]
