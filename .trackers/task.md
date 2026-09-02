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
Public pages scroll; homepage simpler and polished; plans cards aligned to tuned Silk & Slate tokens.

## Done
- [x] Public layout: document scroll (remove nested overflow trap)
- [x] Root body/main allow overflow-y auto
- [x] globals.css tokens, shadows, card/plan utilities
- [x] Homepage simplified (hero, 3 benefits, steps, proof, FAQ, CTA)
- [x] PlanCard + plans page polish

## Out of scope
- /org shell redesign
- Backend trial logic
