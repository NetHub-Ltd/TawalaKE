# Task Tracker

**Branch:** `fix/terminal-checkout-invoice-payment-method`  
**PR:** #109 → `main`

## Authorized scope
1. Fix Generate invoice → INVOICE payment method (done)
2. Complete-sale screen + history View invoice (approved)

## Completed
- [x] CheckoutForm sends `INVOICE`; better error toasts
- [x] Complete-sale page: summary + Quick sale + View receipt/invoice
- [x] Checkout success redirects to complete-sale
- [x] Sales history: View invoice on PENDING_PAYMENT rows
- [x] Sale detail: View invoice for pending, View receipt for completed

## Verification
- `npm run build` (frontend) required before push
- Manual: invoice checkout → complete-sale → quick sale / view invoice
- History pending row → View invoice
