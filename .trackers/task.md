# Task
Platform user invite: email+name only, generated password mailed with login CTA, must_change_password.

## Completed
- model + migration must_change_password
- PlatformUserCreate without password
- create user emails invite
- POST /auth/change-password
- bootstrap script aligned (no password env)

## Note
When MFA PR merges, add must_change_password to verify-code token response as well.
