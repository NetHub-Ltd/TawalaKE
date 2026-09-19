"""Application settings for Tawala Core (milestone M3)."""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-backed Core settings.

    database_url must use an async driver, e.g.
    postgresql+asyncpg://user:pass@localhost:5432/tawala_core
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "tawala-core"
    database_url: str | None = None
    """Async SQLAlchemy URL. None means DB not configured (skeleton/dev without Postgres)."""


@lru_cache
def get_settings() -> Settings:
    return Settings()
