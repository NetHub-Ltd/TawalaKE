# Rollback

**Branch:** `feat/onboarding-auto-ndovu-trial`

Revert the PR or restore:
- `backend/app/api/routes/auth.py` (remove auto-trial)
- `backend/app/crud/subscription.py` (`TRIAL_DAYS`)
- `backend/app/utils/plans.py` (seed trial_days)
- `backend/app/core/mailer.py`
- Frontend onboarding forms/pages
- `docs/billing.md`

No DB migration required beyond plan seed upsert on next prestart (trial_days values).
