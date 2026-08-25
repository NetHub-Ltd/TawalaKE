# Repository State

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Default branch:** `main`  
**Active deploy/test branch:** `deploy/onboarding-combined-test`  
**HEAD (this branch):** `e603129` — fix(billing): use plan tier enum values; redesign plans + contact  
**Open PR:** #107 (Deploy/onboarding combined test)  
**Deployment target:** k3s / preview (user-controlled)

## Branch composition
Merged for testing (Dev excluded):
- Task 1 A+B + eager-load fix
- Task 2 plans/trial/org gate
- Follow-up fixes: proxy public set-password, route order, trial enum, plans UI, contact-us

## Environment requirements
- `BACKEND_URL` on Next.js server only (never `NEXT_PUBLIC_` for API host)
- `FRONTEND_URL`, `RESEND_API_KEY`, Redis for setup/reset tokens
- Plans seeded at app start (`prestart.seed_plans`)

## Known production constraints
- Postgres `subscription_tier_enum` accepts BASIC / NDOVU / ENTERPRISE (not TRIAL)
- FastAPI static routes must register before `/{organization_id}`
