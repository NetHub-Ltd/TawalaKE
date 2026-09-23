"""Hard-session JWT verification (ecosystem auth M1).

Validates RS256 tokens issued/exchanged by NetHubKe (aud=tawala-api) using
local JWKS only — no per-request HTTP call to NetHub or Keycloak beyond JWKS
fetch/cache.

Gated by settings.auth_hard_session_v2 (default False).
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Optional
from uuid import UUID

import jwt
from jwt import PyJWKClient

from app.core.config import settings
from app.utils.logging import logger


class HardSessionError(Exception):
    """Hard-session verification failed (deps map to HTTP 401)."""

    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)


@dataclass(frozen=True)
class HardSessionPrincipal:
    """Org-scoped principal from a verified hard-session access token."""

    sub: str
    org_id: UUID
    principal: str  # owner | terminal
    email: Optional[str] = None
    raw_claims: Optional[dict[str, Any]] = None


def hard_session_enabled() -> bool:
    return bool(getattr(settings, "auth_hard_session_v2", False))


def _jwks_url() -> str:
    url = (getattr(settings, "auth_hard_jwks_url", None) or "").strip()
    if url:
        return url
    issuer = (getattr(settings, "auth_hard_issuer", None) or "").rstrip("/")
    if issuer:
        return f"{issuer}/protocol/openid-connect/certs"
    return ""


@lru_cache(maxsize=4)
def _jwks_client(jwks_url: str, ttl: int) -> PyJWKClient:
    return PyJWKClient(
        uri=jwks_url,
        cache_jwk_set=True,
        lifespan=max(60, ttl),
        cache_keys=True,
        max_cached_keys=16,
    )


def verify_hard_session_token(token: str) -> HardSessionPrincipal:
    """Verify a hard-session Bearer token. Raises HardSessionError on failure."""
    if not hard_session_enabled():
        raise HardSessionError("Hard session authentication is not enabled")

    issuer = (settings.auth_hard_issuer or "").strip()
    audience = (settings.auth_hard_audience or "tawala-api").strip()
    jwks_url = _jwks_url()
    if not issuer or not jwks_url:
        logger.error("auth_hard_session_v2 enabled but issuer/jwks not configured")
        raise HardSessionError("Hard session is not configured")

    try:
        client = _jwks_client(jwks_url, int(settings.auth_hard_jwks_cache_ttl_sec))
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=audience,
            issuer=issuer,
            leeway=int(getattr(settings, "auth_hard_leeway_sec", 10)),
            options={"require": ["exp", "iss", "sub"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise HardSessionError("Hard session token has expired") from exc
    except jwt.InvalidTokenError as exc:
        logger.info(f"Hard session JWT invalid: {exc}")
        raise HardSessionError("Invalid hard session token") from exc
    except HardSessionError:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"Hard session JWKS/verify failed: {exc}")
        raise HardSessionError("Invalid hard session token") from exc

    org_raw = payload.get("org_id") or payload.get("organization_id")
    if not org_raw:
        raise HardSessionError("Hard session missing org_id")
    try:
        org_id = UUID(str(org_raw))
    except ValueError as exc:
        raise HardSessionError("Hard session org_id is not a valid UUID") from exc

    principal = str(payload.get("principal") or "terminal").strip().lower()
    if principal not in ("owner", "terminal"):
        raise HardSessionError("Hard session principal must be owner or terminal")

    sub = payload.get("sub")
    if not sub:
        raise HardSessionError("Hard session missing sub")

    return HardSessionPrincipal(
        sub=str(sub),
        org_id=org_id,
        principal=principal,
        email=(str(payload["email"]) if payload.get("email") else None),
        raw_claims=dict(payload),
    )


def clear_jwks_cache() -> None:
    _jwks_client.cache_clear()
