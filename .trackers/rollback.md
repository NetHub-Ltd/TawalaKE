# Rollback

**Previous known-good:** `dev` @ `8b4b7e5` (post PR #146)

## Procedure
```bash
git checkout dev && git pull
git revert <merge-or-commit-sha-of-this-PR>
```
Or close/unmerge the PR before merge.

## Notes
- No database migrations
- No image/tag changes required for rollback
- Frontend-only layout/navigation change
