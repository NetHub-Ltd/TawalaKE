# Frontend tenant RBAC (1:1 with API)

Permission strings match `backend/app/core/rbac.py`.

- `frontend/src/lib/rbac/` — matrix, `can` / `canAny`
- `usePermissions()` — from session role
- Sidebar uses `anyOf` permissions (ADMIN included where matrix allows)
- Staff suite requires `org:staff:manage`

Staff APIs: `GET/POST /api/v1/business/staff`, `PATCH .../{id}`, `PUT .../{id}/businesses`, `POST .../{id}/reset-password`.
