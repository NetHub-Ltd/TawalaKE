# Task — Core V2

## Completed
- M11 Core contracts freeze
- M12 PostgreSQL isolation + RLS + HTTP tests (CI green)
- **M13 Authorization & Scope Hardening**
  - `AuthorizationService.assert_scope` — single implementation path
  - Empty scope = unrestricted within business (documented in CORE_CONTRACTS.md §4)
  - Unit tests: `tests/rbac/test_scope_semantics.py`
  - Postgres HTTP tests: `tests/postgres/test_scope_http.py`

## Next
M14 — Audit, Event, Outbox & Idempotency Completion

## Hard rules
- Never PR `core/**` → `main`/`dev`
- No FakeSession
- No frontend on this branch
