# Repository State — Core V2

- **Branch:** `core/v2`
- **Forked from:** `main` @ `79f91d5` (Merge PR #218)
- **Clean-slate commit:** product tree removed (backend, frontend, media, product docs/skills)
- **Isolation:** Non-mergeable into `main` / `dev` (see `MERGE_POLICY.md`)
- **Frontend:** None (by design)
- **Current focus:** Core architecture blueprint (`TAWALA_CORE_DESIGN.md`)
- **Last updated:** 2026-09-19

## Important observations

- Product continues solely on `main` / `dev`.
- This branch does not share application models with the product.
- CI merge-guard workflow blocks PRs from `core/**` → `main`/`dev` when present.
