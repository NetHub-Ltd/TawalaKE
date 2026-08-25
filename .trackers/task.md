# Task Tracker

**Branch:** `deploy/onboarding-combined-test`  
**Purpose:** Combined deploy/test branch (not for auto-merge to main)

## Included (Dev #100 excluded)
- Task 1 A+B (#99): email verification + password setup
- Eager-load fix (#103): assigned_businesses / MissingGreenlet
- Task 2 (#102): plans, 7-day NDOVU trial, org profile, /org gate

## Conflicts resolved
- `backend/app/api/routes/organization.py` — merged imports + both onboard email and trial/plans routes
- `backend/app/core/mailer.py` — both `send_onboarding_setup` and `send_trial_invoice`

## Deploy note
Use this branch for staging validation before manually opening a PR to main.
