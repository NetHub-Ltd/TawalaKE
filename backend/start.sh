#!/usr/bin/env sh
# Tawala Core process entrypoint:
# 1) apply Alembic migrations (alembic upgrade head)
# 2) start the FastAPI app
set -eu

cd "$(dirname "$0")"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is required (postgresql+asyncpg://...)" >&2
  exit 1
fi

echo "Running alembic upgrade head..."
alembic upgrade head

echo "Starting FastAPI (uvicorn app.main:app)..."
exec uvicorn app.main:app --host "${HOST:-0.0.0.0}" --port "${PORT:-8000}"
