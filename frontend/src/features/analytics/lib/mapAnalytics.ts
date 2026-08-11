import type {
  SaleAnalyticsRow,
  AnalyticsRange,
  AnalyticsAggregate,
  DayPoint,
} from "../types";

function startOfDayUTC(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

function toDateKey(iso: string) {
  return iso.slice(0, 10);
}

export function filterByRange(
  rows: SaleAnalyticsRow[],
  range: AnalyticsRange,
  now = new Date()
): SaleAnalyticsRow[] {
  const today = startOfDayUTC(now);
  const from = new Date(today);
  const to = new Date(today);

  switch (range) {
    case "today":
      break;
    case "yesterday":
      from.setUTCDate(from.getUTCDate() - 1);
      to.setUTCDate(to.getUTCDate() - 1);
      break;
    case "3d":
      from.setUTCDate(from.getUTCDate() - 2);
      break;
    case "7d":
      from.setUTCDate(from.getUTCDate() - 6);
      break;
    case "month":
      from.setUTCDate(1);
      break;
  }

  return rows.filter((r) => {
    const d = startOfDayUTC(new Date(r.date_dimension));
    return d >= from && d <= to;
  });
}

/** Previous window of the same length (for % change). */
export function filterPreviousRange(
  rows: SaleAnalyticsRow[],
  range: AnalyticsRange,
  now = new Date()
): SaleAnalyticsRow[] {
  const today = startOfDayUTC(now);
  const from = new Date(today);
  const to = new Date(today);

  switch (range) {
    case "today":
      from.setUTCDate(from.getUTCDate() - 1);
      to.setUTCDate(to.getUTCDate() - 1);
      break;
    case "yesterday":
      from.setUTCDate(from.getUTCDate() - 2);
      to.setUTCDate(to.getUTCDate() - 2);
      break;
    case "3d":
      from.setUTCDate(from.getUTCDate() - 5);
      to.setUTCDate(to.getUTCDate() - 3);
      break;
    case "7d":
      from.setUTCDate(from.getUTCDate() - 13);
      to.setUTCDate(to.getUTCDate() - 7);
      break;
    case "month": {
      // previous calendar month
      const y = today.getUTCFullYear();
      const m = today.getUTCMonth();
      from.setUTCFullYear(y, m - 1, 1);
      to.setUTCFullYear(y, m, 0); // last day of previous month
      break;
    }
  }

  return rows.filter((r) => {
    const d = startOfDayUTC(new Date(r.date_dimension));
    return d >= from && d <= to;
  });
}

export function aggregateRows(rows: SaleAnalyticsRow[]): AnalyticsAggregate {
  const byDay = new Map<string, DayPoint>();

  let revenue = 0;
  let gross = 0;
  let tax = 0;
  let discounts = 0;
  let refunds = 0;
  let orders = 0;

  for (const r of rows) {
    const key = toDateKey(r.date_dimension);
    revenue += r.net_revenue_collected;
    gross += r.gross_sales_volume;
    tax += r.total_tax_collected;
    discounts += r.total_discounts_granted;
    refunds += r.refund_deductions_volume;
    orders += r.total_completed_orders_count;

    const existing = byDay.get(key);
    if (existing) {
      existing.revenue += r.net_revenue_collected;
      existing.orders += r.total_completed_orders_count;
    } else {
      byDay.set(key, {
        date: key,
        revenue: r.net_revenue_collected,
        orders: r.total_completed_orders_count,
      });
    }
  }

  const series = Array.from(byDay.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return {
    revenue,
    gross,
    tax,
    discounts,
    refunds,
    orders,
    aov: orders > 0 ? revenue / orders : 0,
    series,
  };
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function formatKES(n: number) {
  return `KES ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}