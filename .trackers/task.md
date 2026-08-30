# Task Tracker

**Base / PR target:** `dev`  
**Branch:** `fix/paywall-hardening`

## Goal

PR B — billing/paywall hardening (approved).

## Completed

- [x] Unregister PaywallValidityMiddleware (no X-Organization-Id trust)
- [x] Middleware module stubbed (deps-only enforcement)
- [x] paywall_deps org from organization_id or tenant_id
- [x] Subscription deactivate / activate_or_extend / mark_expired + invalidate
- [x] Trial start uses shared _invalidate_org
- [x] persist_usage SELECT FOR UPDATE
- [x] OWNER cancel + activate org routes
- [x] Payment confirmation activates subscription + invalidates cache
- [x] Tests for middleware removal + lifecycle exports
