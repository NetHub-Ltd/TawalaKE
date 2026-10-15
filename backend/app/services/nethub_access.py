"""Forward IdP Bearer to NetHubKe GET /access/{product} (Path A).

Tawala never validates IdP JWTs; NetHubKe is the only validator.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional
from uuid import UUID

import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.utils.logging import logger


@dataclass(frozen=True)
class NethubAccessPrincipal:
    user_id: UUID
    sub: str
    email: str
    tenant_id: UUID
    product: str
    entitled: bool
    role: str
    external_org_id: Optional[UUID]
    external_user_id: Optional[UUID]


def _access_base_url() -> str:
    return (getattr(settings, "auth_nethub_access_url", None) or "").rstrip("/")


async def fetch_product_access(
    *,
    idp_access_token: str,
    product_slug: str,
) -> NethubAccessPrincipal:
    base = _access_base_url()
    if not base:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NetHub access URL is not configured",
        )
    slug = (product_slug or "").strip().strip("/")
    url = f"{base}/{slug}"
    timeout = float(getattr(settings, "auth_nethub_access_timeout_sec", 8.0) or 8.0)

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(
                url,
                headers={
                    "Authorization": f"Bearer {idp_access_token}",
                    "Accept": "application/json",
                },
            )
    except httpx.TimeoutException as exc:
        logger.warning(f"NetHub access timeout product={slug}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NetHub access timed out",
        ) from exc
    except httpx.HTTPError as exc:
        logger.warning(f"NetHub access transport error product={slug}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NetHub access unavailable",
        ) from exc

    if resp.status_code in (401, 403):
        # Do not echo upstream body (may contain details); map status
        raise HTTPException(
            status_code=resp.status_code,
            detail="NetHub access denied",
        )
    if resp.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NetHub user or product not found",
        )
    if resp.status_code >= 400:
        logger.warning(
            f"NetHub access unexpected status={resp.status_code} product={slug}"
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="NetHub access failed",
        )

    try:
        data: dict[str, Any] = resp.json()
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="NetHub access returned invalid JSON",
        ) from exc

    def _uuid(key: str, *, required: bool = True) -> Optional[UUID]:
        raw = data.get(key)
        if raw is None or raw == "":
            if required:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"NetHub access missing {key}",
                )
            return None
        try:
            return UUID(str(raw))
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"NetHub access invalid {key}",
            ) from exc

    return NethubAccessPrincipal(
        user_id=_uuid("user_id"),  # type: ignore[arg-type]
        sub=str(data.get("sub") or ""),
        email=str(data.get("email") or ""),
        tenant_id=_uuid("tenant_id"),  # type: ignore[arg-type]
        product=str(data.get("product") or slug),
        entitled=bool(data.get("entitled", True)),
        role=str(data.get("role") or ""),
        external_org_id=_uuid("external_org_id", required=False),
        external_user_id=_uuid("external_user_id", required=False),
    )
