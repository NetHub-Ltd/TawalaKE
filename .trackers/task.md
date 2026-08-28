# Task Tracker

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Base branch:** `dev`  
**Current branch:** `fix/sales-history-relations-and-ui`

## Goal
Sales history list + detail show accurate items, cashier, business, and line items; denser operational UI; credit labelled clearly. Fix relation loading and sales cache staleness.

## Approved Scope
Approved 2026-08-28:
1. Eager-load `Sale.business`; `.unique()` on sale fetches
2. Purge `sales` cache after new-sale + checkout
3. Additive `item_count` / `cashier_name` on `SaleReadWithRelations`
4. BFF page_size + error forwarding
5. Table + detail UI: data helpers, Credit · due labels, customer column, denser table, detail meta

## Completed Changes
- [x] Backend store.py eager options + unique
- [x] Backend sales cache purge on write paths
- [x] Schema list helpers
- [x] useSales helpers + BFF
- [x] SalesHistoryWorkspace UI
- [x] Sale detail page helpers/labels
- [x] Trackers

## Remaining
- [ ] PR review / merge to `dev`

## Out of scope
Pay-off credit, cancel stock restore, CSV export, main merge

## Verification
- List shows non-zero items and cashier after real sales
- Detail shows business, cashier, line items
- SYNC after checkout without 5min wait
