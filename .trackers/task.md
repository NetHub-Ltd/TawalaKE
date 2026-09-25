# Task

## Current focus
Receipt thermal print reliability + sale/document integrity (post-merge on `dev`).

## Recently shipped (2026-09-25 → 2026-09-26)

| Area | PRs | Notes |
|------|-----|--------|
| Overview dashboard | #377–#382 | Smooth chart, credit split, expense KPIs, InsightsStrip, Month period |
| Expenses frontend | #381 | List + add (plan-gated) |
| Org hard-delete FK | #383 | Clear `sale_analytics_summaries` before businesses |
| Terminal totals | #390 #394 #395 | Services + discount in totals; tax gated to **0** until tax feature ships |
| Receipt / invoice | #396 #397 #399 | Services on document; thermal layout; **iframe + self-contained HTML print** |
| Product settings | #398 | Category + UoM catalog dropdowns (same as create) |
| Collect credit | #398 | Collect on invoice preview + sale history (no Customers detour) |

## Open / next candidates
- Platform shell proper dashboard (issues filed earlier; not started)
- Tax feature end-to-end (rates, invoices, compliance) — keep `TAX_FEATURE_ENABLED = false` until ready
- Vercel deploy status noise on some PRs (lint/build gates are the merge bar)

## Process rules
- Working branch base: **`dev`**
- All work via **PR → `dev`**; never push straight to `dev`/`main`
- Frontend: `npm run lint` + build must pass CI before merge
- Backend: framework tests for touched paths

## Out of scope for trackers churn
Production hotfixes without PR; changing `main` deploy pipeline without explicit approval.
