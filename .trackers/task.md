# Task Tracker

**Base / PR target:** `dev`  
**Branch:** `feat/paywall-enforcement`

## Goal

Enforce plan limits and feature flags server-side so paid tiers control capacity. Expose entitlements for billing UI.

## Scope (approved)

- Backend entitlements service (`services/paywall.py`)
- Hard limits on create: businesses (new-store), staff, products
- Feature helper ready for routes (`require_feature`)
- `GET /organizations/entitlements` usage snapshot
- Unit tests for resolve / limit / feature
- Status: 402 capacity, 403 feature/inactive

## Completed

- [x] `backend/app/services/paywall.py` — resolve, check_limit, require_feature, usage snapshot
- [x] Wire product create, staff create, new-store
- [x] Entitlements endpoint on organization router
- [x] `backend/testing/test_paywall.py`
- [x] Trackers updated; `dev` created from main

## Out of scope (this PR)

- Payment provider webhooks / M-Pesa fulfillment
- Monthly transaction/invoice counters
- Full billing UI redesign
- Soft grace-period jobs

## Verification

- Under limit → create succeeds
- At limit → 402 PLAN_LIMIT_REACHED with current/maximum
- Missing/expired sub → 403 SUBSCRIPTION_INACTIVE
- Feature off → 403 FEATURE_NOT_AVAILABLE
- Smoke: resolve + limit block
