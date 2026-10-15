"""Unit tests for NetHub access forward client."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.services import nethub_access as na


@pytest.mark.asyncio
async def test_fetch_requires_configured_url():
    with patch.object(na.settings, "auth_nethub_access_url", ""):
        with pytest.raises(HTTPException) as ei:
            await na.fetch_product_access(idp_access_token="tok", product_slug="tawala-platform")
    assert ei.value.status_code == 503


@pytest.mark.asyncio
async def test_fetch_maps_403():
    uid, tid, ext = uuid4(), uuid4(), uuid4()

    class Resp:
        status_code = 403

        def json(self):
            return {}

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=Resp())
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch.object(na.settings, "auth_nethub_access_url", "https://api.example/api/v1/access"):
        with patch.object(na.httpx, "AsyncClient", return_value=mock_client):
            with pytest.raises(HTTPException) as ei:
                await na.fetch_product_access(idp_access_token="tok", product_slug="tawala-platform")
    assert ei.value.status_code == 403


@pytest.mark.asyncio
async def test_fetch_happy():
    uid, tid, ext = uuid4(), uuid4(), uuid4()

    class Resp:
        status_code = 200

        def json(self):
            return {
                "user_id": str(uid),
                "sub": "sub",
                "email": "a@b.com",
                "tenant_id": str(tid),
                "product": "tawala-platform",
                "entitled": True,
                "role": "SUPER_ADMIN",
                "external_org_id": None,
                "external_user_id": str(ext),
            }

    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=Resp())
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)

    with patch.object(na.settings, "auth_nethub_access_url", "https://api.example/api/v1/access"):
        with patch.object(na.httpx, "AsyncClient", return_value=mock_client):
            p = await na.fetch_product_access(idp_access_token="tok", product_slug="tawala-platform")
    assert p.user_id == uid
    assert p.external_user_id == ext
    assert p.role == "SUPER_ADMIN"
