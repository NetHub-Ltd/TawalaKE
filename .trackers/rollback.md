# Rollback

**Previous known-good:** `dev` @ `5f794e2` (pre credit-sale fix)

## Rollback procedure
```bash
# On the topic branch, before merge: delete branch / close PR
# After merge to dev:
git revert -m 1 <merge-commit-sha>
# Or reset dev to 5f794e2 if not yet shared widely (coordinate first)
```

## Files touched (revert set)
- `backend/app/crud/store.py`
- `backend/app/tasks/worker.py`
- `frontend/src/app/api/v1/org/stores/sales/checkout/route.ts`
- `frontend/src/features/sales/components/CheckoutForm.tsx`
- `frontend/src/features/sales/components/CompleteSaleClient.tsx`
- `.trackers/*`

## Data notes
- No Alembic migration in this change
- New credit sales use `PENDING_PAYMENT` + invoice documents
- Historical rows were not rewritten
- Stock deductions already applied to finalized sales are not auto-reversed by a code revert

## Irreversible operations
- None in schema
- Operational: stock already reduced for credit sales after this ships remains reduced until a cancel/restore feature exists
