"""Unit tests for hard-session JWT verification (M1)."""
from __future__ import annotations

import time
from unittest.mock import MagicMock, patch
from uuid import uuid4

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import load_pem_private_key

from app.core import hard_session as hs
from app.core.hard_session import HardSessionError


@pytest.fixture(scope="module")
def rsa_pair():
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    return private_pem, key.public_key()


def _settings(**overrides):
    base = {
        "auth_hard_session_v2": True,
        "auth_hard_issuer": "https://idp.example/realms/test",
        "auth_hard_audience": "tawala-api",
        "auth_hard_jwks_url": "https://idp.example/jwks",
        "auth_hard_jwks_cache_ttl_sec": 600,
        "auth_hard_leeway_sec": 10,
    }
    base.update(overrides)
    m = MagicMock()
    for k, v in base.items():
        setattr(m, k, v)
    return m


def _token(private_pem, claims):
    return jwt.encode(
        claims,
        private_pem,
        algorithm="RS256",
        headers={"kid": "test-key"},
    )


def _mock_jwks(private_pem):
    pub = load_pem_private_key(private_pem, password=None).public_key()
    fake_signing = MagicMock()
    fake_signing.key = pub
    fake_client = MagicMock()
    fake_client.get_signing_key_from_jwt.return_value = fake_signing
    return fake_client


def _base_claims(**overrides):
    claims = {
        "sub": "kc-1",
        "org_id": str(uuid4()),
        "principal": "terminal",
        "iss": "https://idp.example/realms/test",
        "aud": "tawala-api",
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
    }
    claims.update(overrides)
    return claims


def test_flag_off_rejects(rsa_pair):
    private_pem, _ = rsa_pair
    token = _token(private_pem, _base_claims())
    with patch.object(hs, "settings", _settings(auth_hard_session_v2=False)):
        with pytest.raises(HardSessionError, match="not enabled"):
            hs.verify_hard_session_token(token)


def test_misconfigured_issuer_jwks(rsa_pair):
    private_pem, _ = rsa_pair
    token = _token(private_pem, _base_claims())
    with patch.object(
        hs,
        "settings",
        _settings(auth_hard_issuer="", auth_hard_jwks_url=""),
    ):
        with pytest.raises(HardSessionError, match="not configured"):
            hs.verify_hard_session_token(token)


def test_valid_token(rsa_pair):
    private_pem, _ = rsa_pair
    org = uuid4()
    claims = _base_claims(
        sub="kc-sub-1",
        org_id=str(org),
        principal="owner",
        email="owner@example.com",
    )
    token = _token(private_pem, claims)
    fake_client = _mock_jwks(private_pem)

    with patch.object(hs, "settings", _settings()):
        with patch.object(hs, "_jwks_client", return_value=fake_client):
            principal = hs.verify_hard_session_token(token)

    assert principal.org_id == org
    assert principal.principal == "owner"
    assert principal.sub == "kc-sub-1"
    assert principal.email == "owner@example.com"
    assert principal.raw_claims is not None


def test_organization_id_alias(rsa_pair):
    """Accept organization_id when org_id is absent (compat)."""
    private_pem, _ = rsa_pair
    org = uuid4()
    claims = _base_claims(org_id=None, organization_id=str(org))
    del claims["org_id"]
    claims["organization_id"] = str(org)
    token = _token(private_pem, claims)
    fake_client = _mock_jwks(private_pem)

    with patch.object(hs, "settings", _settings()):
        with patch.object(hs, "_jwks_client", return_value=fake_client):
            principal = hs.verify_hard_session_token(token)
    assert principal.org_id == org


def test_wrong_audience(rsa_pair):
    private_pem, _ = rsa_pair
    token = _token(private_pem, _base_claims(aud="other-api"))
    fake_client = _mock_jwks(private_pem)

    with patch.object(hs, "settings", _settings()):
        with patch.object(hs, "_jwks_client", return_value=fake_client):
            with pytest.raises(HardSessionError, match="Invalid"):
                hs.verify_hard_session_token(token)


def test_expired(rsa_pair):
    private_pem, _ = rsa_pair
    token = _token(
        private_pem,
        _base_claims(exp=int(time.time()) - 100, iat=int(time.time()) - 200),
    )
    fake_client = _mock_jwks(private_pem)

    with patch.object(hs, "settings", _settings(auth_hard_leeway_sec=0)):
        with patch.object(hs, "_jwks_client", return_value=fake_client):
            with pytest.raises(HardSessionError, match="expired"):
                hs.verify_hard_session_token(token)


def test_missing_org_id(rsa_pair):
    private_pem, _ = rsa_pair
    claims = _base_claims()
    del claims["org_id"]
    token = _token(private_pem, claims)
    fake_client = _mock_jwks(private_pem)

    with patch.object(hs, "settings", _settings()):
        with patch.object(hs, "_jwks_client", return_value=fake_client):
            with pytest.raises(HardSessionError, match="org_id"):
                hs.verify_hard_session_token(token)


def test_invalid_org_uuid(rsa_pair):
    private_pem, _ = rsa_pair
    token = _token(private_pem, _base_claims(org_id="not-a-uuid"))
    fake_client = _mock_jwks(private_pem)

    with patch.object(hs, "settings", _settings()):
        with patch.object(hs, "_jwks_client", return_value=fake_client):
            with pytest.raises(HardSessionError, match="UUID"):
                hs.verify_hard_session_token(token)


def test_bad_principal(rsa_pair):
    private_pem, _ = rsa_pair
    token = _token(private_pem, _base_claims(principal="cashier"))
    fake_client = _mock_jwks(private_pem)

    with patch.object(hs, "settings", _settings()):
        with patch.object(hs, "_jwks_client", return_value=fake_client):
            with pytest.raises(HardSessionError, match="principal"):
                hs.verify_hard_session_token(token)


def test_missing_sub(rsa_pair):
    private_pem, _ = rsa_pair
    claims = _base_claims()
    del claims["sub"]
    token = _token(private_pem, claims)
    fake_client = _mock_jwks(private_pem)

    with patch.object(hs, "settings", _settings()):
        with patch.object(hs, "_jwks_client", return_value=fake_client):
            with pytest.raises(HardSessionError):
                hs.verify_hard_session_token(token)


def test_jwks_url_derived_from_issuer():
    with patch.object(
        hs,
        "settings",
        _settings(auth_hard_jwks_url="", auth_hard_issuer="https://idp.example/realms/test"),
    ):
        assert hs._jwks_url() == "https://idp.example/realms/test/protocol/openid-connect/certs"


def test_clear_jwks_cache():
    hs.clear_jwks_cache()  # should not raise


def test_hard_session_enabled_flag():
    with patch.object(hs, "settings", _settings(auth_hard_session_v2=True)):
        assert hs.hard_session_enabled() is True
    with patch.object(hs, "settings", _settings(auth_hard_session_v2=False)):
        assert hs.hard_session_enabled() is False
