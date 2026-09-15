# Tenant RBAC matrix → database (phased)

**Problem:** `ROLE_PERMISSIONS` in `backend/app/core/rbac.py` is code-only — hard to grant/revoke without deploy.

**Constraint:** Must not break production. Dual-read with flag default **off**.

## Phase 1 (this PR) — additive, non-breaking

- Tables: `permission_definitions`, `role_permissions`
- Seed = current in-code matrix
- Flag `AUTH_RBAC_FROM_DB` / `auth_rbac_from_db` default **false**
- When false: `has_all_permissions` / `permissions_for` use **code** (unchanged)
- When true: `require_permissions` loads from `role_permissions` (fallback to code if empty/error)

## Phase 2 (follow-up PR)

- Admin/API to list role permissions and deactivate rows (`active=false`)
- Cache invalidation on change
- Staging soak with flag **on**

## Phase 3 (follow-up PR)

- Optional per-staff overrides table (if product needs exceptions beyond role)
- UI for org OWNER/ADMIN to manage (within policy)
- Consider deprecating in-code matrix as fallback only

## Who holds what “at a given moment”

Phase 1 answers: **role R holds permission codes C** (query `role_permissions`).  
Staff membership in a role remains `Staff.role`. Effective set = role matrix (+ future overrides).
