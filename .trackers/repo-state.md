# Repository State

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Default branch:** `main`  
**Integration / working branch:** `dev` (all PRs open against `dev`)  
**Current tip on main:** `faa51fb` — Merge pull request #114 from NetHub-Ltd/dev  
**Base for this work:** `dev` @ `e153d7d` (or later if updated)

## Status

- PR #114 has landed on `main`.
- `dev` is strictly ahead of `main` (RBAC + frontend CI and related).
- Active chore: three-domain skills restructure + UI baseline skill (`chore/skills-ui-baseline`).

## Structure

- `backend/` — FastAPI, Alembic, pytest, uv
- `frontend/` — Next.js 16 + Turbopack
- `.skills/` — **three domains:** product, backend, ui (+ protocol + index)
- `.trackers/` — Engineer Mode continuity
- `.github/workflows/` — CI

## Deployment note

- Preferred target: k3s
- Current path: multi-arch Docker → GHCR (`tawala-api`) via GHA; no k3s manifests in-repo yet
