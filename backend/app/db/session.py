"""Async database engine and session factory (SPEC / milestone M3).

When ``Settings.database_url`` is unset, the engine is not created and
``get_session`` raises so protected paths fail closed rather than silently
using a missing database.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

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
            pool_pre_ping=True,
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
