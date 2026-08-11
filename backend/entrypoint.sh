#!/bin/bash
set -e

echo "Running database migrations..."
uv run alembic upgrade head

echo "Starting Application..."
exec uv run fastapi run --host 0.0.0.0 --port 8000