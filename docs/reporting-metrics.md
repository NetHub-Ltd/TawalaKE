# Reporting metrics & day boundaries

## Metric dictionary (overview)

| Field | Meaning |
|-------|---------|
| `net_revenue_collected` | Sum of completed sale `total_amount` in the period (tax-inclusive checkout total). Open credit sales are excluded until completed/collected paths land in rollups. |
| `total_completed_orders_count` | Count of completed sales rolled into the period. |
| `gross_profit` | `total_amount − known COGS` (`cost_price_at_sale`). Lines with null cost do not invent cost; `profit_is_provisional` / `missing_cost_line_count` flag incompleteness. |
| `cash_volume` / `mpesa_volume` / `card_volume` / `other_volume` | Payment rows on completed sales in the period. |
| `credit_outstanding` | **Live** sum of `PENDING_PAYMENT` sale totals (all open balances — not period-scoped). |
| `credit_issued_period` / `credit_collected_period` | Period-scoped credit activity. |
| `expenses_*` / `profit_after_expenses` | Operating expenses for the window when expense tracking is available. |
| `refund_deductions_volume` | Amount recorded when a sale is **reversed** in rollups via `apply_sale_to_rollups(..., sign=-1)` / `apply_refund_to_rollups`. |

## Refund / void integrity

- Completing a sale enqueues analytics outbox with **sign=+1**.
- Full refunds must call **`apply_refund_to_rollups(sale_id)`** (or `apply_sale_to_rollups(..., sign=-1)`) so net revenue, orders, tender mix, and `refund_deductions_volume` stay coherent.
- Do not reverse the same sale twice (caller idempotency).
- Partial refunds that only reverse part of the ticket need a dedicated path later; today full reverse is supported.

## Day boundaries (timezone)

**Current behavior (as of 2026-09):**

- Rollup grain (`date_dimension`, hourly buckets) uses **UTC day/hour floors**.
- Period presets (`today`, `yesterday`, `3d`, `7d`, `month`) are resolved with `datetime.now(timezone.utc)`.

Kenya operators work in **Africa/Nairobi (EAT, UTC+3)**. Sales between 21:00–23:59 EAT fall on the **next UTC calendar day**, so “Today” on the overview can disagree with local wall-clock expectation for late evening activity.

### Decision status

| Option | Status |
|--------|--------|
| Keep UTC + document | **Current** |
| Switch period windows + rollup floors to `Africa/Nairobi` | **Not implemented** — requires migration plan, backfill, and dual-read strategy |

Do **not** change production day boundaries without an explicit migration PR (backfill rollups, freeze deploy window, tests for 21:00–02:00 EAT edges).

### Recommended next step (when approved)

1. Add business timezone (default `Africa/Nairobi`).
2. Floor sale event times in that zone for `date_dimension`.
3. Resolve `period_windows` in that zone.
4. Backfill historical rollups or accept a cutover date.
5. Surface “Day in Africa/Nairobi” on the overview definition strip.
