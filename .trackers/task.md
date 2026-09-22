# Task

## Goal
Platform login email MFA (issue **#298**).

## Scope
- POST /api/v1/platform/auth/login → challenge only (no access token)
- Redis MFA challenge + hashed 6-digit code
- POST /api/v1/platform/auth/verify-code → platform JWT
- POST /api/v1/platform/auth/resend-code (cooldown)
- mailer.send_platform_login_code
- Config: platform_mfa_code_ttl_sec, max_attempts, resend_cooldown_sec
- Unit tests test_platform_mfa.py

## Breaking change
Password-only platform login no longer returns access_token. Clients must complete verify-code.

## Roadmap
1. #297 org hard-delete — done (merged #302)
2. #298 MFA — this branch
3. #299 /platform/login UI
4. #300 orgs admin UI
5. #301 cleanup runbook

## Out of scope
Frontend UI (#299), trusted device skip.
