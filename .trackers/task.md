# Task Tracker

**Base / PR target:** `dev`  
**Branch:** `fix/rbac-remove-kill-switch`

## Goal

Phase 0 of authz hardening: remove `settings.rbac_enforce` so permission and business-access checks cannot be disabled via env.

## Completed

- [x] Remove `rbac_enforce` from `core/config.py`
- [x] Always enforce in `require_permissions` and `require_business_access`

## Follow-ups (separate PRs)

See audit proposal: tenant binding, JWT org claim, dual role systems, paywall middleware trust, IDOR tests.
