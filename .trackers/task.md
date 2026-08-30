# Task Tracker

## Goal
Phase S0 staff workspace: list → click row → member workspace; one backend staff module path.

## Done
- [x] GET /staff/{id} + mount staff_mgmt at /staff (and keep /business/staff)
- [x] BFF aligned to /staff
- [x] /org/{orgId}/staff directory (TeamDirectory)
- [x] /org/{orgId}/staff/{staffId} workspace (overview, access, security actions)
- [x] Business /staff redirects to org Team
- [x] Sidebar Team → org-level path
- [x] Single useStaff module; deprecated org/staff hook re-exports
- [x] lint + build:webpack pass
