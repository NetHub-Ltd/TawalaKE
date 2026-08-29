# Rollback

## Known-good references

| Ref | SHA | Notes |
|-----|-----|--------|
| **main tip (post #114)** | `faa51fb` | Merge of PR #114 — current production-line tip |
| **dev tip (pre this chore)** | `e153d7d` | Includes RBAC + frontend CI; base for this tracker PR |
| **main before #114** | prior to `faa51fb` (e.g. `e8ffd4a` / PR #115 line) | Use only if reverting the entire #114 integration |

## If this tracker-sync PR must be undone

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
