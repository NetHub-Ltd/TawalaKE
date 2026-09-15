"""Unit tests for hard-session JWT verification (M1)."""
from __future__ import annotations

import time
from unittest.mock import MagicMock, patch
from uuid import uuid4

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from app.core.hard_session import HardSessionError

from app.core import hard_session as hs


@pytest.fixture(scope="module")
def rsa_pair():
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_pem, public_pem


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


def _token(private_pem, claims, headers=None):
    return jwt.encode(
        claims,
        private_pem,
        algorithm="RS256",
        headers=headers or {"kid": "test-key"},
    )


def test_flag_off_rejects(rsa_pair):
    private_pem, _ = rsa_pair
    org = str(uuid4())
    token = _token(
        private_pem,
        {
            "sub": "kc-1",
            "org_id": org,
            "principal": "terminal",
            "iss": "https://idp.example/realms/test",
            "aud": "tawala-api",
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()),
        },
    )
    with patch.object(hs, "settings", _settings(auth_hard_session_v2=False)):
        with pytest.raises(HardSessionError) as ei:
            hs.verify_hard_session_token(token)


def test_valid_token(rsa_pair):
    private_pem, public_pem = rsa_pair
    org = uuid4()
    claims = {
        "sub": "kc-sub-1",
        "org_id": str(org),
        "principal": "owner",
        "email": "owner@example.com",
        "iss": "https://idp.example/realms/test",
        "aud": "tawala-api",
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
    }
    token = _token(private_pem, claims)

    class FakeKey:
        key = jwt.algorithms.RSAAlgorithm.from_jwk(
            # use cryptography public key via jwt
            __import__("json").dumps(
                {
                    "kty": "RSA",
                    "kid": "test-key",
                    "use": "sig",
                    "n": "x",
                    "e": "AQAB",
                }
            )
        )

    # Simpler: patch jwt.decode path by mocking get_signing_key_from_jwt to return key object with .key = private's public
    from cryptography.hazmat.primitives.serialization import load_pem_private_key

    priv = load_pem_private_key(private_pem, password=None)
    pub = priv.public_key()

    fake_signing = MagicMock()
    fake_signing.key = pub

    fake_client = MagicMock()
    fake_client.get_signing_key_from_jwt.return_value = fake_signing

    with patch.object(hs, "settings", _settings()):
        with patch.object(hs, "_jwks_client", return_value=fake_client):
            principal = hs.verify_hard_session_token(token)
    assert principal.org_id == org
    assert principal.principal == "owner"
    assert principal.sub == "kc-sub-1"
    assert principal.email == "owner@example.com"


def test_wrong_audience(rsa_pair):
    private_pem, _ = rsa_pair
    org = str(uuid4())
    token = _token(
        private_pem,
        {
            "sub": "kc-1",
            "org_id": org,
            "principal": "terminal",
            "iss": "https://idp.example/realms/test",
            "aud": "other-api",
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()),
        },
    )
    from cryptography.hazmat.primitives.serialization import load_pem_private_key

    pub = load_pem_private_key(private_pem, password=None).public_key()
    fake_signing = MagicMock()
    fake_signing.key = pub
    fake_client = MagicMock()
    fake_client.get_signing_key_from_jwt.return_value = fake_signing

    with patch.object(hs, "settings", _settings()):
        with patch.object(hs, "_jwks_client", return_value=fake_client):
            with pytest.raises(HardSessionError) as ei:
                hs.verify_hard_session_token(token)


def test_expired(rsa_pair):
    private_pem, _ = rsa_pair
    org = str(uuid4())
    token = _token(
        private_pem,
        {
            "sub": "kc-1",
            "org_id": org,
            "principal": "terminal",
            "iss": "https://idp.example/realms/test",
            "aud": "tawala-api",
            "exp": int(time.time()) - 100,
            "iat": int(time.time()) - 200,
        },
    )
    from cryptography.hazmat.primitives.serialization import load_pem_private_key

    pub = load_pem_private_key(private_pem, password=None).public_key()
    fake_signing = MagicMock()
    fake_signing.key = pub
    fake_client = MagicMock()
    fake_client.get_signing_key_from_jwt.return_value = fake_signing

    with patch.object(hs, "settings", _settings(auth_hard_leeway_sec=0)):
        with patch.object(hs, "_jwks_client", return_value=fake_client):
            with pytest.raises(HardSessionError) as ei:
                hs.verify_hard_session_token(token)


def test_missing_org_id(rsa_pair):
    private_pem, _ = rsa_pair
    token = _token(
        private_pem,
        {
            "sub": "kc-1",
            "principal": "terminal",
            "iss": "https://idp.example/realms/test",
            "aud": "tawala-api",
            "exp": int(time.time()) + 3600,
            "iat": int(time.time()),
        },
    )
    from cryptography.hazmat.primitives.serialization import load_pem_private_key

    pub = load_pem_private_key(private_pem, password=None).public_key()
    fake_signing = MagicMock()
    fake_signing.key = pub
    fake_client = MagicMock()
    fake_client.get_signing_key_from_jwt.return_value = fake_signing

    with patch.object(hs, "settings", _settings()):
        with patch.object(hs, "_jwks_client", return_value=fake_client):
            with pytest.raises(HardSessionError) as ei:
                hs.verify_hard_session_token(token)
