# Task Tracker

## Task name
Org-level staff management — canonical API + BFF + org entry

## Goal
Fix Team directory 404 and place staff management at organization level (same altitude as store selection).

## Approved scope
- Canonical backend mount `/api/v1/staff` (keep `/business/staff` alias)
- BFF staff routes use `backendUrl()`
- Org command center Team link
- Mount/smoke tests for staff paths
- PR to `dev`

## Out of scope
- Full command-center redesign
- Removing legacy alias this PR
- DB migrations
- Moving POS routes off business context

## Completed
- [x] api_router: canonical `/staff` first; alias documented
- [x] BFF managed/member/businesses/reset-password → backendUrl
- [x] OrgCommandCenterClient Team entry
- [x] test_staff_mgmt_routes.py mount smoke tests
- [ ] Verify pytest + frontend lint
- [ ] Open PR
