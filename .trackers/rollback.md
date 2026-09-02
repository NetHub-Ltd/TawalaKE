# Rollback

Revert PR or restore:
- frontend/src/app/(public)/layout.tsx
- frontend/src/app/layout.tsx
- frontend/src/app/globals.css
- frontend/src/app/(public)/page.tsx
- frontend/src/features/org/components/PlanCard.tsx
- frontend/src/app/(public)/onboarding/plans/page.tsx
**Branch:** `feat/onboarding-auto-ndovu-trial`

Revert the PR or restore:
- `backend/app/api/routes/auth.py` (remove auto-trial)
- `backend/app/crud/subscription.py` (`TRIAL_DAYS`)
- `backend/app/utils/plans.py` (seed trial_days)
- `backend/app/core/mailer.py`
- Frontend onboarding forms/pages
- `docs/billing.md`

No DB migration required beyond plan seed upsert on next prestart (trial_days values).
