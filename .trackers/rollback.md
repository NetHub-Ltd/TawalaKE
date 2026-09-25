# Rollback

- Revert/close PR for feat/platform-dashboard-home
- No migrations in this change; frontend + additive subscription fields only
- Safe to leave grace_end_date/access_phase on schema if PR is reverted later (backward compatible)
