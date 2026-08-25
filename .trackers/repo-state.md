# Repository State

**Branch:** `deploy/onboarding-combined-test`  
**PR:** #107  
**Issue:** #108 (subscription_tier_enum drift)

## Critical constraint
Live Postgres `subscription_tier_enum` = **FREE | BRONZE | SILVER | GOLD**.  
App must not write BASIC/NDOVU/ENTERPRISE/TRIAL to `subscriptions.tier` until Phase B migration.  
Product identity: **`plan_id` → plans.code**.
