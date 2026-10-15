"""Unit tests for Path A opaque session store (no Redis required for pure helpers)."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from app.core import opaque_session as osess


def test_build_session_shapes():
    pid = uuid4()
    sid, session = osess.build_session(
        auth_source="nethub",
        principal_kind="platform",
        principal_id=pid,
        role="SUPER_ADMIN",
        ttl_sec=600,
        nethub_user_id=uuid4(),
        email="ops@example.com",
        sub="idp-sub",
    )
    assert sid
    assert session.principal_id == str(pid)
    assert session.principal_kind == "platform"
    assert session.auth_source == "nethub"
    assert session.role == "SUPER_ADMIN"
    assert session.exp > session.iat
    raw = session.to_json()
    restored = osess.OpaqueSession.from_json(raw)
    assert restored.principal_id == session.principal_id
    assert restored.email == "ops@example.com"


def test_session_key_prefix():
    assert osess._key("abc").startswith("tawala:opaque_session:")


@pytest.mark.asyncio
async def test_save_load_delete_roundtrip():
    redis = AsyncMock()
    store: dict[str, str] = {}

    async def _set(key, value, ex=None):
        store[key] = value

    async def _get(key):
        return store.get(key)

    async def _delete(key):
        store.pop(key, None)

    redis.set = AsyncMock(side_effect=_set)
    redis.get = AsyncMock(side_effect=_get)
    redis.delete = AsyncMock(side_effect=_delete)

    sid, session = osess.build_session(
        auth_source="legacy",
        principal_kind="staff",
        principal_id=uuid4(),
        role="CASHIER",
        org_id=uuid4(),
        ttl_sec=120,
    )
    await osess.save_session(redis, sid, session)
    loaded = await osess.load_session(redis, sid)
    assert loaded is not None
    assert loaded.principal_kind == "staff"
    assert loaded.role == "CASHIER"
    await osess.delete_session(redis, sid)
    assert await osess.load_session(redis, sid) is None


def test_opaque_session_enabled_flag():
    with patch.object(osess.settings, "auth_opaque_session_v1", False):
        assert osess.opaque_session_enabled() is False
    with patch.object(osess.settings, "auth_opaque_session_v1", True):
        assert osess.opaque_session_enabled() is True
