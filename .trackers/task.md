# Task Tracker

**Branch:** `fix/checkout-invoice-no-migration`

## Approved backend-first work
- [x] finalize reloads sale with full eager graph after commit
- [x] POST /checkout → ApiResponse[SaleReadWithRelations]
- [x] Purge `sales` cache on checkout + new-sale
- [x] Complete-sale UI: pending (amber) vs completed (emerald) from API status
- [x] No migrations

## Status rules
- INVOICE intent → PENDING_PAYMENT, no payment row
- CASH/etc → COMPLETED + Payment with DB-legal method
