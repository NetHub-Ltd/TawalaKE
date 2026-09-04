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
