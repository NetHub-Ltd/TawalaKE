# Task: Platform users RBAC — Slice A

## Goal
Introduce platform identity plane with strict RBAC and audit foundation, separate from tenant Staff.

## Approved scope (defaults OK / proceed 2026-09-15)
- Additive migration: `platform_users` + `platform_role_enum`
- Roles: SUPER_ADMIN | SUPPORT | BILLING | AUDITOR
- `platform_rbac.py` permission matrix
- Platform JWT (`kind=platform`), login, `/auth/me`
- Platform users CRUD (USERS_READ / USERS_WRITE)
- Cross-rejection: platform token ≠ tenant APIs; staff token ≠ platform APIs
- Audit: `record_platform_audit` into `audit_events`
- Bootstrap script for first SUPER_ADMIN (env-based, no open registration)
- Unit tests for permission matrix

## Explicitly out of scope (this PR)
- Impersonation (permission reserved; Slice C)
- Platform org browser / plans UI APIs (Slice B)
- Frontend platform console
- Changing tenant Staff RBAC

## Completed
- [x] Current Behavior Map + proposal
- [x] Remote `dev` restored from main
- [x] Migration c3d4e5f6a7b8
- [x] platform_rbac + platform_deps + routes + schemas
- [x] security TokenData.kind + create_platform_access_token
- [x] audit record_platform_audit
- [x] bootstrap script
- [x] test_platform_rbac.py

## Remaining
- [ ] PR review / merge to dev
- [ ] Apply migration in target env
- [ ] Bootstrap first SUPER_ADMIN in ops env
- [ ] CI pytest with full deps (agent env lacks fastapi)

## Risks
- Live DB may already have partial platform_users from commented historical migration — upgrade is idempotent.
- TokenData.organization_id now Optional; tenant path still requires org link on Staff.

## Debt introduced
- None intentional. Impersonation permission exists but no endpoint yet (documented).

## Design decisions
- Separate JWT kind and route prefix `/api/v1/platform` rather than overloading Staff.
- Audit reuses `audit_events` with meta.actor_kind=PLATFORM_USER (avoids dual-table churn in Slice A).
