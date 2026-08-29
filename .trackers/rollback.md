# Rollback

## Known-good references

| Ref | SHA / note |
|-----|------------|
| **dev tip before this branch** | `4d6554d` (Merge #134) |
| **This branch** | `fix/stock-workspace-quick-actions-500` |

## If this PR must be undone

```bash
git checkout dev
git pull
git revert <merge-or-commit-sha>   # prefer revert over reset once shared
git push origin dev
```

## Scope of change

- Frontend only: `stockProxy.ts`, `ProductWorkspace.tsx`, trackers.
- No Alembic, schema, or data migrations.
- No backend route signature changes.

## Recovery notes

- Backend stock mutations remain on `/api/v1/stock/*` with JSON snapshot responses.
- Frontend CI: `.github/workflows/test_frontend.yml` (on `dev`)
