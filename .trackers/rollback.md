# Rollback

**Branch:** `feat/seo-marketing-readiness`  
**Base:** `main` @ `d0c29ae`

## How to recover
- Revert the PR or delete the topic branch.
- Or restore these paths from `main`:
  - `frontend/src/app/(public)/page.tsx`
  - `frontend/src/app/sitemap.ts`
  - Remove added dirs: `solutions/{retail,pharmacy,hardware,wholesale}`, `blog/`, `support/layout.tsx`

## Notes
- No database or migration changes.
- No production config or Docker changes.
- Pure frontend/static content; revert is sufficient.
