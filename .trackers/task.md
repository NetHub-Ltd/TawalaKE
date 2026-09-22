# Task

## Goal
#299 — /platform/login two-step UI (password + email MFA code).

## Scope completed
- /platform/login page + PlatformLoginForm (password → code → session)
- sessionStorage keys isolated from staff NextAuth
- /platform landing with session check + sign out
- Resend cooldown UI, error states, store-login cross-link

## Depends on
#298 / PR #303 (MFA API) — must be merged for login to succeed against API.

## Out of scope
Org list/delete UI (#300)
