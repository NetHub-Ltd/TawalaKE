"use client";

import { useQuery } from "@tanstack/react-query";
import type { SaleAnalyticsRow, AnalyticsRange } from "../types";
import {
  aggregateRows,
  filterByRange,
  filterPreviousRange,
  percentChange,
} from "../lib/mapAnalytics";

async function fetchSalesAnalytics(
  businessId: string
): Promise<SaleAnalyticsRow[]> {
  const res = await fetch(
    `/api/v1/org/stores/analytics`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Failed to load analytics");
  }

  const data = await res.json();
  // Support either a raw array or { data: [] }
  return Array.isArray(data) ? data : data.data ?? [];
}

export function useSalesAnalytics(
  businessId: string,
  range: AnalyticsRange = "7d"
) {
  const query = useQuery({
    queryKey: ["sales-analytics", businessId],
    queryFn: () => fetchSalesAnalytics(businessId),
    enabled: Boolean(businessId),
    staleTime: 60_000,
  });

  const rows = query.data ?? [];

  const currentRows = filterByRange(rows, range);
  const previousRows = filterPreviousRange(rows, range);

  const current = aggregateRows(currentRows);
  const previous = aggregateRows(previousRows);

  const revenueChange = percentChange(current.revenue, previous.revenue);
  const ordersChange = percentChange(current.orders, previous.orders);
  const aovChange = percentChange(current.aov, previous.aov);

  // Always build a 7-day series for the chart (fill missing days with 0)
  const weekRows = filterByRange(rows, "7d");
  const weekAgg = aggregateRows(weekRows);
  const weekSeries = buildLast7DaysSeries(weekAgg.series);

  return {
    ...query,
    current,
    previous,
    revenueChange,
    ordersChange,
    aovChange,
    weekSeries,
  };
}

function buildLast7DaysSeries(
  series: { date: string; revenue: number; orders: number }[]
) {
  const map = new Map(series.map((s) => [s.date, s]));
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
      revenue: map.get(key)?.revenue ?? 0,
    });
  }

  return result;
}