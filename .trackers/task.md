# Task Tracker

**Branch:** `fix/checkout-invoice-enum-and-complete-sale`  
**Base:** `main`

## Problem
Invoice checkout returned 500. Root cause: Postgres `payment_method_enum` is
`CASH|MPESA|CARD|BANK` (initial migration). App writes `INVOICE` → invalid enum.

## Fix (not a client-only remap)
- [x] Alembic `c4f8a91b2e10` adds INVOICE to payment_method_enum
- [x] Prestart `ensure_payment_method_enum` (idempotent, AUTOCOMMIT)
- [x] PaymentMethod model includes BANK + INVOICE; `create_type=False`
- [x] Customer.sale_id restored on model (DB column exists)
- [x] finalize_checkout: INVOICE → PENDING_PAYMENT, payment amount 0
- [x] BFF checkout: HTTP status is success criteria (Sale has .status string)
- [x] Complete-sale UX already on main (PR #109)

## Deploy notes
Restart backend so prestart runs (or `alembic upgrade` for c4f8a91b2e10).
