"""Application settings for Tawala Core.

Uses pydantic_settings BaseSettings so required configuration is validated
before the app serves traffic. See docs/architecture/CORE_CONTRACTS.md.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-backed Core settings.

    ``database_url`` must use an async driver, e.g.
    ``postgresql+asyncpg://user:pass@localhost:5432/tawala_core``.

    In ``test`` and ``production`` environments ``database_url`` is required.
    ``development`` may omit it only for pure unit/docs work; protected routes
    still fail closed via ``get_session``.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "tawala-core"
    environment: Literal["development", "test", "production"] = Field(
        default="development",
        description="Runtime environment; drives required-variable checks.",
    )
    database_url: str | None = Field(
        default=None,
        description="Async SQLAlchemy URL (postgresql+asyncpg://...).",
    )
    # Optional knobs used by CI / ops
    database_pool_pre_ping: bool = True
    rls_enabled: bool = Field(
        default=True,
        description="When True, sessions set app.current_business_id for RLS policies.",
    )

    @field_validator("database_url")
    @classmethod
    def _validate_database_url(cls, v: str | None) -> str | None:
        if v is None or not str(v).strip():
            return None
        url = str(v).strip()
        if not url.startswith("postgresql"):
            raise ValueError(
                "database_url must be a PostgreSQL URL "
                "(e.g. postgresql+asyncpg://user:pass@host:5432/db)"
            )
        return url

    def require_database_url(self) -> str:
        """Return database_url or raise — use at process start when DB is mandatory."""
        if not self.database_url:
            raise RuntimeError(
                "DATABASE_URL is required for this environment "
                f"(environment={self.environment}). "
                "Example: postgresql+asyncpg://tawala:tawala@localhost:5432/tawala_core"
            )
        return self.database_url


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.environment in ("test", "production"):
        settings.require_database_url()
    return settings


def clear_settings_cache() -> None:
    """Test helper: clear lru_cache after env changes."""
    get_settings.cache_clear()
