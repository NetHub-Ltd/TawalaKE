# Task Tracker

**Branch:** `fix/checkout-invoice-no-migration`  
**Base:** `main`  
**Constraint:** No database migrations.

## Status
- Invoice checkout: no INVOICE write to payments.method; PENDING_PAYMENT; no payment row
- Startup fix (approved Option A): remove Customer.sale_id from ORM; link only via sale.customer_id
