#!/bin/bash
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Starting Gunicorn..."
# main:app is correct because main.py is in the WORKDIR (/app)
# app.lib imports will work because the 'app' folder is also in /app
exec gunicorn -w 2 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000 --timeout 120
