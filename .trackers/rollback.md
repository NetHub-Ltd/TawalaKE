# Rollback — Core V2

## Policy
- Never merge `core/**` into `main` or `dev` (see MERGE_POLICY.md)
- Rollback a bad Core change: revert the merge commit on `core/v2` or close the topic PR unmerged

## Current open work
| Item | Rollback |
|------|----------|
| PR #288 T12 Reporting | Close PR without merge; no schema migration in T12 (read-only) |
| Future T13 | Topic branch only until certified |

## Merged (do not casually revert without migration review)
- T7–T11 introduced Alembic revisions under `backend/alembic/versions/`
- Prefer forward fix over revert if migrations already applied in a deployed Core env
