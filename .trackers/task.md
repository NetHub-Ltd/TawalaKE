# Task Tracker

**Task Name:** Comprehensive Backend Test Suite + CI Gate
**Goal:** Backend logic tested as production guardrail; green suite; CI blocks merge on failure
**Approved Scope:** testing/, .github/workflows/, .trackers/ — ZERO application code changes
**Branch:** test/comprehensive-backend-coverage

## Completed
- [x] Unit suite green: **86 passed, 7 skipped, 0 failed**
- [x] Line coverage ~**70%** overall (`--cov=app`)
- [x] SecurityService unit tests (hash/PIN/JWT/scopes/blacklist)
- [x] Auth routes (login/refresh/me/logout/forgot/reset) with real patches
- [x] Products / organization / stores route smoke tests
- [x] deps auth gate tests
- [x] CRUD: base, product, store, business, staff, organization, SaleService
- [x] CI workflow with cov-fail-under=60 and REDIS_URL=memory://
- [x] Skipped only unmounted routers (sales/payments/staff) — 7 tests

## Remaining (follow-up PR recommended)
- [ ] Deeper store_crud checkout/finalize paths (complex multi-step)
- [ ] sale.py SaleService business methods
- [ ] mailer / tasks / prestart
- [ ] Un-skip sales/payments/staff when routers re-mounted

## Verification
```bash
cd backend
export REDIS_URL=memory:// # + other env from prior task.md
pytest testing/ -q --cov=app --cov-fail-under=60
# 86 passed, 7 skipped, 0 failed, ~70% coverage
```
