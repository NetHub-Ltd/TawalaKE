"""Path A opaque session store (Redis).

Sessions are random ids only — no JWT crypto. Principal ids are product domain
PKs (PlatformUser.id / Staff.id) so FKs never need rewriting.
"""
from __future__ import annotations

import json
import secrets
from dataclasses import asdict, dataclass
from typing import Any, Literal, Optional
from uuid import UUID

from redis.asyncio import Redis as AsyncRedis

from app.core.config import settings
from app.utils.helpers import utc_now
from app.utils.logging import logger

PrincipalKind = Literal["platform", "staff"]
AuthSource = Literal["nethub", "legacy"]

SESSION_KEY_PREFIX = "tawala:opaque_session:"


@dataclass
class OpaqueSession:
    auth_source: AuthSource
    principal_kind: PrincipalKind
    principal_id: str  # UUID string — PlatformUser.id or Staff.id
    role: str
    exp: int  # unix
    iat: int  # unix
    nethub_user_id: Optional[str] = None
    org_id: Optional[str] = None  # staff only
    email: Optional[str] = None
    sub: Optional[str] = None

    def to_json(self) -> str:
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, raw: str | bytes) -> "OpaqueSession":
        if isinstance(raw, bytes):
            raw = raw.decode()
        data: dict[str, Any] = json.loads(raw)
        return cls(
            auth_source=data["auth_source"],
            principal_kind=data["principal_kind"],
            principal_id=str(data["principal_id"]),
            role=str(data["role"]),
            exp=int(data["exp"]),
            iat=int(data["iat"]),
            nethub_user_id=(str(data["nethub_user_id"]) if data.get("nethub_user_id") else None),
            org_id=(str(data["org_id"]) if data.get("org_id") else None),
            email=(str(data["email"]) if data.get("email") else None),
            sub=(str(data["sub"]) if data.get("sub") else None),
        )

    @property
    def principal_uuid(self) -> UUID:
        return UUID(self.principal_id)

    def is_expired(self) -> bool:
        return int(utc_now().timestamp()) >= self.exp


def opaque_session_enabled() -> bool:
    return bool(getattr(settings, "auth_opaque_session_v1", False))


def _key(session_id: str) -> str:
    return f"{SESSION_KEY_PREFIX}{session_id}"


def new_session_id() -> str:
    return secrets.token_urlsafe(32)


def build_session(
    *,
    auth_source: AuthSource,
    principal_kind: PrincipalKind,
    principal_id: UUID | str,
    role: str,
    ttl_sec: Optional[int] = None,
    nethub_user_id: Optional[UUID | str] = None,
    org_id: Optional[UUID | str] = None,
    email: Optional[str] = None,
    sub: Optional[str] = None,
) -> tuple[str, OpaqueSession]:
    ttl = int(ttl_sec if ttl_sec is not None else settings.auth_opaque_session_ttl_sec)
    now = int(utc_now().timestamp())
    session = OpaqueSession(
        auth_source=auth_source,
        principal_kind=principal_kind,
        principal_id=str(principal_id),
        role=str(role),
        exp=now + max(60, ttl),
        iat=now,
        nethub_user_id=str(nethub_user_id) if nethub_user_id else None,
        org_id=str(org_id) if org_id else None,
        email=email,
        sub=sub,
    )
    return new_session_id(), session


async def save_session(
    redis: AsyncRedis,
    session_id: str,
    session: OpaqueSession,
) -> None:
    ttl = max(60, session.exp - int(utc_now().timestamp()))
    await redis.set(_key(session_id), session.to_json(), ex=ttl)


async def load_session(
    redis: AsyncRedis,
    session_id: str,
) -> Optional[OpaqueSession]:
    if not session_id:
        return None
    try:
        raw = await redis.get(_key(session_id))
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"opaque session redis get failed: {exc}")
        return None
    if not raw:
        return None
    try:
        session = OpaqueSession.from_json(raw)
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"opaque session corrupt: {exc}")
        return None
    if session.is_expired():
        await delete_session(redis, session_id)
        return None
    return session


async def delete_session(redis: AsyncRedis, session_id: str) -> None:
    if not session_id:
        return
    try:
        await redis.delete(_key(session_id))
    except Exception as exc:  # noqa: BLE001
        logger.warning(f"opaque session delete failed: {exc}")
