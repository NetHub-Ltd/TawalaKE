#!/usr/bin/env sh
# 1) alembic upgrade head (sync driver)
# 2) uvicorn (async driver via app settings)
set -eu

cd "$(dirname "$0")"

# Prefer explicit URLs; otherwise require DB_* credentials.
if [ -z "${DATABASE_URL:-}" ] && [ -z "${DB_HOST:-}" ]; then
  echo "ERROR: Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME (and optional DB_PORT)" >&2
  echo "       or DATABASE_URL (+ optional DATABASE_URL_SYNC)." >&2
  exit 1
fi

echo "Running alembic upgrade head..."
alembic upgrade head

echo "Starting FastAPI..."
exec uvicorn app.main:app --host "${HOST:-0.0.0.0}" --port "${PORT:-8000}"
