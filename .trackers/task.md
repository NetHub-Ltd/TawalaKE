# Task Tracker

**Branch:** `fix/checkout-invoice-no-migration`  
**Base:** `main`  
**Constraint:** No database migrations authorized.

## Root cause
Live `payment_method_enum` = CASH|MPESA|CARD|BANK. Writing INVOICE → 500.

## Fix (application only)
- [x] API still accepts payment_method INVOICE (schema)
- [x] Never write INVOICE to payments.method
- [x] Invoice path: Sale.status=PENDING_PAYMENT, no Payment row; worker creates invoice from status
- [x] Cash path: Payment with CASH, status COMPLETED
- [x] Model PaymentMethod matches DB labels only; create_type=False
- [x] Customer.sale_id field on model (column already exists — not a migration)
- [x] BFF success = HTTP 2xx (Sale.status is not boolean)

## Explicitly NOT included
- No Alembic migrations
- No ALTER TYPE
