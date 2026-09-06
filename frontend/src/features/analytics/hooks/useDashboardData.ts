"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchReport,
  type AnalyticsRange,
} from "@/features/analytics/lib/fetchReport";

export type DashboardSummary = {
  gross_sales_volume?: number;
  total_tax_collected?: number;
  total_discounts_granted?: number;
  net_revenue_collected?: number;
  refund_deductions_volume?: number;
  total_completed_orders_count?: number;
  average_order_value?: number;
  cogs_volume?: number;
  gross_profit?: number;
  cash_volume?: number;
  mpesa_volume?: number;
  missing_cost_line_count?: number;
  credit_outstanding?: number;
  open_credit_sales?: number;
  expenses_total?: number;
  expenses_count?: number;
  profit_after_expenses?: number;
};

export type DashboardSeriesPoint = {
  date: string;
  net_revenue_collected?: number;
  gross_sales_volume?: number;
  total_completed_orders_count?: number;
  total_discounts_granted?: number;
  gross_profit?: number;
};

export type DashboardPayload = {
  period: string;
  window?: { start: string; end: string };
  summary: DashboardSummary;
  previous_summary?: DashboardSummary;
  series: DashboardSeriesPoint[];
};

export type HourlyPayload = {
  series: {
    hour: string;
    net_revenue?: number;
    orders?: number;
    gross_profit?: number;
    total_discounts_granted?: number;
  }[];
  window?: { start: string; end: string };
};

export type ProductRow = {
  product_id: string;
  sku?: string;
  name?: string;
  quantity_sold?: number;
  revenue?: number;
  cogs?: number;
  gross_profit?: number;
  margin_pct?: number;
};

export type ProductsPayload = { items: ProductRow[] };

export type StaffRow = {
  staff_id: string;
  full_name?: string;
  orders?: number;
  revenue?: number;
  gross_profit?: number;
  avg_ticket?: number;
  revenue_share_pct?: number;
};

export type StaffPayload = { items: StaffRow[] };

export type InsightCard = {
  code: string;
  severity: string;
  title: string;
  detail: string;
  metric?: number | null;
};

export type InsightsPayload = { insights: InsightCard[] };

/** Shared query key period fragment */
function periodKey(period: AnalyticsRange, date?: string) {
  return period === "custom" ? `custom:${date ?? ""}` : period;
}

export function useSalesDashboard(
  businessId: string,
  period: AnalyticsRange,
  date?: string
) {
  return useQuery({
    queryKey: ["report", "dashboard", businessId, periodKey(period, date)],
    queryFn: () =>
      fetchReport<DashboardPayload>(businessId, "dashboard", period, {
        ...(period === "custom" && date ? { date } : {}),
      }),
    enabled: Boolean(businessId) && (period !== "custom" || Boolean(date)),
    staleTime: 30_000,
  });
}

export function useHourlyReport(
  businessId: string,
  period: AnalyticsRange,
  enabled: boolean,
  date?: string
) {
  return useQuery({
    queryKey: ["report", "hourly", businessId, periodKey(period, date)],
    queryFn: () =>
      fetchReport<HourlyPayload>(businessId, "hourly", period, {
        ...(period === "custom" && date ? { date } : {}),
      }),
    enabled: Boolean(businessId) && enabled && (period !== "custom" || Boolean(date)),
    staleTime: 30_000,
  });
}

export function useProductsReport(
  businessId: string,
  period: AnalyticsRange,
  enabled: boolean,
  date?: string
) {
  return useQuery({
    queryKey: ["report", "products", businessId, periodKey(period, date)],
    queryFn: () =>
      fetchReport<ProductsPayload>(businessId, "products", period, {
        limit: "20",
        order_by: "gross_profit",
        ...(period === "custom" && date ? { date } : {}),
      }),
    enabled: Boolean(businessId) && enabled && (period !== "custom" || Boolean(date)),
    staleTime: 30_000,
  });
}

export function useStaffReport(
  businessId: string,
  period: AnalyticsRange,
  enabled: boolean,
  date?: string
) {
  return useQuery({
    queryKey: ["report", "staff", businessId, periodKey(period, date)],
    queryFn: () =>
      fetchReport<StaffPayload>(businessId, "staff", period, {
        limit: "50",
        ...(period === "custom" && date ? { date } : {}),
      }),
    enabled: Boolean(businessId) && enabled && (period !== "custom" || Boolean(date)),
    staleTime: 30_000,
  });
}
