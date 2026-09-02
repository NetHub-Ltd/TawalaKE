# Task Tracker

**Branch:** `feat/onboarding-auto-ndovu-trial`  
**Base:** `main`  
**PR target:** `dev`  
**Tier:** 2

## Goal
After account creation and email verification (set password), auto-start a **14-day Ndovu** trial with frictionless UI and professional emails.

## Approved scope
- `TRIAL_DAYS = 14`; Basic/Ndovu seed `trial_days: 14`
- Auto-start NDOVU trial in `POST /auth/onboarding/set-password`
- TokenResponse hints: trial_started, trial_days, plan_code, needs_org_profile
- SetPasswordForm routing: org profile or /org; plans only on trial failure
- Setup + trial email templates (conversion-focused)
- Onboarding UI copy (personal-details, set-password, plans recovery)
- PlanCard / StartTrialButton 14-day labels
- docs/billing.md trial policy

## Out of scope
- Cancel flow UI
- Public pricing page
- Auto-create first store
- Payment provider changes

## Completed
- [x] Backend trial duration + seed
- [x] Auto-trial on set-password
- [x] Email templates
- [x] Frontend routing + copy
- [x] Billing doc

## Remaining
- [ ] Push + PR to dev
- [ ] CI / manual verification of happy path

## Verification
- set-password → active NDOVU sub ~14 days
- needs_org_profile → /onboarding/organization
- trial failure → /onboarding/plans
- Emails: setup CTA + trial active subjects

## Debt introduced
None deliberate.
