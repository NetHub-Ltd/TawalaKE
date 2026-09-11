/**
 * Shared customer types for list + workspace.
 * Mirrors backend CustomerResponse / CustomerDetailResponse.
 */
export type CustomerRow = {
  id: string;
  business_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  open_credit_total?: number;
  open_credit_sales_count?: number;
  lifetime_revenue?: number;
  completed_orders_count?: number;
};

export type CustomerSaleRow = {
  id: string;
  status: string;
  total_amount: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CustomerDetail = CustomerRow & {
  recent_sales?: CustomerSaleRow[];
};

export function formatKES(n?: number) {
  const v = Number(n || 0);
  return `Ksh ${v.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
