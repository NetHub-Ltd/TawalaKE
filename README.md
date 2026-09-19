# Tawala Core V2

**Branch:** `core/v2`  
**Isolation:** Never merge into `main` or `dev` — see `MERGE_POLICY.md`

## Spec (accepted)

- `docs/architecture/TAWALA_CORE_DEVELOPMENT_SPEC.md` — models, endpoints, CI, sequence
- `docs/architecture/TAWALA_CORE_DESIGN.md` — conceptual Core
- `docs/architecture/V2_CORE_MILESTONES.md` — board

## Backend (M1+)

```bash
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --port 8000
curl http://127.0.0.1:8000/health
pytest
```

Image name: **`tawala-core`** only (not product `tawala-api`).

## No frontend

Core has no UI on this branch by design.
