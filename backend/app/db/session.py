"""Async database engine, session factory, and RLS session context.

When Settings.database_url is unset (development only), the engine is not
created and get_session raises so protected paths fail closed.

RLS: after authentication, call set_tenant_guc(session, business_id) so
PostgreSQL policies on business_id columns can enforce isolation as
defense-in-depth (M12). See docs/architecture/CORE_CONTRACTS.md.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlmodel import SQLModel

from app.core_platform.shared.settings import get_settings

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine | None:
    """Return the process-wide async engine, creating it if configured."""
    global _engine, _session_factory
    settings = get_settings()
    if not settings.database_url:
        return None
    if _engine is None:
        _engine = create_async_engine(
            settings.database_url,
            pool_pre_ping=settings.database_pool_pre_ping,
            echo=False,
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
    """Test helper: drop cached engine after DATABASE_URL changes."""
    global _engine, _session_factory
    _engine = None
    _session_factory = None


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: yield an async session or raise if DB is not configured."""
    factory = get_session_factory()
    if factory is None:
        raise RuntimeError(
            "Database is not configured. Set DATABASE_URL "
            "(e.g. postgresql+asyncpg://user:pass@host/db)."
        )
    async with factory() as session:
        yield session


async def set_tenant_guc(
    session: AsyncSession, business_id: UUID | None, *, bypass: bool = False
) -> None:
    """Set transaction-local GUCs used by RLS policies.

    - app.current_business_id: tenant key for policies
    - app.rls_bypass: when 'on', policies allow all (seed/migration only)
    """
    settings = get_settings()
    if not settings.rls_enabled:
        return
    if bypass:
        await session.execute(text("SELECT set_config('app.rls_bypass', 'on', true)"))
        await session.execute(text("SELECT set_config('app.current_business_id', '', true)"))
        return
    await session.execute(text("SELECT set_config('app.rls_bypass', 'off', true)"))
    if business_id is None:
        await session.execute(text("SELECT set_config('app.current_business_id', '', true)"))
    else:
        await session.execute(
            text("SELECT set_config('app.current_business_id', :bid, true)"),
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
