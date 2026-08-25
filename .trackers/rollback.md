# Rollback

**Branch:** `feature/onboarding-ab-password-setup`

## Impact
- New onboarded users are inactive until set-password (intended)
- Existing active users unchanged
- Login cookie fix is a bugfix (safe)

## Rollback
Revert merge commit or delete branch if unmerged.
Pending inactive users without password may need support resend (Task 2 / ops).
