# Task Tracker

**Branch:** `feat/tenant-api-rbac-audit`  
**Base:** `dev`

## Goal
Hard tenant API RBAC (OWNER/ADMIN/MANAGER/CASHIER) + audit who/what/when; existing staff not locked out of POS.

## Completed
- [x] `app/core/rbac.py` permission matrix
- [x] `app/api/rbac_deps.py` require_permissions + business access helpers + Redis cache
- [x] `get_current_staff` includes ADMIN
- [x] Audit model + migration + service
- [x] Wire sales new-sale/checkout/list, org write/billing helper, products CRUD/list
- [x] Matrix unit tests
- [x] docs/rbac-tenant.md

## Remaining
- [ ] CI pytest on PR
- [ ] Optional: purge RBAC cache on staff role mutation endpoints (when those paths write roles)

## Verification
- Cashier retains sales:write + catalog:read
- Owner retains org:billing
- Admin not globally 403; no org:billing
