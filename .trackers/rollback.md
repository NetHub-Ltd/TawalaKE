# Rollback

## Known-good references

| Ref | SHA / note |
|-----|------------|
| **dev tip before this chore** | `e153d7d` (or parent of this branch) |
| **main tip (post #114)** | `faa51fb` |

## If this skills PR must be undone

```bash
git checkout dev
git pull
git revert <this-chore-commit-sha>   # prefer revert over reset once shared
git push origin dev
```

## If a later promotion of current `dev` to `main` must be undone

Prefer `git revert -m 1 <merge-commit-sha>` on `main` (keeps history).  
Product commits (RBAC, billing, sales, etc.) have their own PR-level rollback notes; this file does not replace those.

## Migration / data

- This chore is **tracker-only**. No Alembic, schema, or data changes.

## Recovery notes

- Backend: Dockerized (`backend/Dockerfile`), image `tawala-api` on GHCR
- Frontend: Next.js 16 + Turbopack
- CI: `.github/workflows/test_backend.yml`, `test_frontend.yml` (on `dev`)
- Preferred deploy target: k3s (manifests not yet in repo)
