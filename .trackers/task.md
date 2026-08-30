# Task Tracker

**Base / PR target:** `dev`  
**Branch:** `fix/authz-idor-hotfix`

## Goal

Tight AuthZ hotfix from post-#142 re-test: close remaining IDOR holes.

## Completed

- [x] `assert_business_access` helper
- [x] Product list by business_id gated
- [x] Product update/delete: org + business access
- [x] Stock `adjust_stock` + tightened `_assert_tenant_product`
- [x] Staff create: force caller org only
