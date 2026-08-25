# Task Tracker

**Branch:** `deploy/onboarding-combined-test`  
**Open PR:** https://github.com/NetHub-Ltd/TawalaKE/pull/107  
**Related issue:** https://github.com/NetHub-Ltd/TawalaKE/issues/108  

## Status
ACTIVE — deploy/test branch

## Latest approved work (2026-08-26)
1. **Phase A enum fix (#108)** — trial writes `tier=FREE` (live DB labels); `plan_id` is product truth. Migration Phase B deferred.
2. **Plans UI** — Ndovu ribbon, features collapsed behind “See more features”, trial CTA above features.

### Completed
- [x] Expand `SubscriptionTier` with FREE/BRONZE/SILVER/GOLD; default subscription tier FREE; `create_type=False`
- [x] `start_plan_trial` sets `tier=FREE`, `plan_id=<plan>`
- [x] `PlanCard`: diagonal ribbon on Ndovu, collapsible features, early CTA
- [x] Trackers updated

### Deferred
- [ ] Phase B: Alembic ADD VALUE for BASIC/NDOVU/ENTERPRISE/TRIAL (or rename path)

## Next work
None until a new written proposal is approved.
