# Task Tracker

**Base / PR target:** `dev`  
**Branch:** `fix/auth-authz-hardening`

## Goal

Single PR fixing authentication and authorization (PR A). Paywall/billing is out of scope (PR B later).

## Completed

- [x] JWT organization_id from staff.organization_id (not bare tenant_id)
- [x] get_current_user: claim vs DB org match; reduced PII logs; OWNER/ADMIN zero-store allowed
- [x] Refresh rotates with DB staff reload (inactive → 401)
- [x] Single StaffRole from models; ADMIN in ROLE_SCOPES
- [x] Opaque JWT error messages
- [x] require_business_access fail-closed when business_id missing
- [x] Product create: business in org + assignment; stamp organization_id
- [x] Store create: bind to caller org only; effective_role OWNER/ADMIN
- [x] Org list/get IDOR guards on staff/billing/stores/org
- [x] Stock mutations: cross-org product rejected
- [x] Tests: role scopes, token org claim, authenticate org preference

## Out of scope

Paywall middleware, feature gates, usage counters (PR B).
