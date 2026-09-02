# Task Tracker

**Branch:** `fix/stock-tenant-guard-and-permissions-api`  
**Base:** `dev`  
**PR target:** `dev`  
**Tier:** 2

## Goal
Owner can receive stock when product.org is null; honest stock errors; dedicated Redis-cached permissions API (not in session).

## Done
- [x] `_assert_tenant_product` resolves org via business + optional backfill
- [x] stockProxy / ProductWorkspace error passthrough
- [x] `GET /auth/permissions` + Redis cache via `_cached_perm_values`
- [x] BFF `GET /api/v1/auth/permissions` + `fetchPermissions()` helper
- [x] Session unchanged (lean)

## Out of scope
- Putting permissions on NextAuth session
- Role matrix changes
