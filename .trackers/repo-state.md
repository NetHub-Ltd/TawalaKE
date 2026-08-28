# Repository State

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Default branch:** `main`  
**Integration branch:** `dev` (ahead of `main`; PR #114 prepares `dev` → `main`)  
**Current branch:** `dev`  
**Status:** Tracker conflicts with `main` resolved; PR #114 pending merge when checks are green  

## Recent history (on `dev`, pending full land on `main` via #114)

- PR #117: `fix/sales-history-relations-and-ui` — sale list/detail relations + UI  
- PR #116: `fix/credit-sale-tracking-and-invoice` — credit walk-out + invoice for collection  
- Billing: cohesive plan limits/features (Basic / Ndovu / Enterprise) for paywall  
- PR #115 on `main`: sync trackers + `.skills/` (merged into this `dev` line)  
- PR #110 on `main`: Turbopack builds (prior known-good on `main` tip before #114)

## Structure

- `backend/` — FastAPI, Alembic, pytest, uv  
- `frontend/` — Next.js 16 + Turbopack  
- `.skills/` — agent skill set (from main sync)  
- `.trackers/` — Engineer Mode continuity  
- `.github/workflows/` — CI  

## Observations

- After PR #114 merges to `main`, update this file to the merge commit SHA and clear “pending”.  
- No separate topic branch is required for the #114 conflict resolution itself.
