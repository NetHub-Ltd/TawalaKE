# Task: Period-scoped credit on dashboard

## Status
**Implementing** on `feat/dashboard-period-credit`

## Goal
Every money figure on Overview reflects the selected period where possible; credit shows issued + collected in-period, plus open outstanding (all-time) clearly labeled.

## Done
- [x] `credit_period_metrics`: issued (open in window + COLLECT-linked created in window + invoice edge) and collected (COLLECT-* payments in window)
- [x] Dashboard summary fields: credit_issued_period, credit_issued_count, credit_collected_period, credit_collected_count
- [x] Schema + FE types + settled strip: Credit issued / Credit collected / Open credit (outstanding)
- [x] Tests updated for extra queries

## Out of scope
- Nairobi timezone
- Changing how open outstanding is calculated (still all open PENDING_PAYMENT)
