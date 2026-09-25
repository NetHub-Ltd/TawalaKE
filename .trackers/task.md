# Task

## Goal
Platform Phase A operator console (epic **#385**) in **one PR**:
- **#386** dashboard home — KPIs + attention list
- **#387** organizations — filters + extend grace UI
- **#388** operators (users) — list / invite / role

## Scope
- `/platform` attention-first home
- `/platform/orgs` status filters (all/active/inactive/grace) + extend-grace control
- `/platform/users` list, invite, edit role/active/force password change
- BFF proxies for users + extend-grace
- Client helpers in `lib/platform/auth.ts`
- Expose `grace_end_date` + `access_phase` on platform org subscription serialize
- Shell nav: Overview · Organizations · Operators
- Trackers updated

## Out of scope
- Phase B plans/billing read, audit stream
- Phase C impersonation / job runners
- Soft-delete product path for orgs

## Branch
feat/platform-dashboard-home → single PR into **dev** (covers #385 Phase A)
