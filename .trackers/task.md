# Task Tracker

**Branch:** `dev`  
**Authorized:** Cohesive plan limits + features for paywall (approved 2026-08-27)

## Scope
1. `PLANS_SEED` — finite Enterprise caps; Ndovu staff 25; white_label on Ndovu; graded `api_access`
2. `PlanFeatures.api_access` widened to `Union[bool, str]` (non-breaking)
3. Docs: `docs/billing.md`, README pricing, Marketing prices
4. Frontend: PlanCard graded labels + limits formatting; onboarding plans page copy

## Completed
- [x] Seed matrix (Basic / Ndovu / Enterprise)
- [x] Schema grade for api_access
- [x] billing.md feature + limit matrix
- [x] README + Marketing price alignment
- [x] PlanCard display for graded features / numeric limits
- [x] Onboarding plans intro copy

## Out of scope
- Paywall enforcement middleware (next)
- Merging to main beyond this PR
