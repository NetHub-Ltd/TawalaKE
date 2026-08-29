# Task Tracker

**Base / PR target:** `dev`  
**Branch:** `fix/stock-mutation-postcommit-500-v2`

## Goal

Eliminate remaining stock quick-action UI 500s after #135. Backend must never return 500 after a successful stock commit; client must not treat post-success refresh failures as action failures.

## Completed

- [x] `backend/app/api/routes/stock.py` — defensive snapshot/mutation_ok (never raises → always HTTP 200 after write)
- [x] `ProductAuditRequest.notes` — truly optional (was Optional + Field(...))
- [x] `stockProxy` — prefer body.status; log upstream failures; success → browser 200
- [x] `postStock` — success first; refresh/loadMovements non-blocking
- [x] Route unit test for non-datetime last_stock_take + mutation_ok

## Verification

- Receive / Count / Adjust → success banner, History updates, no form 500
- Backend: mutation_ok always 200 after commit
