# Task

## Goal
Fix false "no permission / Signed in as unknown" on Team when session is still hydrating.

## Root cause
`TeamDirectory` / `StaffMemberWorkspace` evaluated `can(ORG_STAFF_MANAGE)` before NextAuth finished loading. role=null → deny flash; refresh often worked because session was cached.

## Fix
- Wait for `isLoading` from `usePermissions` before deny UI
- Distinguish unauthenticated vs forbidden
- `RequirePermission` shows loading text instead of null
