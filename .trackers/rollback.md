# Rollback

Revert this PR. Then:

```bash
alembic downgrade b003a8dc6013   # drops audit_events
```

No change to existing staff rows. RBAC is additive enforcement.
