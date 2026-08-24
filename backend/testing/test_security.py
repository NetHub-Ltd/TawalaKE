"""Unit tests for SecurityService (hashing, tokens, scopes)."""
import pytest
from datetime import timedelta
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException
from jose import jwt

from app.core.security import SecurityService, StaffRole, ROLE_SCOPES, Token
from app.core.config import settings


@pytest.fixture
def sec():
    return SecurityService()


def test_hash_and_verify_password(sec):
    hashed = sec.hash_password("SecurePass123!")
    assert hashed != "SecurePass123!"
    assert sec.verify_password("SecurePass123!", hashed) is True
    assert sec.verify_password("wrong", hashed) is False


def test_hash_and_verify_pin(sec):
    salt = sec.generate_pin_salt()
    assert len(salt) == 32
    hashed = sec.hash_pin("1234", salt)
    assert sec.verify_pin("1234", hashed, salt) is True
    assert sec.verify_pin("9999", hashed, salt) is False
    assert sec.verify_pin("12", hashed, salt) is False


def test_hash_pin_rejects_non_digit(sec):
    with pytest.raises(ValueError):
        sec.hash_pin("abcd", sec.generate_pin_salt())


def test_create_tokens_includes_scopes_and_claims(sec):
    user_data = {
        "sub": str(uuid4()),
        "organization_id": str(uuid4()),
        "role": "OWNER",
    }
    business_id = str(uuid4())
    tokens = sec.create_tokens(user_data, business_id=business_id)
    assert isinstance(tokens, Token)
    assert tokens.access_token
    assert tokens.refresh_token
    assert tokens.id_token

    payload = jwt.decode(
        tokens.access_token,
        settings.secret_key,
        algorithms=[settings.algorithm],
        audience=settings.audience,
        issuer=settings.issuer,
    )
    assert payload["type"] == "access"
    assert payload["role"] == "OWNER"
    assert payload["business_id"] == business_id
    assert "org:admin" in payload["scopes"]
    assert payload["jti"]


@pytest.mark.asyncio
async def test_verify_token_success(sec):
    user_data = {"sub": str(uuid4()), "organization_id": str(uuid4()), "role": "CASHIER"}
    tokens = sec.create_tokens(user_data)
    data = await sec.verify_token(tokens.access_token, expected_type="access")
    assert data.sub == user_data["sub"]
    assert data.role == "CASHIER"


@pytest.mark.asyncio
async def test_verify_token_wrong_type(sec):
    user_data = {"sub": str(uuid4()), "organization_id": str(uuid4()), "role": "MANAGER"}
    tokens = sec.create_tokens(user_data)
    with pytest.raises(HTTPException) as ei:
        await sec.verify_token(tokens.refresh_token, expected_type="access")
    assert ei.value.status_code == 401


@pytest.mark.asyncio
async def test_verify_token_blacklisted(sec):
    user_data = {"sub": str(uuid4()), "organization_id": str(uuid4()), "role": "OWNER"}
    tokens = sec.create_tokens(user_data)
    payload = jwt.decode(
        tokens.access_token,
        settings.secret_key,
        algorithms=[settings.algorithm],
        audience=settings.audience,
        issuer=settings.issuer,
    )
    redis = AsyncMock()
    redis.get = AsyncMock(return_value="1")
    with pytest.raises(HTTPException) as ei:
        await sec.verify_token(tokens.access_token, redis_client=redis)
    assert ei.value.status_code == 401
    redis.get.assert_awaited()


def test_role_scopes_owner_superset_of_cashier():
    owner = set(ROLE_SCOPES[StaffRole.OWNER])
    cashier = set(ROLE_SCOPES[StaffRole.CASHIER])
    assert cashier.issubset(owner)
    assert "org:admin" in owner
    assert "org:admin" not in cashier
