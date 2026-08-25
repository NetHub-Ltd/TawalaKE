# Task Tracker

**Task:** Onboarding Task 2 — plans, 7-day NDOVU trial, org profile, /org gate  
**Branch:** `feature/onboarding-task2-plans-trial`  
**Status:** Implemented — ready for review  

## Decisions
- `onboarding=true` when **profile complete + active trial/subscription** (store optional)
- Trial: **7 days** NDOVU; email-only **KES 0** invoice
- Scope: 2a + 2b + 2c

## Backend
- `crud/subscription.py` — list plans, active sub, start trial, maybe complete onboarding
- `GET /organizations/plans|subscription|onboarding-status`
- `POST /organizations/trial/start` (OWNER) + trial invoice email
- `PATCH /organizations/update-org` — OWNER check fixed; may set `onboarding=true`
- NDOVU seed `trial_days` → 7
- `mailer.send_trial_invoice`

## Frontend
- `/onboarding/plans` (RSC + Start trial CTA)
- `/onboarding/organization` form
- `/org` OWNER gate → plans or organization
- BFF under `/api/v1/org/*` (server-only `BACKEND_URL`)
