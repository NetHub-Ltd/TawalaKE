# Rollback

Revert the PR.

- Soft-deleted products remain with deleted_at set (data safe).
- Drop `data_archive_jobs` via migration downgrade if needed.
- ARCHIVE_ENABLED defaults false — no mass purge from this PR alone.
