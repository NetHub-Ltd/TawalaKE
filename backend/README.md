# Tawala Core backend

**Branch:** `core/v2` only  
**Image name:** `tawala-core` (never `tawala-api`)

Implements the platform foundation defined in:

- `docs/architecture/TAWALA_CORE_DEVELOPMENT_SPEC.md`
- `docs/architecture/TAWALA_CORE_DESIGN.md`

## Local run (skeleton)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
curl http://127.0.0.1:8000/health
```

## Tests

```bash
pytest
```

## Docker

```bash
docker build -t tawala-core:local .
docker run --rm -p 8000:8000 tawala-core:local
```

## Isolation

See repository root `MERGE_POLICY.md`. Do not merge this branch into `main` or `dev`.
