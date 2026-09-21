"""Application settings for Tawala Core.

DB credentials build two URLs:
  - database_url       → postgresql+asyncpg://...  (SQLModel AsyncSession)
  - database_url_sync  → postgresql+psycopg://...  (Alembic)

Render/Heroku-style DATABASE_URL often uses the non-SQLAlchemy scheme
``postgres://`` — that is normalized here so Alembic does not fail with:
  NoSuchModuleError: Can't load plugin: sqlalchemy.dialects:postgres

See docs/architecture/CORE_CONTRACTS.md.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal
from urllib.parse import quote_plus, urlparse, urlunparse

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_postgres_scheme(url: str) -> str:
    """Map postgres:// (and bare postgresql://) to a real SQLAlchemy scheme later."""
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


def _with_driver(url: str, driver: str) -> str:
    """Ensure URL uses postgresql+{driver}:// (asyncpg | psycopg)."""
    url = _normalize_postgres_scheme(url)
    # Strip any existing driver suffix on the scheme
    for prefix in (
        "postgresql+asyncpg://",
        "postgresql+psycopg://",
        "postgresql+psycopg2://",
        "postgresql://",
    ):
        if url.startswith(prefix):
            rest = url[len(prefix) :]
            return f"postgresql+{driver}://{rest}"
    return url


class Settings(BaseSettings):
    """Environment-backed Core settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "tawala-core"
    environment: Literal["development", "test", "production"] = Field(
        default="development",
    )

    # --- DB credentials (preferred) ---
    db_host: str | None = Field(default=None, description="Postgres host")
    db_port: int = Field(default=5432, description="Postgres port")
    db_user: str | None = Field(default=None, description="Postgres user")
    db_password: str | None = Field(default=None, description="Postgres password")
    db_name: str | None = Field(default=None, description="Postgres database name")

    # --- Or explicit URLs (override / CI convenience) ---
    database_url: str | None = Field(
        default=None,
        description="Async URL (postgresql+asyncpg://...). Built from creds if unset.",
    )
    database_url_sync: str | None = Field(
        default=None,
        description="Sync URL for Alembic (postgresql+psycopg://...). Built from creds if unset.",
    )

    database_pool_pre_ping: bool = True
    rls_enabled: bool = True

    @model_validator(mode="after")
    def _build_urls_from_creds(self) -> Settings:
        has_creds = all(
            [self.db_host, self.db_user, self.db_password is not None, self.db_name]
        )
        if has_creds:
            user = quote_plus(self.db_user or "")
            password = quote_plus(self.db_password or "")
            host = self.db_host
            port = self.db_port
            name = self.db_name
            if not self.database_url:
                self.database_url = (
                    f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{name}"
                )
            if not self.database_url_sync:
                self.database_url_sync = (
                    f"postgresql+psycopg://{user}:{password}@{host}:{port}/{name}"
                )

        # Always normalize any provided URLs (Render/Heroku postgres://, etc.)
        if self.database_url:
            self.database_url = _with_driver(self.database_url, "asyncpg")
        if self.database_url_sync:
            self.database_url_sync = _with_driver(self.database_url_sync, "psycopg")
        elif self.database_url:
            # Derive sync from async when only DATABASE_URL is set
            self.database_url_sync = _with_driver(self.database_url, "psycopg")

        return self

    def require_database_url(self) -> str:
        if not self.database_url:
            raise RuntimeError(
                "Database is not configured. Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME "
                "(and optional DB_PORT) or DATABASE_URL "
                f"(environment={self.environment})."
            )
        return self.database_url

    def require_database_url_sync(self) -> str:
        if not self.database_url_sync:
            raise RuntimeError(
                "Sync database URL is not configured. Set DB_* credentials or "
                "DATABASE_URL_SYNC for Alembic."
            )
        return self.database_url_sync


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.environment in ("test", "production"):
        settings.require_database_url()
        settings.require_database_url_sync()
    return settings


def clear_settings_cache() -> None:
    get_settings.cache_clear()
