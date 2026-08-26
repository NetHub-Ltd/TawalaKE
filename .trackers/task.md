# Task Tracker

**Branch:** `fix/terminal-checkout-invoice-payment-method`  
**Base:** `main`  
**PR target:** `main`

## Authorized work
Fix terminal checkout “Generate invoice” → Something went wrong.

### Root cause
Frontend sent `payment_method: "CREDIT"`; backend `PaymentMethod` only accepts `CASH | MPESA | INVOICE | CARD`.

### Completed
- [x] Map Generate invoice → `INVOICE` in zod schema + select option
- [x] Surface BFF/backend error detail in toast description
- [x] Remove debug console.logs from submit path
- [x] Cash path unchanged (`CASH`)

### Verification
1. Terminal → cart → customer form → Generate invoice → sale completes / navigates to preview
2. Cash path still works
3. Failed checkout shows backend/BFF message in toast description
