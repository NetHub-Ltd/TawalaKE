# Task Tracker

**Branch:** `fix/staff-role-enum-crud-ux`  
**Base:** `dev`

## Done
- [x] Alembic: ADD VALUE ADMIN to staff_role_enum
- [x] staff_crud owns list/create/update/businesses/password/activity/onboard
- [x] Thin routes/staff.py
- [x] Remove organization register_staff / tenant_staff
- [x] Activity API + BFF + member Activity tab
- [x] Clearer FE error parsing

## Required after merge
Run alembic upgrade so ADMIN exists in Postgres.
