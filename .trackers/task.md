# Task: Dashboard foundation correctness (cohesive)

## Status
**APPROVED — implementing on `feat/dashboard-foundation-correctness`**

## Goal
One cohesive update so Overview metrics are trustworthy end-to-end.

## Completed in this branch
- [x] Discount source: `discount_applied` with fallback to `discount` in `apply_sale_to_rollups`
- [x] Payment mix: `card_volume` + `other_volume` on model, migration, rollup writer, aggregate, series
- [x] Credit: `credit_scope: outstanding_all_time` + UI label “Open credit (outstanding)”
- [x] `profit_is_provisional` when missing_cost_line_count > 0
- [x] `expenses_available` flag; log on expense failure (no silent zero without signal)
- [x] Hourly zero-fill (cap 48h) in `reporting_crud.hourly`
- [x] Schema `AnalyticsSummaryBlock` / series expanded for new fields
- [x] UI: chart tab Orders; default metric Revenue; provisional profit label; settled Cash/M-Pesa/Card/Other/Open credit
- [x] Types in `useDashboardData.ts`
- [x] Tests: dashboard card/scope/provisional/expense failure; rollup discount_applied+CARD; aggregate provisional
- [x] Outbox reverse: confirmed process_outbox only sign=+1; reverse left as follow-up (documented)
- [x] Legacy dual path: not refactored; Overview remains rollup-only

## Out of scope (unchanged)
- Nairobi timezone
- Full Insights UI
- Period-scoped credit engine
- Merge to main

## Verification
- Smoke: aggregate_rows, dashboard, apply_sale discount_applied+CARD — passed in isolated runner
- Full pytest suite requires full backend deps (not all installed in agent env)
- Frontend: lint/build should be run in CI / local with node_modules

## Follow-ups
- Nairobi timezone
- Insights tab
- Period credit issued/collected
- Audit cancel/void for sign=-1 outbox
- Historical backfill after deploy for discount/payment mix accuracy
