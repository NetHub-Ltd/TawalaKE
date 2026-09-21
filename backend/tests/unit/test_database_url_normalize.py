"""DB URLs are built from credentials only (asyncpg + psycopg)."""

from __future__ import annotations

import pytest

from app.core_platform.shared.settings import Settings, clear_settings_cache


def test_urls_from_credentials(monkeypatch):
    clear_settings_cache()
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("DB_HOST", "db.example")
    monkeypatch.setenv("DB_PORT", "5433")
    monkeypatch.setenv("DB_USER", "u/ser")
    monkeypatch.setenv("DB_PASSWORD", "p@ss")
    monkeypatch.setenv("DB_NAME", "core")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    s = Settings()
    assert s.database_url.startswith("postgresql+asyncpg://")
    assert s.database_url_sync.startswith("postgresql+psycopg://")
    assert "db.example:5433/core" in s.database_url
    assert "u%2Fser" in s.database_url  # quote_plus
    assert "p%40ss" in s.database_url
    clear_settings_cache()


def test_missing_creds_in_test_env(monkeypatch):
    clear_settings_cache()
    monkeypatch.setenv("ENVIRONMENT", "test")
    monkeypatch.delenv("DB_HOST", raising=False)
    monkeypatch.delenv("DB_USER", raising=False)
    monkeypatch.delenv("DB_PASSWORD", raising=False)
    monkeypatch.delenv("DB_NAME", raising=False)
    with pytest.raises(RuntimeError, match="DB_HOST"):
        Settings()
    clear_settings_cache()
