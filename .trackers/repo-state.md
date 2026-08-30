# Repository State

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Integration branch:** `dev`  
**Current branch:** `feat/org-level-staff-shell`  
**Base:** `dev` @ `8b4b7e5` (Merge PR #146 staff-workspace-s0)  
**Preferred deploy:** k3s  
**PR target:** `dev`

## Current implementation state
- Staff Team directory + member workspace routes are org-scoped (`/org/{orgId}/staff`).
- Org-level staff layout now provides Sidebar + Header shell (no businessId required in URL).
- Sidebar accepts optional `businessId`; business nav falls back to first assigned store from session.
