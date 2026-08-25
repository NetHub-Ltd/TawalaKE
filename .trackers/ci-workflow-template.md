# CI Workflow Reference

**Live file:** `.github/workflows/test_backend.yml` (merged via PR #97)

Historical template content is superseded by the live workflow. Key behaviors:
- Triggers on push/PR paths under `backend/**` and the workflow file itself
- Python 3.12, install `requirements.txt` + pytest tooling
- Env uses `REDIS_URL=memory://` for isolated unit tests
- `pytest testing/ -v --cov=app --cov-fail-under=60`

Edit the live workflow under `.github/workflows/test_backend.yml` for future CI changes.
