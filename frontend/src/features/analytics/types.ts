export type SaleAnalyticsRow = {
  id: string;
  business_id: string;
  date_dimension: string;
  gross_sales_volume: number;
  total_tax_collected: number;
  total_discounts_granted: number;
  net_revenue_collected: number;
  refund_deductions_volume: number;
  total_completed_orders_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AnalyticsRange = "today" | "yesterday" | "3d" | "7d" | "month";

export type DayPoint = {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
};

export type AnalyticsAggregate = {
  revenue: number;
  gross: number;
  tax: number;
  discounts: number;
  refunds: number;
  orders: number;
  aov: number;
  series: DayPoint[];
};