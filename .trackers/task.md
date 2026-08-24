# Task Tracker

**Task Name:** Comprehensive Backend Test Suite + CI Gate
**Goal:** Ensure every backend logic is tested, all tests passing, CI gate blocks merge on failure
**Approved Scope:** testing/ directory, .github/workflows/, conftest.py — ZERO application code changes
**Branch:** test/comprehensive-backend-coverage
**Commit:** f04ebb1

## Completed Changes
- [x] Replace test_crudbase.py (was copy-paste) with 12 proper unit tests
- [x] Fix test_store_crud.py — restore 9 commented tests, fix imports
- [x] Create test_auth_routes.py (12 tests)
- [x] Create test_organization_routes.py (7 tests)
- [x] Create test_products_routes.py (8 tests)
- [x] Create test_stores_routes.py (11 tests)
- [x] Create test_management_routes.py (2 tests)
- [x] Create test_payments_routes.py (3 tests)
- [x] Create test_staff_routes.py (2 tests)
- [x] Create test_sales_routes.py (2 tests)
- [x] Update conftest.py with mock lifespan, auth fixtures, admin fixture
- [x] Commit and push to remote (test/comprehensive-backend-coverage)

## Remaining Changes
- [ ] Verify all tests pass locally (pytest)
- [ ] Fix any remaining test failures
- [ ] Create .github/workflows/test_backend.yml (template ready, see below)
- [ ] Open PR into main

## Explicitly Out of Scope
- ZERO changes to backend/app/ (no CRUD, model, schema, route, core, utility code)
- ZERO changes to frontend/
- ZERO changes to docs/
- ZERO changes to pyproject.toml, Dockerfile, entrypoint.sh

## Environment Variables Required for Testing
```bash
export APP_NAME=TawalaTest
export APP_VERSION=0.0.1
export ENVIRONMENT=development
export DATABASE_NAME=test_db
export DATABASE_USER=test_user
export DATABASE_HOST=localhost
export DATABASE_PORT=5432
export DATABASE_PASSWORD=test_pass
export SECRET_KEY=test-secret-key-32-chars-long!!
export ISSUER=test
export AUDIENCE=test
export ACCESS_TOKEN_EXPIRE_MINUTES=30
export REFRESH_TOKEN_EXPIRE_DAYS=7
export PIN_TOKEN_EXPIRE_HOURS=8
export ADMIN_NAME="Test Admin"
export ADMIN_EMAIL=admin@test.com
export ADMIN_PASSWORD=testpass123
export RESOURCE_SERVER=http://localhost:8000
export ALLOWED_ORIGINS=http://localhost:3000
export RESEND_API_KEY=test_key
export REDIS_URL=redis://localhost:6379/0
```

## Test Run Command
```bash
cd backend
pytest testing/ -v --tb=short
```

## CI Workflow Template
File: .github/workflows/test_backend.yml (NOT YET PUSHED — see repo-state.md for content)

## Known Issues for Next Agent
1. test_main.py may still have lifespan-related errors — needs verification
2. Some route tests may return 422 if request body schemas don't exactly match — verify against app/schemas/*.py
3. The PAT used for push may lack workflow scope — CI file needs to be added via GitHub web or a PAT with workflow scope
4. If push fails with TLS errors, retry or use GitHub web interface to upload the branch

## Decisions Made
- Mock lifespan in conftest.py to bypass DB/Redis checks (no real DB needed for unit tests)
- client_as_admin fixture sets admin_route=True dynamically for management tests
- Coverage threshold: 60% (conservative, can be raised after green)
- All route tests use dependency_overrides for auth (fast, isolated)
