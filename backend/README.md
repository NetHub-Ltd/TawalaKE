# Tawala Core backend

**Branch:** `core/v2` only · **Image:** `tawala-core` (never `tawala-api`)

Full documentation lives at the **repository root** [`README.md`](../README.md) and under [`docs/architecture/`](../docs/architecture/).

## Quick start

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

export ENVIRONMENT=development LOG_LEVEL=DEBUG
export DB_HOST=localhost DB_PORT=5432 DB_USER=core_user DB_PASSWORD= DB_NAME=tawala_core

alembic upgrade head
uvicorn app.main:app --reload --port 8000
pytest -q
```

## Docker

```bash
# from repo root (preferred for CI parity)
docker build -t tawala-core:local -f backend/Dockerfile backend
```

Credentials only (`DB_*`). See root README §5–§7.

## Isolation

See [`MERGE_POLICY.md`](../MERGE_POLICY.md). Do not merge into `main` or `dev`.
