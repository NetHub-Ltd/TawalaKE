# Repository State — Core V2

- **Branch:** `core/v2` (protected product isolation — never merge to main/dev)
- **Image:** `tawala-core` only (Python 3.13)
- **Last hygiene update:** 2026-09-22
- **Recent HEAD theme:** credentials-only DB + loguru + lifespan gate (PR #287)

## Milestone status
| Gate | Status |
|------|--------|
| T1–T11 | **Done** (merged); board issues #267–#274 closed 2026-09-22 |
| T12 Reporting | **PR #288** open |
| T13 Cross-domain certification | **Open** (#276) |

## Conventions
- PRs target **`core/v2` only**
- DB: `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` (no full DATABASE_URL)
- SQLModel AsyncSession + `exec`; Alembic sync only
- Close board issues on merge (`Closes #n` in PR body)
