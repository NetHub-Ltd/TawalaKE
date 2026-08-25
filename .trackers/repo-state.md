# Repository State

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Default branch:** `main`  
**HEAD (main):** `69fe068` — Merge pull request #97 (`test/comprehensive-backend-coverage`)  
**Deployment target:** k3s  
**Live product:** https://tawala.nethub.co.ke (per product README)

## Active work
- **None** — test suite + CI gate from PR #97 is merged
- Feature branch `test/comprehensive-backend-coverage` was merged and removed from remote

## Backend test suite (current)
| Metric | Value |
|--------|--------|
| Location | `backend/testing/` |
| Last verified | PR #97 merge (`ad1ecb1` content) |
| Result | **86 passed, 7 skipped, 0 failed** |
| Coverage | **~70%** line (`pytest --cov=app`) |
| CI gate | `.github/workflows/test_backend.yml` (`cov-fail-under=60`) |
| Redis in tests | `REDIS_URL=memory://` |

### Test inventory
| File | Role |
|------|------|
| `conftest.py` | Mock lifespan, session, redis; auth role clients; no-op limiter/cache |
| `test_main.py` | Health + production docs stripping |
| `test_security.py` | SecurityService (password/PIN/JWT/scopes/blacklist) |
| `test_deps.py` | Auth dependency gates |
| `test_crudbase.py` | BaseCRUD unit tests |
| `test_product_crud.py` / `test_store_crud.py` / `test_store_deep.py` | Product + store CRUD |
| `test_business_crud.py` / `test_staff_crud.py` / `test_organization_crud.py` / `test_sale_crud.py` | Other CRUD / SaleService |
| `test_auth_routes.py` | Auth routes (patched to real handlers) |
| `test_products_routes.py` / `test_organization_routes.py` / `test_stores_routes.py` / `test_management_routes.py` | Route smoke |
| `test_sales_routes.py` / `test_payments_routes.py` / `test_staff_routes.py` | **Skipped** — routers not mounted in `api_router` |

### CI workflows
| Workflow | Purpose |
|----------|---------|
| `build_and_push.yml` | Multi-arch Docker build → GHCR |
| `test_backend.yml` | pytest + coverage on backend changes / PRs |

## Architecture snapshot (unchanged by PR #97)
- Multi-tenant SaaS: Organization → Business → Staff
- Backend: FastAPI + SQLModel/async + Alembic + Celery/Redis
- Auth: email/password + PIN, JWT + Redis JTI blacklist, role scopes
- Frontend: Next.js App Router (Orval client)
- Deploy: k3s (manifests not in-repo)

## Known issues (application — not fixed by test PR)
- Sales / payments / checkout / staff routers **commented out** in `api_router.py`
- Possible auth login cookie bug (`refresh_token` name in handler) — untested path may 500
- Version drift: tags vs `pyproject.toml` historically mismatched
- No `docker-compose.yml` / `.env.example` in repo
- Frontend generated clients may still reference disabled backend routes

## Follow-up test gaps (not blocking)
- Deeper `store_crud` checkout/finalize multi-step paths
- `SaleService` business methods in `sale.py`
- `mailer` / Celery `tasks` / `prestart`
- Un-skip sales/payments/staff tests only after routers are re-mounted
