# Rollback
Revert PR. Downgrade migration e2f3a4b5c6d7. Old analytics worker path removed — restore from main if needed.

Revert the PR.

- Soft-deleted products remain with deleted_at set (data safe).
- Drop `data_archive_jobs` via migration downgrade if needed.
- ARCHIVE_ENABLED defaults false — no mass purge from this PR alone.
