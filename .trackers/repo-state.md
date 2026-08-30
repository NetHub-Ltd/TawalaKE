# Repository State

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Integration branch:** `dev`  
**Current branch:** `feat/org-staff-management-canonical`  
**Base:** `dev` @ `9247ae2`  
**Preferred deploy:** k3s  
**PR target:** `dev`

## Notes
- Canonical staff management API: `GET/POST /api/v1/staff`, member ops under `/api/v1/staff/{id}`
- Legacy alias: `/api/v1/business/staff`
- BFF staff routes use `backendUrl()` so BACKEND_URL with or without `/api/v1` works
- Org command center exposes **Team** at `/org/{orgId}/staff`
