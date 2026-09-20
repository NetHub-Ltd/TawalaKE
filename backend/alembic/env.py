"""Alembic environment for Tawala Core — SQLModel is the schema source of truth.

Migrations must stay aligned with ``SQLModel.metadata`` (all models imported via
``app.models``). Prefer:

    alembic revision --autogenerate -m "..."

over hand-written ``sa.Column`` tables when adding new SQLModel entities.
Existing revisions remain as historical DDL; new work should autogenerate from
SQLModel and then be reviewed.
"""

from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlmodel import SQLModel

from app.core_platform.shared.settings import get_settings
from app import models  # noqa: F401  — register all SQLModel tables on metadata

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# SQLModel metadata is the single schema contract for Core.
target_metadata = SQLModel.metadata

settings = get_settings()
if settings.database_url:
    config.set_main_option("sqlalchemy.url", settings.database_url)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    url = config.get_main_option("sqlalchemy.url")
    if not url or url.startswith("driver://"):
        raise RuntimeError(
            "Set DATABASE_URL (postgresql+asyncpg://...) before running "
            "alembic upgrade. SQLModel models are the schema source of truth."
        )
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
