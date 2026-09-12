"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

interface FetchSalesParams {
  businessId: string;
  saleId?: string;
  limit?: number;
}

export interface SaleLineItem {
  name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  cost_price_at_sale?: number | null;
}

export interface SaleResponse {
  id: string;
  status: "PENDING_PAYMENT" | "COMPLETED" | "CANCELLED" | string;
  subtotal: number;
  discount: number;
  tax_rate?: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  updated_at?: string;
  currency?: string;
  business_id?: string;
  cashier_id?: string;
  business?: { id: string; name: string } | null;
  cashier?: { id: string; full_name?: string | null; email?: string | null } | null;
  customer?: { id: string; name: string; phone?: string | null } | null;
  items?: SaleLineItem[] | null;
  /** Server-computed helpers (additive) */
  item_count?: number | null;
  cashier_name?: string | null;
  [key: string]: unknown;
}

/** Line-item rows (not whole sales). */
function isLineItemRow(row: unknown): boolean {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  const hasLineFields =
    "unit_price" in r || "quantity" in r || "product_id" in r;
  const hasSaleFields = "status" in r || "cashier_id" in r || "business_id" in r;
  return hasLineFields && !hasSaleFields;
}

/** Sale header rows in a list envelope. */
function isSaleRow(row: unknown): boolean {
  if (!row || typeof row !== "object") return false;
  const r = row as Record<string, unknown>;
  return (
    ("status" in r || "total_amount" in r || "cashier_id" in r) &&
    !isLineItemRow(r)
  );
}

/** Map API line shapes → SaleLineItem. */
export function normalizeLineItems(raw: unknown): SaleLineItem[] {
  if (!Array.isArray(raw)) return [];
  const out: SaleLineItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const unit = Number(r.unit_price ?? r.unitPrice ?? 0);
    const qty = Number(r.quantity ?? r.qty ?? 0);
    const sub = Number(
      r.subtotal ?? r.total_price ?? r.line_total ?? unit * qty,
    );
    const name = String(
      r.name ?? r.product_name ?? r.label ?? r.sku ?? "Item",
    );
    const item: SaleLineItem = {
      name,
      unit_price: unit,
      quantity: qty,
      subtotal: sub,
    };
    if (r.cost_price_at_sale != null) {
      item.cost_price_at_sale = Number(r.cost_price_at_sale);
    }
    out.push(item);
  }
  return out;
}

function normalizeOneSale(raw: Record<string, unknown>): SaleResponse {
  const lineSource =
    raw.items ?? raw.sale_items ?? raw.line_items ?? raw.saleItems;
  const items = normalizeLineItems(lineSource);
  return {
    ...(raw as SaleResponse),
    items,
    item_count:
      typeof raw.item_count === "number"
        ? raw.item_count
        : items.length > 0
          ? items.length
          : (raw.item_count as number | null | undefined) ?? items.length,
  };
}

/**
 * Normalize any backend response into a clean SaleResponse[].
 * Paginated envelope `{ items: Sale[], meta }` vs single sale with line `items`.
 */
function normalizeSalesResponse(data: unknown): SaleResponse[] {
  if (Array.isArray(data)) {
    return data
      .filter((row) => isSaleRow(row))
      .map((row) => normalizeOneSale(row as Record<string, unknown>));
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // Nested data envelope
    if (obj.data && typeof obj.data === "object") {
      const nested = normalizeSalesResponse(obj.data);
      if (nested.length) return nested;
    }

    if (Array.isArray(obj.items)) {
      const first = obj.items[0];
      // Paginated sales list (or single-sale list)
      if (obj.meta != null || isSaleRow(first)) {
        return obj.items
          .filter((row) => isSaleRow(row))
          .map((row) => normalizeOneSale(row as Record<string, unknown>));
      }
      // Single sale whose `items` are line items only — handled below via id
    }

    if (
      (typeof obj.id === "string" || typeof obj.id === "object") &&
      ("status" in obj || "total_amount" in obj)
    ) {
      return [normalizeOneSale(obj)];
    }
  }

  return [];
}

/** Prefer server item_count; fall back to items array length. */
export function getSaleItemCount(sale: SaleResponse): number {
  if (typeof sale.item_count === "number" && Number.isFinite(sale.item_count)) {
    return sale.item_count;
  }
  if (Array.isArray(sale.items)) return sale.items.length;
  return 0;
}

export function getSaleCashierName(sale: SaleResponse): string {
  if (sale.cashier_name && String(sale.cashier_name).trim()) {
    return String(sale.cashier_name);
  }
  if (sale.cashier?.full_name && String(sale.cashier.full_name).trim()) {
    return String(sale.cashier.full_name);
  }
  return "—";
}

export function getSaleBusinessName(sale: SaleResponse): string {
  if (sale.business?.name && String(sale.business.name).trim()) {
    return String(sale.business.name);
  }
  return "—";
}

export function isCreditSale(sale: SaleResponse): boolean {
  return sale.status === "PENDING_PAYMENT";
}

const fetchSalesApi = async ({
  businessId,
  saleId,
  limit = 20,
}: FetchSalesParams): Promise<SaleResponse[]> => {
  const url = new URL(`/api/v1/org/stores/sales`, window.location.origin);

  url.searchParams.append("business_id", businessId);
  url.searchParams.append("page_size", String(limit));
  url.searchParams.append("limit", String(limit));

  if (saleId) {
    url.searchParams.append("sale_id", saleId);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { detail?: string; error?: string })?.detail ||
        (errorData as { error?: string })?.error ||
        "Failed to retrieve terminal sales history.",
    );
  }

  const data = await response.json();
  console.debug("raw sales response", data);

  return normalizeSalesResponse(data);
};

export const useSales = ({
  businessId,
  saleId,
  limit = 20,
}: FetchSalesParams) => {
  const queryClient = useQueryClient();

  const queryKey = ["business", businessId, "sales", { saleId, limit }];

  const queryInfo = useQuery({
    queryKey,
    queryFn: () => fetchSalesApi({ businessId, saleId, limit }),
    enabled: !!businessId,
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 5,
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["business", businessId, "sales"],
    });
  };

  return {
    ...queryInfo,
    sales: queryInfo.data ?? [],
    refresh,
    error: (queryInfo.error as Error) ?? null,
  };
};
