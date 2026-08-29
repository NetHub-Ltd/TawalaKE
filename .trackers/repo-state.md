# Repository State

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Default branch:** `main`  
**Integration / working branch:** `dev` (all PRs open against `dev`)  
**Current tip on dev (pre this branch):** `4d6554d` — Merge pull request #134 from NetHub-Ltd/fix/stock-mutation-response-and-settings  

## Status

- Recent stock work on `dev`: dedicated `/stock` router, mutation JSON snapshots (#133/#134), workspace UX.
- This branch addresses remaining client/proxy gap: stock BFF URL construction + settings field set.

## Structure

- `backend/` — FastAPI, Alembic, pytest, uv
- `frontend/` — Next.js 16 + Turbopack
- `.skills/` — agent skill set
- `.trackers/` — Engineer Mode continuity
- `.github/workflows/` — CI (backend + frontend)

## Deployment note

- Preferred target: k3s
- Current path: multi-arch Docker → GHCR (`tawala-api`) via GHA; no k3s manifests in-repo yet
