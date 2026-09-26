# Task

## Goal
Platform Phase B — plans/billing read views + audit log stream (epic **#385**).

## Scope
- GET /api/v1/platform/plans (PLANS_READ) — full catalogue including non-public
- GET /api/v1/platform/audit-events (AUDIT_READ) — paginated stream with filters
- UI: /platform/plans, /platform/audit
- BFF proxies + client helpers
- Shell nav links
- Fix pre-existing extend_grace audit kwargs (actor_id → actor)

## Out of scope
- Plan write / price editing
- Phase C impersonation / job runners
- Soft-delete product path

## Branch
feat/platform-phase-b-plans-audit → PR into **dev**
