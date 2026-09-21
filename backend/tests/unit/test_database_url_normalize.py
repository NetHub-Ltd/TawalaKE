"""DATABASE_URL normalization (Render postgres:// → SQLAlchemy drivers)."""

from __future__ import annotations

from app.core_platform.shared.settings import Settings, clear_settings_cache


def test_postgres_scheme_becomes_asyncpg_and_psycopg(monkeypatch):
    clear_settings_cache()
    monkeypatch.setenv("DATABASE_URL", "postgres://user:pass@host:5432/db")
    monkeypatch.delenv("DATABASE_URL_SYNC", raising=False)
    monkeypatch.delenv("DB_HOST", raising=False)
    s = Settings()
    assert s.database_url is not None
    assert s.database_url.startswith("postgresql+asyncpg://")
    assert s.database_url_sync is not None
    assert s.database_url_sync.startswith("postgresql+psycopg://")
    assert "postgres://" not in s.database_url
    assert "postgres://" not in s.database_url_sync
    clear_settings_cache()


def test_postgresql_url_gets_drivers(monkeypatch):
    clear_settings_cache()
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@host/db")
    monkeypatch.delenv("DATABASE_URL_SYNC", raising=False)
    s = Settings()
    assert s.database_url.startswith("postgresql+asyncpg://")
    assert s.database_url_sync.startswith("postgresql+psycopg://")
    clear_settings_cache()
