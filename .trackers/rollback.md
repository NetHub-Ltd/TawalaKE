# Rollback

- Revert PR / delete topic branch feat/platform-org-hard-delete
- No migration in this change (uses existing tables)
- If hard delete was enabled in an env: set PLATFORM_ORG_HARD_DELETE=false immediately
- Hard-deleted orgs cannot be restored from this tool (restore from DB backup only)
