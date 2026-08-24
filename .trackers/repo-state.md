# Repository State

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git
**Default Branch:** main
**Current Branch:** test/comprehensive-backend-coverage
**Current Commit:** f04ebb1
**Latest Tag:** v0.0.36
**Last Known Good State:** b07d68a on main

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

## Active Work
- **Branch:** `test/comprehensive-backend-coverage`
- **Commit:** f04ebb1
- **Status:** Pushed to remote (verify with `git ls-remote origin test/comprehensive-backend-coverage`)
- **Scope:** Comprehensive backend test suite + CI gate
- **Files changed:** 11 files in backend/testing/

## Test Files Inventory
| File | Tests | Status |
|---|---|---|
| conftest.py | Fixtures | ✅ Updated |
| test_crudbase.py | 12 | ✅ Rewritten |
| test_store_crud.py | 12 | ✅ Fixed |
| test_product_crud.py | 7 | ✅ Unchanged |
| test_main.py | 3 | ⚠️ Needs verification |
| test_auth_routes.py | 12 | ✅ Created |
| test_organization_routes.py | 7 | ✅ Created |
| test_products_routes.py | 8 | ✅ Created |
| test_stores_routes.py | 11 | ✅ Created |
| test_management_routes.py | 2 | ✅ Created |
| test_payments_routes.py | 3 | ✅ Created |
| test_staff_routes.py | 2 | ✅ Created |
| test_sales_routes.py | 2 | ✅ Created |

## Outstanding Known Issues
- Version drift: git tag is `v0.0.36` but `pyproject.toml` shows `v0.0.12`
- No `docker-compose.yml` for local development orchestration
- No `.env.example` file for environment variable documentation
- Several API routes (sales, payments, checkout, staff) are commented out in `api_router.py`
- `main.py` has a large commented block at the top (appears to be an old version left in place)
- Frontend has generated API clients for disabled backend routes (sync issue)
- **NEW:** CI workflow file `.github/workflows/test_backend.yml` not yet pushed (PAT lacks workflow scope)
