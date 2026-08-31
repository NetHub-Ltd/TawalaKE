# Task Tracker

**Branch:** `chore/staff-canonical-cleanup`  
**Base / PR target:** `dev`  
**Status:** Implementation complete — awaiting PR

## Goal
Single dedicated staff management surface (org-level); remove duplicate/legacy staff APIs and dead FE.

## Done
- [x] Dedicated router `backend/app/api/routes/staff.py` (from staff_mgmt); sole mount `/api/v1/staff`
- [x] Removed `/business/staff` alias, `assign-staff`, `get-staff`, org `GET /staff/{org_id}`
- [x] Deleted legacy register `staff.py` and store `create_staff_account`
- [x] FE BFF: `/api/v1/org/staff` → backend `/staff`; removed `/managed` and stale proxies
- [x] Deleted `StaffWorkSpace.tsx`, deprecated org/staff re-export hook
- [x] Tests: alias must 404; removed skipped legacy test_staff_routes.py

## Out of scope (unchanged)
Onboarding OWNER create, RBAC matrix, schema filename `staff_mgmt.py`, sales/payments mount gaps
