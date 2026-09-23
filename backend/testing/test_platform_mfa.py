"""Unit tests for platform login email MFA (issue #298)."""
from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.core.security import SecurityService


@pytest.fixture
def sec() -> SecurityService:
    return SecurityService()


@pytest.fixture
def redis_mock():
    store: dict[str, str] = {}
    ttl_map: dict[str, int] = {}

    async def get(key):
        return store.get(key)

    async def set(key, value, ex=None):
        store[key] = value if isinstance(value, str) else value
        if ex is not None:
            ttl_map[key] = int(ex)
        return True

    async def delete(*keys):
        for k in keys:
            store.pop(k, None)
            ttl_map.pop(k, None)
        return 1

    async def ttl(key):
        return ttl_map.get(key, 600)

    client = MagicMock()
    client.get = AsyncMock(side_effect=get)
    client.set = AsyncMock(side_effect=set)
    client.delete = AsyncMock(side_effect=delete)
    client.ttl = AsyncMock(side_effect=ttl)
    client._store = store
    return client


@pytest.mark.asyncio
async def test_create_and_verify_mfa_challenge(sec, redis_mock):
    user_id = uuid4()
    challenge_id, code, ttl = await sec.create_platform_mfa_challenge(
        user_id=user_id,
        email="ops@nethub.co.ke",
        redis_client=redis_mock,
    )
    assert len(code) == 6
    assert code.isdigit()
    assert ttl >= 60
    assert challenge_id

    verified = await sec.verify_platform_mfa_challenge(
        challenge_id=challenge_id,
        code=code,
        redis_client=redis_mock,
    )
    assert verified == str(user_id)
    # Single-use: second verify fails
    with pytest.raises(HTTPException) as ei:
        await sec.verify_platform_mfa_challenge(
            challenge_id=challenge_id,
            code=code,
            redis_client=redis_mock,
        )
    assert ei.value.status_code == 400


@pytest.mark.asyncio
async def test_wrong_code_increments_attempts(sec, redis_mock):
    user_id = uuid4()
    challenge_id, code, _ = await sec.create_platform_mfa_challenge(
        user_id=user_id,
        email="ops@nethub.co.ke",
        redis_client=redis_mock,
    )
    with pytest.raises(HTTPException) as ei:
        await sec.verify_platform_mfa_challenge(
            challenge_id=challenge_id,
            code="000000" if code != "000000" else "111111",
            redis_client=redis_mock,
        )
    assert ei.value.status_code == 400
    detail = ei.value.detail
    assert isinstance(detail, dict)
    assert detail.get("code") == "MFA_CODE_INVALID"
    assert detail.get("attempts_remaining") == 4


@pytest.mark.asyncio
async def test_lockout_after_max_attempts(sec, redis_mock, monkeypatch):
    from app.core import config as config_mod

    monkeypatch.setattr(config_mod.settings, "platform_mfa_max_attempts", 2)
    user_id = uuid4()
    challenge_id, code, _ = await sec.create_platform_mfa_challenge(
        user_id=user_id,
        email="ops@nethub.co.ke",
        redis_client=redis_mock,
    )
    bad = "000000" if code != "000000" else "111111"
    with pytest.raises(HTTPException):
        await sec.verify_platform_mfa_challenge(
            challenge_id=challenge_id, code=bad, redis_client=redis_mock
        )
    with pytest.raises(HTTPException) as ei:
        await sec.verify_platform_mfa_challenge(
            challenge_id=challenge_id, code=bad, redis_client=redis_mock
        )
    # After max attempts the challenge is locked/deleted
    assert ei.value.status_code == 400
    detail = ei.value.detail
    assert isinstance(detail, dict)
    assert detail.get("code") in ("MFA_LOCKED", "MFA_CODE_INVALID", "MFA_CHALLENGE_INVALID")


def test_email_hint_masking():
    from app.api.routes.platform import _email_hint

    assert _email_hint("alice@nethub.co.ke") == "a***@nethub.co.ke"
    assert "@" in _email_hint("ab@x.com")
