# Repository State

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git
**Default Branch:** main
**Current Branch:** main
**Current Commit:** b07d68a055666aae258eb5581930611db99e4c4d
**Latest Tag:** v0.0.36
**Last Known Good State:** b07d68a05566 on main

## Environment / Deployment
- **Backend Image Registry:** ghcr.io/NetHub-Ltd/tawala-api
- **CI/CD:** GitHub Actions (`.github/workflows/build_and_push.yml`)
- **Build Platforms:** linux/amd64, linux/arm64
- **Backend Framework:** FastAPI (Python 3.12)
- **Frontend Framework:** Next.js 16 (React 19, Tailwind CSS)
- **Database:** PostgreSQL + asyncpg
- **Cache:** Redis
- **Task Queue:** Celery
- **Migrations:** Alembic (46 migration files)

## Current Implementation State
- Backend entrypoint: `backend/app/main.py` (FastAPI with lifespan, CORS, rate limiting, Redis cache)
- API Router: `backend/app/api/api_router.py` — prefix `/api/v1`
- Active routes: auth, organizations, business (stores), products, management (admin-only)
- **Commented-out routes:** sales, payments, checkout, staff
- Admin route toggle: `admin_route` config flag
- Frontend: Next.js App Router with Orval-generated API client

## Outstanding Known Issues
- Version drift: git tag is `v0.0.36` but `pyproject.toml` shows `v0.0.12`
- No `docker-compose.yml` for local development orchestration
- No `.env.example` file for environment variable documentation
- Several API routes (sales, payments, checkout, staff) are commented out in `api_router.py`
- `main.py` has a large commented block at the top (appears to be an old version left in place)
