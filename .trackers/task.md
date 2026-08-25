# Task Tracker

**Task Name:** Onboarding Task 1 — Phases A + B (password setup)
**Branch:** `feature/onboarding-ab-password-setup`
**Status:** In progress → ready for PR
**Approved scope:** Backend onboard/auth/mailer + frontend onboarding personal-details / set-password + BFF

## Goal
Login → New to Tawala → personal details → verification email → set password → activate account → session (auto-login) → `/org`

## Completed
- [x] `onboard_staff`: `active=False`, no password
- [x] Onboard route: Redis setup token + `mailer.send_onboarding_setup`
- [x] `POST /auth/onboarding/set-password` activates + tokens + email
- [x] Login cookie bugfix (`tokens.refresh_token`); authenticate guards null hash
- [x] BFF personal-details + set-password proxies (status passthrough)
- [x] Personal details success = check-email UX (`globals.css` tokens)
- [x] `/onboarding/set-password` + NextAuth credentials sign-in

## Not in this task (Task 2: C+D)
- [ ] Organization details form
- [ ] NDOVU trial start
- [ ] First store guided step

## Verification
1. POST personal-details → 201, inactive staff, email queued
2. Open setup link → set password → active=True, can use /org session
3. Login before setup → 401
4. Existing password-reset flow unchanged
