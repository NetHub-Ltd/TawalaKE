# Task — Core V2

## Goal
Implement Core per accepted DEVELOPMENT_SPEC on core/v2 only.

## Approved scope
- [x] Spec accepted (2026-09-19)
- [x] M1 Backend skeleton (tree, FastAPI health, Dockerfile, pyproject, unit tests)
- [~] M2 Core CI workflow (core-ci.yml present; local lint/test green)
- [ ] M3 DB + Alembic online
- [ ] M4+ domain modules

## Out of scope
- Merge to main/dev
- Frontend
- Product models

## Verification
- pytest: 2 passed (health)
- ruff: clean
