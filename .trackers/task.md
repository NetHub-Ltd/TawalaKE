# Task Tracker

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Base branch:** `main` (integration via `dev` / PR #114)  
**Current branch:** `dev`

## Goal

Resolve PR #114 merge conflicts (trackers only) so `dev` can merge cleanly into `main`. No product-scope change in this resolution commit.

## Approved scope (this resolution)

- Merge `origin/main` into `dev`  
- Resolve `.trackers/*` to a post-integration narrative  
- Push `dev` (updates PR #114)  
- Do **not** merge PR #114 without explicit user authority  

## Completed changes (historical / on `dev`)

- PR #117: Sales history relations + list/detail UI  
- PR #116: Credit sale finalize + invoice for collection  
- Billing: cohesive plan limits and features for paywall (PR #114 body)  
- PR #115 (`main`): trackers sync + `.skills/`  
- PR #110 (`main`): Turbopack builds  

## Remaining

- [ ] Required CI on PR #114 (especially `test-backend`) green  
- [ ] User merges PR #114 into `main`  
- [ ] After merge: set trackers on `main` to idle / next task TBD  

## Explicitly out of scope

- Force-push `main` or rewrite shared history  
- Changing billing/plan product code in this commit  
- Auto-merging #114  
- Closing/retargeting checkout-invoice stacked PRs (#111–#113) unless requested  

## Decisions

- Tracker resolution = single coherent rewrite (not “ours” feature-branch trackers on `main`)  
- Integration path = merge `main` into `dev`, push `dev`  

## Risks

- `test-backend` may still be pending/required on #114  
- Stacked PRs into `main`/`dev` may need manual review after `dev` moves  

## Verification

- No conflict markers in `.trackers/`  
- PR #114 reports conflicts resolved  
- Product commits from `dev` unchanged by this resolution  
