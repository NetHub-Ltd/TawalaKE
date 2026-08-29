# Task Tracker

**Base / PR target:** `dev`  
**Branch:** `feat/product-workspace-stock-crud`

## Goal

Single PR: centralize stock in `stock_crud`, product workspace UI (Overview | History | Settings + Receive/Count/Adjust), audit on stock events, tests, theme-aligned UI.

## Completed

- [x] `backend/app/crud/stock.py` — restock, count, adjust, apply_movement, sale deduction, list_movements
- [x] Removed stock mutations from `store_crud`; finalize_checkout borrows `stock_crud`
- [x] Routes: restock/audit → stock_crud; added stock-adjust + movements
- [x] Tests: `test_stock_crud.py`; route mocks updated
- [x] Product workspace UI + API proxies
- [x] Theme tokens from `globals.css` (card, border, muted, brand-*)

## Out of scope

- Transfer / dispose first-class types
- Multi-branch true warehouse ledger
- k3s

## Verification

- Backend unit tests for stock_crud
- Manual checklist in PR body
