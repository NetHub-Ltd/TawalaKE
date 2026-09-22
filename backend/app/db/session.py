"""Async database engine and SQLModel session factory + RLS helpers.

Infrastructure boundary: ``create_async_engine`` / ``async_sessionmaker`` come from
``sqlalchemy.ext.asyncio`` (no SQLModel equivalent). All application sessions are
``sqlmodel.ext.asyncio.session.AsyncSession``. Prefer ``session.exec(select(...))``
for ORM queries; ``session.execute(text(...))`` is reserved for raw SQL (GUCs).
Alembic remains the only sync DB path.

Credentials (DB_HOST/DB_USER/DB_PASSWORD/DB_NAME) build the async DSN; when they
are unset (development only), the engine is not created and get_session fails closed.

**RLS GUC lifetime:** ``set_tenant_guc`` uses session-level ``set_config(..., false)``
so GUCs survive ``COMMIT`` within the same connection/request. Transaction-local
GUCs (``is_local=true``) reset on every service ``commit()`` and broke multi-step
request isolation. GUCs are cleared when the FastAPI session dependency exits.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core_platform.shared.settings import get_settings

_engine = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine():
    """Return the process-wide async engine, creating it if credentials are set."""
    global _engine, _session_factory
    settings = get_settings()
    if not settings.db_host:
        return None
    if _engine is None:
        _engine = create_async_engine(
            settings.database_url,
            pool_pre_ping=settings.database_pool_pre_ping,
            echo=False,
            poolclass=NullPool,
        )
        _session_factory = async_sessionmaker(
            _engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession] | None:
    get_engine()
    return _session_factory


def reset_engine() -> None:
    """Drop cached engine (tests must call after loop changes)."""
    global _engine, _session_factory
    _engine = None
    _session_factory = None


async def dispose_engine() -> None:
    """Dispose engine connections then clear cache."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None


async def _clear_tenant_guc(session: AsyncSession) -> None:
    """Reset RLS GUCs to safe defaults (no tenant, no bypass)."""
    settings = get_settings()
    if not settings.rls_enabled:
        return
    try:
        await session.execute(text("SELECT set_config('app.rls_bypass', 'off', false)"))
        await session.execute(text("SELECT set_config('app.current_business_id', '', false)"))
    except Exception:
        # Connection may already be closed; ignore on teardown.
        pass


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yield a SQLModel AsyncSession or raise if DB unset."""
    factory = get_session_factory()
    if factory is None:
        raise RuntimeError(
            "Database is not configured. Set DB_HOST, DB_USER, "
            "DB_PASSWORD, DB_NAME (optional DB_PORT)."
        )
    async with factory() as session:
        try:
            yield session
        finally:
            # Request end: clear session-level GUCs so pooled connections (if any)
            # never leak tenant context. NullPool closes connections; still safe.
            await _clear_tenant_guc(session)


async def set_tenant_guc(
    session: AsyncSession, business_id: UUID | None, *, bypass: bool = False
) -> None:
    """Set **session-level** GUCs used by RLS policies.

    Uses ``set_config(name, value, is_local=false)`` so values survive
    ``COMMIT`` inside the same request. Transaction-local GUCs
    (``is_local=true``) reset after every domain-service ``commit()`` and
    caused false cross-tenant visibility mid-request.

    Stores the active tenant on ``session.info['tenant_guc']`` for diagnostics.
    Does **not** call ``session.expire_all()``.
    """
    settings = get_settings()
    if not settings.rls_enabled:
        return
    session.info["tenant_guc"] = {
        "business_id": str(business_id) if business_id else None,
        "bypass": bypass,
    }
    if bypass:
        await session.execute(text("SELECT set_config('app.rls_bypass', 'on', false)"))
        await session.execute(text("SELECT set_config('app.current_business_id', '', false)"))
        return
    await session.execute(text("SELECT set_config('app.rls_bypass', 'off', false)"))
    if business_id is None:
        await session.execute(text("SELECT set_config('app.current_business_id', '', false)"))
    else:
        await session.execute(
            text("SELECT set_config('app.current_business_id', :bid, false)"),
            {"bid": str(business_id)},
        )


async def check_database() -> bool:
    """Return True if a simple connectivity check succeeds."""
    engine = get_engine()
    if engine is None:
        return False
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


metadata = SQLModel.metadata
