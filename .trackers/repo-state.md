# Repository State

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Default branch:** `main`  
**Integration / PR target:** `dev` (create from main if missing)  
**Current branch:** `feat/onboarding-password-recovery-polish`  
**Base commit at branch start:** `5184536` (Merge PR #162 from NetHub-Ltd/dev)  
**Preferred deploy:** k3s  

## Current focus
Onboarding + password recovery polish; required `FRONTEND_URL` from env.

## Notes
- Primary canonical: `https://tawala.nethub.co.ke`
- Public trial entry: `/onboarding/personal-details`
- Password reset entry: `/forgot-password` → email → `/auth/reset-password?token=…`
- Trial source of truth: `TRIAL_DAYS = 14` + plan seed `trial_days: 14` for Basic/Ndovu
- Open remote topic branches (unrelated): `fix/staff-bff-url-align-debug`, `fix/stock-direct-proxy-and-backend-root-cause`
