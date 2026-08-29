# Task Tracker

**Base / PR target:** `dev`  
**Branch:** `fix/stock-direct-proxy-and-backend-root-cause`

## Goal

Eliminate stock quick-action 500s. Evidence: upstream `https://omnipos-c9u5.onrender.com/api/v1/stock/receive` returns 500 `{status:false, message:'Internal Server Error'}` while history still updates (commit succeeded; failure is post-commit / teardown / unhandled).

## Completed

- [x] BFF: receive/count/adjust call backend **directly** (no stockProxy); pass through status + body; log upstream
- [x] CRUD: audit uses `independent=True` (own session) so it cannot dirty the request session after commit
- [x] CRUD: refresh-after-commit is best-effort (never fails the request)
- [x] Session dep: rollback leftover uncommitted work on teardown
- [x] Stock routes: catch unexpected errors and return real `message`
- [x] Global exception handler: log traceback; non-prod returns real exception string

## Deploy note

Redeploy **backend (Render)** and **frontend**. After deploy, if anything still fails the UI/network body will show the **real exception string** (not generic Internal Server Error).
