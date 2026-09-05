"use client";

import { useQuery } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Types (match backend envelope + payload)
// ---------------------------------------------------------------------------

/** Period values accepted by GET /api/v1/reports/{businessId}/dashboard */
export type AnalyticsRange = "today" | "yesterday" | "3d" | "7d" | "month";

export type AnalyticsWindow = {
  start: string;
  end: string;
};

export type AnalyticsSummaryBlock = {
  gross_sales_volume: number;
  total_tax_collected: number;
  total_discounts_granted: number;
  net_revenue_collected: number;
  refund_deductions_volume: number;
  total_completed_orders_count: number;
  average_order_value: number;
};

export type AnalyticsSeriesPoint = {
  date: string;
  date_dimension: string;
  gross_sales_volume: number;
  total_tax_collected: number;
  total_discounts_granted: number;
  net_revenue_collected: number;
  refund_deductions_volume: number;
  total_completed_orders_count: number;
};

/** Inner `data` object from the analytics endpoint */
export type DashboardAnalyticsData = {
  period: string;
  window: AnalyticsWindow;
  previous_window: AnalyticsWindow;
  summary: AnalyticsSummaryBlock;
  previous_summary: AnalyticsSummaryBlock;
  series: AnalyticsSeriesPoint[];
};

/**
 * Standard API envelope:
 * { status, status_code, message, data }
 */
export type DashboardAnalyticsEnvelope = {
  status: boolean;
  status_code: number;
  message: string;
  data: DashboardAnalyticsData;
};

/** Shape used by Overview KPI cards */
export type OverviewMetrics = {
  revenue: number;
  gross: number;
  tax: number;
  discounts: number;
  refunds: number;
  orders: number;
  aov: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map backend summary → overview card metrics.
 */
function toOverviewMetrics(
  s?: AnalyticsSummaryBlock | null
): OverviewMetrics {
  return {
    revenue: s?.net_revenue_collected ?? 0,
    gross: s?.gross_sales_volume ?? 0,
    tax: s?.total_tax_collected ?? 0,
    discounts: s?.total_discounts_granted ?? 0,
    refunds: s?.refund_deductions_volume ?? 0,
    orders: s?.total_completed_orders_count ?? 0,
    aov: s?.average_order_value ?? 0,
  };
}

/**
 * Percent change between current and previous period values.
 */
function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Build a continuous last-7-days chart series (missing days → 0).
 */
function buildLast7DaysSeries(series: AnalyticsSeriesPoint[] | undefined) {
  const byDate = new Map(
    (series ?? []).map((p) => [
      p.date || p.date_dimension?.slice(0, 10) || "",
      p.net_revenue_collected ?? 0,
    ])
  );

  const result: { date: string; label: string; revenue: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i)
    );
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-KE", {
      weekday: "short",
      timeZone: "UTC",
    });

    result.push({
      date: key,
      label,
      revenue: byDate.get(key) ?? 0,
    });
  }

  return result;
}

export function formatKES(n: number) {
  return `KES ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

/**
 * Calls the Next BFF, which proxies to the FastAPI analytics endpoint.
 * Expects envelope: { status, status_code, message, data }.
 */
async function fetchDashboardAnalytics(
  businessId: string,
  period: AnalyticsRange
): Promise<DashboardAnalyticsData> {
  const params = new URLSearchParams({
    businessId,
    period,
  });

  const res = await fetch(`/api/v1/org/stores/analytics?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });

  const body = (await res.json().catch(() => ({}))) as
    | DashboardAnalyticsEnvelope
    | { error?: string; detail?: string; message?: string };

  if (!res.ok) {
    const err = body as { error?: string; detail?: string; message?: string };
    throw new Error(
      err.error || err.detail || err.message || "Failed to load analytics"
    );
  }

  const envelope = body as DashboardAnalyticsEnvelope;

  // Backend may still signal failure with HTTP 200 + status: false
  if (envelope.status === false || envelope.data == null) {
    throw new Error(envelope.message || "Analytics request failed");
  }

  return envelope.data;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Live dashboard analytics for a business.
 *
 * Returns overview-ready `current` / `previous` metrics, % changes,
 * and a 7-day `weekSeries` for the chart.
 */
export function useSalesAnalytics(
  businessId: string,
  range: AnalyticsRange = "7d"
) {
  const query = useQuery({
    queryKey: ["sales-analytics", businessId, range],
    queryFn: () => fetchDashboardAnalytics(businessId, range),
    enabled: Boolean(businessId),
    staleTime: 60_000,
  });

  const data = query.data;

  const current = toOverviewMetrics(data?.summary);
  const previous = toOverviewMetrics(data?.previous_summary);

  const revenueChange = percentChange(current.revenue, previous.revenue);
  const ordersChange = percentChange(current.orders, previous.orders);
  const aovChange = percentChange(current.aov, previous.aov);

  const weekSeries = buildLast7DaysSeries(data?.series);

  return {
    ...query,
    current,
    previous,
    revenueChange,
    ordersChange,
    aovChange,
    weekSeries,
    /** Full `data` object from the envelope */
    raw: data,
  };
}