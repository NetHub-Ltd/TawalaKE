# Task Tracker

**Branch:** `feat/reporting-analytics-core`  
**Goal:** Centralized reporting from rollup tables (not runtime sale scans), hourly bars, WS updates, backfill.

## Done
- [x] Models: ProductSalesSummary, StaffSalesSummary, BusinessSalesHourly; COGS/gross_profit on daily
- [x] Writer: apply_sale_to_rollups + Redis publish
- [x] Worker wired to new writer
- [x] Reporting CRUD + REST (overview, series, hourly, products, staff, insights, full, backfill)
- [x] WebSocket `/ws/business/{id}/dashboard?token=`
- [x] Migration e2f3a4b5c6d7
- [ ] Deploy: alembic upgrade + POST backfill per business
**Branch:** `feat/soft-delete-retention-archive`  
**Base:** `dev`  
**PR target:** `dev`  
**Tier:** 2  

## Goal
Phase A soft-delete core + Phase B/C foundation: plan `data_retention_months`, DataArchiveJob, archive builder stub, flags off.

## Approved defaults
- R1: eligibility from deleted_at
- Retention from plan limits (6 / 12 / 36); fallback 6
- First ship: soft-delete + archive job table + interface; purge/email later
- Product DELETE soft-deletes (stock history retained)

## Done
- [x] BaseCRUD: soft_delete, restore, hard_delete, active filters on get/list/search
- [x] Product delete → soft_delete + actor_id
- [x] Staff soft_delete_staff (email mangle, active=False)
- [x] DataArchiveJob model + migration d1e2f3a4b5c6
- [x] retention.py + archive.py stub
- [x] archive_enabled / TTL / fallback in settings + .env.example
- [ ] PR to dev
- [ ] CI / local tests when registry available

## Follow-ups
- Object storage + signed URL + owner email
- Scheduled eligibility + purge behind ARCHIVE_ENABLED
- Partial unique indexes WHERE deleted_at IS NULL
- Customer soft-delete API if missing
- Wire staff management DELETE to soft_delete_staff
