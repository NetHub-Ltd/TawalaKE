#!/usr/bin/env bash
# Internal document + future task workers. No public HTTP auth.
set -euo pipefail
cd "$(dirname "$0")/.."
exec celery -A app.core.celery_app.celery_app worker \
  --loglevel=INFO \
  -Q tawala.documents,tawala.default \
  --concurrency="${CELERY_CONCURRENCY:-2}"
