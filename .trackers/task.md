# Task — Core V2

## Authoritative scope source
Roadmap + issues #264–#276 (M11–M23).

## Completed
- **M11** Core contracts freeze — `docs/architecture/CORE_CONTRACTS.md` (`cfaa162`).
- **M12 (in progress)** Real PostgreSQL Isolation & Security Proof:
  - Settings: BaseSettings with `environment`, required `DATABASE_URL` in test/production, URL validator.
  - Session: `set_tenant_guc` for RLS (`app.current_business_id`, `app.current_user_id`, `app.rls_bypass`).
  - deps: set GUCs after TenantContext resolution.
  - Alembic `20260920_0009` — ENABLE/FORCE RLS + policies on business-scoped tables.
  - Tests: real Postgres HTTP isolation suite (`tests/postgres/`); FakeSession tests removed.
  - CI: Postgres 16 service + `DATABASE_URL` for all pytest runs.

## Remaining for M12 verification
- Confirm CI green (agent environment cannot run full Postgres suite reliably).
- Close issue #265 when CI passes.

## Next
M13 — Authorization & Scope Hardening (after M12 verified).

## Hard rules
- Never PR `core/**` → `main`/`dev`.
- No FakeSession.
- No frontend on this branch.
