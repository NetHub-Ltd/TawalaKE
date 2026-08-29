# Repository State

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Default branch:** `main`  
**Integration / working branch:** `dev` (all PRs open against `dev`)  
**Current tip on main:** `faa51fb` — Merge pull request #114 from NetHub-Ltd/dev  
**Current tip on dev:** `e153d7d` — Merge branch 'main' into dev  

## Status

- PR #114 has landed on `main`.
- `dev` is strictly ahead of `main` (no commits on main missing from dev).
- Trackers synchronized to post-#114 reality (this chore).

## Recent history (landed)

**On main (via #114 and earlier):**
- PR #114 — billing plan limits/features, credit-sale + invoice, sales-history relations/UI, prior tracker sync
- PR #115 — trackers + `.skills/`
- PR #110 — Turbopack builds

**On dev only (not yet on main):**
- PR #119 — tenant API RBAC permissions matrix, hard deps, audit log
- PR #120 — frontend 1:1 permissions + staff management suite
- PR #121 — Sidebar RBAC import fix + frontend CI (lint + build gate)
- Follow-ups: ESLint/TS cleanups, Node heap for Next build, merge main → dev

## Structure

- `backend/` — FastAPI, Alembic, pytest, uv
- `frontend/` — Next.js 16 + Turbopack
- `.skills/` — agent skill set
- `.trackers/` — Engineer Mode continuity
- `.github/workflows/` — CI (backend + frontend)

## Deployment note

- Preferred target: k3s
- Current path: multi-arch Docker → GHCR (`tawala-api`) via GHA; no k3s manifests in-repo yet

## Observations

- Open remote topic branches still present (historical): `fix/checkout-invoice-*`, `fix/product-inventory-integrity` — review/close separately if desired.
- Next product or infra work should start from updated `dev` after this tracker PR merges.
