# Task Tracker

**Base / PR target:** `dev`  
**Branch:** `fix/frontend-auth-authz`

## Goal

Frontend AuthN/AuthZ aligned with backend: clean auth engine, org URL binding, server token preference, product search session bearer.

## Completed

- [x] Slim `src/auth.ts` (remove dead commented configs)
- [x] Org layout binds `organizationId` to session
- [x] Business layout same tenant check
- [x] `requireApiAuth` / `orgMatchesSession` helpers
- [x] `fetchUser` + `useTenant` without requiring client accessToken
- [x] Product search BFF uses server session token (not client Authorization)
- [x] `apiError` mapper for RBAC/paywall codes
- [x] `npm run lint` clean
- [x] `npm run build:webpack` success (typecheck + compile)

## Notes

`next build --turbopack` may OOM in low-memory agents; webpack build verifies TS and routes.
