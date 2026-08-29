# Task Tracker

**Base / PR target:** `dev`  
**Branch:** `fix/stock-workspace-quick-actions-500`

## Goal

Fix stock workspace quick actions showing HTTP 500 in the UI while backend already committed the movement (history updates). Align stock BFF with `backendUrl`. Settings form: remove selling price, SKU, and on-hand stock fields.

## Completed

- [x] `frontend/src/lib/api/stockProxy.ts` — use `backendUrl()` for POST/GET; harden failure detection; safe empty-body handling
- [x] `ProductWorkspace.postStock` / `loadMovements` — `data?.status === false` only; null-safe JSON parse
- [x] Settings form — removed selling price, SKU, on-hand; kept name, category, cost, UOM, low-stock threshold, track, active
- [x] Copy updates for settings intro and page header

## Out of scope

- Restoring missing `product_response` on deprecated store routes
- Migrating every remaining raw `BACKEND_URL` concat in the repo
- k3s manifests

## Verification

- Manual: Receive / Count / Adjust → success banner, metrics refresh, History row, no 500
- Settings: price/SKU/on-hand absent; remaining fields save
- Path construction works whether `BACKEND_URL` includes `/api/v1` or not
