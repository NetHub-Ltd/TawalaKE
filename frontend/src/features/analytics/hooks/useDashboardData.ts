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
  series: { hour: string; net_revenue?: number; orders?: number }[];
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

export function useSalesDashboard(businessId: string, period: AnalyticsRange) {
  return useQuery({
    queryKey: ["report", "dashboard", businessId, period],
    queryFn: () => fetchReport<DashboardPayload>(businessId, "dashboard", period),
    enabled: Boolean(businessId),
    staleTime: 30_000,
  });
}

export function useHourlyReport(businessId: string, period: AnalyticsRange, enabled: boolean) {
  return useQuery({
    queryKey: ["report", "hourly", businessId, period],
    queryFn: () => fetchReport<HourlyPayload>(businessId, "hourly", period),
    enabled: Boolean(businessId) && enabled,
    staleTime: 30_000,
  });
}

export function useProductsReport(businessId: string, period: AnalyticsRange, enabled: boolean) {
  return useQuery({
    queryKey: ["report", "products", businessId, period],
    queryFn: () =>
      fetchReport<ProductsPayload>(businessId, "products", period, {
        limit: "20",
        order_by: "gross_profit",
      }),
    enabled: Boolean(businessId) && enabled,
    staleTime: 30_000,
  });
}

export function useStaffReport(businessId: string, period: AnalyticsRange, enabled: boolean) {
  return useQuery({
    queryKey: ["report", "staff", businessId, period],
    queryFn: () =>
      fetchReport<StaffPayload>(businessId, "staff", period, { limit: "50" }),
    enabled: Boolean(businessId) && enabled,
    staleTime: 30_000,
  });
}

export function useInsightsReport(businessId: string, period: AnalyticsRange, enabled: boolean) {
  return useQuery({
    queryKey: ["report", "insights", businessId, period],
    queryFn: () => fetchReport<InsightsPayload>(businessId, "insights", period),
    enabled: Boolean(businessId) && enabled,
    staleTime: 30_000,
  });
}
