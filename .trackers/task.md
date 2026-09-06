# feat/overview-wireframe-rebuild

## Goal
Phase 1 Overview rebuild per approved wireframe proposal.

## Done
- Dashboard + hourly accept `date` / period window via `resolve_window`
- BFF forwards period + date; pills: Today · Yesterday · 3d · 7d · Custom
- Sales: one MetricLineChart with tabs (Sales default), settled from non-zero methods
- Profit honesty via missing_cost_line_count
- Insights removed from Products/Staff panels
- HourlyPoint includes total_discounts_granted

## Out of scope (Phase 2)
- card_volume / invoice_volume rollup columns
- Nairobi timezone
- Credit pre-aggregation
