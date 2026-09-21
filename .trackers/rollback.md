# Rollback — Core V2 / T4

- Topic branch: `feat/t4-audit-outbox-idempotency`
- Rollback: close PR without merge; or revert merge commit on `core/v2`
- No product `main`/`dev` impact (isolation policy)
- No irreversible migrations in this change (publisher is application-only)
