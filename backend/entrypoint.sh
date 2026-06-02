#!/bin/bash
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Starting Application..."
exec fastapi run --host 0.0.0.0 --port 8000
