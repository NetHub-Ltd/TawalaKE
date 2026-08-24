# Rollback State

**Previous Known-Good Commit:** b07d68a055666aae258eb5581930611db99e4c4d
**Previous Release/Tag:** v0.0.36
**Previous Image/Version:** ghcr.io/NetHub-Ltd/tawala-api:v0.0.36
**Branch:** main

## Rollback Procedure
1. Revert to commit `b07d68a05566` via `git checkout b07d68a055666aae258eb5581930611db99e4c4d` or `git revert <bad-commit>`
2. If container deployment: redeploy previous image tag `v0.0.36` from GHCR
3. Database: Alembic migrations are forward-only; rollback requires downgrading via `alembic downgrade <revision>`

## Migration Considerations
- 46 Alembic migration files exist
- Migrations are additive; no destructive changes observed in recent history
- Rollback would require downgrading to previous migration revision

## Data Rollback Considerations
- PostgreSQL is the primary data store
- Redis is used for caching and rate limiting (ephemeral)
- Celery tasks may have in-flight jobs during rollback

## Irreversible Operations
- None identified yet for current state

## Recovery Notes
- CI builds images on every push to `main` and on tags
- Images are multi-platform (amd64 + arm64)
- No production deployment config found in repo (deployment likely external)
