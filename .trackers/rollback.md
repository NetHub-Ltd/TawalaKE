# Rollback

Revert the commit(s) on `dev` that update:
- `backend/app/utils/plans.py`
- `backend/app/schemas/plans.py` (api_access type only)
- `docs/billing.md`, `docs/Marketing.md`, `README.md`
- `frontend/src/features/org/components/PlanCard.tsx`
- `frontend/src/app/(public)/onboarding/plans/page.tsx`
- `.trackers/*`

No Alembic migration. Restart backend after revert so `seed_plans` re-applies previous seed if needed.
