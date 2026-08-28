# Rollback

**Previous known-good on `main` (before PR #114):** `2bb678e` (merge of PR #110 — Turbopack)  
**Also on `main`:** `e8ffd4a` (PR #115 — trackers + `.skills/`)  

## If PR #114 is merged and must be undone

```bash
# Prefer revert of the merge commit on main (keeps history)
git checkout main
git pull
git revert -m 1 <pr-114-merge-commit-sha>
git push origin main
```

## If only this conflict-resolution commit on `dev` must be undone

```bash
git checkout dev
git revert <merge-main-into-dev-commit-sha>
# or reset only if the merge commit has not been shared widely — prefer revert
git push origin dev
```

## Migration / data

- This conflict-resolution change is **tracker-only** (no Alembic, no schema).  
- Product commits already on `dev` (billing, credit sales, sales-history) have their own rollback notes from those PRs.

## Recovery notes

- Backend: Dockerized (`backend/Dockerfile`)  
- Frontend: Next.js 16 + Turbopack  
- CI: `.github/workflows/test_backend.yml`  
