# Tenant staff RBAC

## Roles

| Role | Summary |
|------|---------|
| OWNER | Full org control including billing |
| ADMIN | Org operator; no billing |
| MANAGER | Assigned businesses; catalog/stock/sales/reports |
| CASHIER | Terminal: sell, catalog read, own sales |

## Permissions

See `app/core/rbac.py` (`ROLE_PERMISSIONS`).

## Enforcement

- FastAPI deps: `require_permissions(...)` in `app/api/rbac_deps.py`
- Business scope: assignments for MANAGER/CASHIER; all org businesses for OWNER/ADMIN
- Redis caches permission lists and assignment ids (TTL); DB is source of truth; purge on role/assignment change

## Audit

Table `audit_events`: who (actor_staff_id, email, role), what (action, resource), when (`created_at`), outcome, meta.
