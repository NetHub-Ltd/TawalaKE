# Task Tracker

## Task name
Org-level staff shell (complete S0 move out of business context)

## Goal
Staff Team directory and member workspace render fully at organization level with app chrome (Sidebar + Header), not under a selected business.

## Approved scope
- Org-level layout for `/org/[organizationId]/staff/**` with Sidebar + Header
- Sidebar: optional `businessId`; resolve business-scoped links via session assigned stores
- Keep business `/staff` redirect to org Team
- Tracker sync
- PR to `dev`

## Out of scope
- Backend API redesign
- RBAC model changes
- Migrating terminal/stock off business context
- Full org command-center redesign
- localStorage last-business persistence (session fallback is sufficient)

## Completed
- [x] Diagnosis: routes were org-level but chrome only under `[businessId]/layout`
- [x] `staff/layout.tsx` org shell
- [x] Sidebar optional businessId + session fallback
- [x] Staff pages: avoid nested `<main>`
- [ ] Verify lint/build
- [ ] Open PR to `dev`

## Decisions
- Shell elevated for staff only (not all org pages)
- Business nav from Team uses first assigned business from session
