"""Document snapshot Redis cache — warm path used after finalize/collect."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.core import document_cache as dc


@pytest.mark.asyncio
async def test_cache_and_get_roundtrip():
    sale_id = uuid4()
    snap = {
        "document_number": "INV-1",
        "financials": {"total_amount": 100.0, "amount_paid": 40.0, "balance_due": 60.0},
    }
    store: dict[str, str] = {}

    client = AsyncMock()

    async def _set(key, payload, ex=None):
        store[key] = payload
        return True

    async def _get(key):
        return store.get(key)

    client.set = _set
    client.get = _get

    mock_mgr = MagicMock()
    mock_mgr.get_async_client.return_value = client

    with patch.object(dc, "redis_manager", mock_mgr, create=True):
        with patch("app.core.redis_client.redis_manager", mock_mgr):
            await dc.cache_document_snapshot(sale_id, snap)
            out = await dc.get_cached_document_snapshot(sale_id)
            assert out is not None
            assert out["financials"]["balance_due"] == 60.0
            assert out["document_number"] == "INV-1"


@pytest.mark.asyncio
async def test_get_miss_returns_none():
    client = AsyncMock()
    client.get = AsyncMock(return_value=None)
    mock_mgr = MagicMock()
    mock_mgr.get_async_client.return_value = client
    with patch("app.core.redis_client.redis_manager", mock_mgr):
        out = await dc.get_cached_document_snapshot(uuid4())
        assert out is None


@pytest.mark.asyncio
async def test_cache_write_failure_does_not_raise():
    client = AsyncMock()
    client.set = AsyncMock(side_effect=RuntimeError("redis down"))
    mock_mgr = MagicMock()
    mock_mgr.get_async_client.return_value = client
    with patch("app.core.redis_client.redis_manager", mock_mgr):
        await dc.cache_document_snapshot(uuid4(), {"ok": True})  # must not raise


@pytest.mark.asyncio
async def test_get_failure_returns_none():
    client = AsyncMock()
    client.get = AsyncMock(side_effect=RuntimeError("redis down"))
    mock_mgr = MagicMock()
    mock_mgr.get_async_client.return_value = client
    with patch("app.core.redis_client.redis_manager", mock_mgr):
        assert await dc.get_cached_document_snapshot(uuid4()) is None


@pytest.mark.asyncio
async def test_invalidate_best_effort():
    client = AsyncMock()
    client.delete = AsyncMock(return_value=1)
    mock_mgr = MagicMock()
    mock_mgr.get_async_client.return_value = client
    with patch("app.core.redis_client.redis_manager", mock_mgr):
        await dc.invalidate_document_snapshot(uuid4())
        client.delete.assert_awaited()


@pytest.mark.asyncio
async def test_no_client_skips_quietly():
    mock_mgr = MagicMock()
    mock_mgr.get_async_client.return_value = None
    with patch("app.core.redis_client.redis_manager", mock_mgr):
        await dc.cache_document_snapshot(uuid4(), {"a": 1})
        assert await dc.get_cached_document_snapshot(uuid4()) is None


def test_snapshot_key_prefix():
    sid = uuid4()
    assert dc.snapshot_key(sid).startswith("doc:snapshot:")
    assert str(sid) in dc.snapshot_key(sid)
