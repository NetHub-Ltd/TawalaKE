# Rollback

**Current known-good commit:** `2bb678e04aa2b389c4a716ead237c199ca05e506`
**Current branch:** `main`

## Rollback Procedure
If the next production-impacting change needs reversal:
```bash
git revert <merge-commit-sha>
# Or for a topic branch PR:
git revert -m 1 <merge-commit-sha>
```

## Previous Known-Good States
- `2bb678e` — PR #110 merged (Turbopack builds)
- `ef7cbf5` — PR #109 merged (Checkout invoice fix)
- `ad1ecb1` — PR #97 merged (Backend test coverage)

## Migration / Data Considerations
- No pending migrations at this state.
- Check `backend/alembic/versions/` before any rollback that touches DB schema.

## Irreversible Operations
- None known at this state.

## Recovery Notes
- Backend: Dockerized with `backend/Dockerfile` and `entrypoint.sh`
- Frontend: Next.js 16 with Turbopack (`next dev --turbopack`, `next build --turbopack`)
- CI: `.github/workflows/test_backend.yml` runs pytest with `REDIS_URL=memory://`
