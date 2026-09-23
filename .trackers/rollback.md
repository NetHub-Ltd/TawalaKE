# Rollback

- Revert PR / restore prior platform_login that issued tokens on password success
- No migration for MFA itself
- In-flight MFA challenges expire via Redis TTL
- Bootstrap/invite and BFF changes on dev are independent; do not revert those unless intended
