# Task Tracker

**Repository:** https://github.com/NetHub-Ltd/TawalaKE.git  
**Base branch:** `dev`  
**Current branch:** `fix/credit-sale-tracking-and-invoice`

## Goal
Credit sales: customer walks with goods/services unpaid; stock always deducted; outstanding tracked; invoice issued for collection; UI reflects credit; past data remains readable.

## Approved Scope
Approved 2026-08-28 (defaults OK):
1. Live path only (`store_crud.finalize_checkout` + document worker + BFF + checkout/complete UI)
2. Credit (`PaymentMethod.INVOICE`): status `PENDING_PAYMENT`, no collecting Payment, stock deducted, invoice `amount_paid=0`
3. Cash: status `COMPLETED`, full Payment, receipt
4. Customer: no removed `sale_id`; reuse by phone; name required for credit
5. Idempotency on re-finalize
6. Initialize: real discount, line subtotals, cost_price_at_sale from cost when present
7. BFF forwards backend error detail
8. Frontend: Credit (pay later) labels + detection compatible with legacy rows
9. No historical data rewrite

## Completed Changes
- [x] `backend/app/crud/store.py` — initialize + finalize credit-aware
- [x] `backend/app/tasks/worker.py` — invoice vs receipt from outstanding status
- [x] BFF checkout error forwarding + sale-shaped success
- [x] CheckoutForm credit copy
- [x] CompleteSaleClient credit detection/labels
- [x] Trackers updated

## Remaining Changes
- [ ] Open PR into `dev`
- [ ] CI / review
- Follow-ups (out of scope): pay-off credit, cancel+restore stock, AR aging, historical backfill

## Explicitly Out of Scope
- Pay-off / cancel credit workflows
- MPESA/CARD UI
- Re-enabling commented routers
- Migrating legacy pseudo-invoice rows
- Merge to `main`

## Decisions Made
- D1 Stock on credit: always deduct
- D2 No Payment row on credit
- D3 Wire enum remains `INVOICE`; UI says Credit
- D4 Past data read-compatible only
- D5 Customer name required for credit; phone reuse
- D6 Pay-off/cancel = follow-up
- D7 Base = `dev`

## Relevant Risks
- Legacy COMPLETED+full-payment "invoice" rows still look paid (by design)
- Analytics skip PENDING_PAYMENT (credit not counted as collected)

## Verification Requirements
- Cash finalize → COMPLETED + payment + receipt path
- Credit finalize → PENDING_PAYMENT + no payment + invoice path
- Double finalize → 409
- Credit without name → 400
- BFF surfaces backend detail on error
