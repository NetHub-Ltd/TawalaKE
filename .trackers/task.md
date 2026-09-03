# Task Tracker

**Branch:** `feat/onboarding-password-recovery-polish`  
**Base:** `main` (no remote `dev` at branch creation; PR target `dev`)  
**PR target:** `dev`  
**Tier:** 1–2  

## Goal
Polish self-serve onboarding and password management/resets; make `FRONTEND_URL` required from env for all email action links.

## Approved scope (defaults OK)
- Ship forgot-password + reset-password UI aligned to backend URLs
- Shared min-8 password policy (no extra complexity rules)
- Light onboarding step labels (1/3 → 2/3 → 3/3)
- Clean dead commented code in LoginForm
- `frontend_url` required from `.env` with normalized `settings.frontend_origin`
- Platform roles: **follow-up only** (not in this PR)
- Staff invite email rewrite: **out of scope**

## Proposed / completed changes
- [x] Backend: `Settings.frontend_url` required (no default); `frontend_origin` property
- [x] Backend: auth forgot-password + onboarding trial email use `frontend_origin`
- [x] Backend: organization `_frontend_base_url()` uses `settings.frontend_origin`
- [x] Frontend: `/forgot-password` page + `ForgotPasswordForm`
- [x] Frontend: `/auth/reset-password` page + `ResetPasswordForm` (matches email link)
- [x] Frontend BFF: `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/password-reset/confirm`
- [x] Shared `lib/auth/password-policy.ts` (min 8 / max 128 + confirm)
- [x] SetPasswordForm uses shared policy
- [x] LoginForm: remove large dead commented block; keep link to `/forgot-password`
- [x] Onboarding step labels on personal-details, set-password, organization
- [x] CI/conftest: set `FRONTEND_URL` so pytest can load Settings

## Out of scope
- Platform roles implementation
- MFA
- Staff email-invite flow rewrite
- Changing trial/plan business rules
- Login min-length for existing passwords (stays 6 client-side; new passwords min 8)

## Active follow-ups
- Platform roles Phase 0–1 (verify `platform_users` on prod DB, auth path, capability matrix)
- Optional logged-in change-password page
- Align staff admin reset UI copy with shared policy messaging
- Ensure deploy/k3s secrets include `FRONTEND_URL`

## Decisions
- Reset URL path: `/auth/reset-password` (matches existing backend email builder)
- Password policy: min 8 only
- Platform roles deferred

## Risks
- Deployments missing `FRONTEND_URL` will fail Settings() at backend startup (intentional)
- Email links previously built with bare host now get `https://` via `frontend_origin`

## Verification
- Manual: forgot → email → reset → login
- Manual: onboarding personal-details → email → set-password → org
- Backend boots only when `FRONTEND_URL` is set
- No secrets in diff

## Debt introduced
None deliberate.
