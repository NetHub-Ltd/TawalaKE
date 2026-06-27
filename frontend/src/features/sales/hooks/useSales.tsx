"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

interface FetchSalesParams {
  businessId: string;
  saleId?: string;
  limit?: number;
}

// Exactly mirroring your backend schema
export interface SaleResponse {
  id: string;
  status: "PENDING_PAYMENT" | "COMPLETED" | "CANCELLED"; // Exact string enum mapping
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
}

/**
 * Normalizing API wrapper mapping parameters and handling shape transformations cleanly.
 */
const fetchSalesApi = async ({ businessId, saleId, limit = 20 }: FetchSalesParams): Promise<SaleResponse[]> => {
  const url = new URL(`/api/v1/org/stores/sales`, window.location.origin);
  
  url.searchParams.append("business_id", businessId);
  url.searchParams.append("limit", limit.toString());
  
  if (saleId) {
    url.searchParams.append("sale_id", saleId);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.detail || "Failed to retrieve terminal sales history.");
  }

  const data = await response.json();

  // If sale_id is provided, backend answers with a single Object {} instead of an Array []. 
  // We wrap it in an array here so your hook return signature remains completely consistent!
  return Array.isArray(data) ? data : [data];
};

/**
 * @Scribe_Audit
 * Architecture: Optimized TanStack stream utilizing deterministic state keys.
 * Data Hydration: Structured mapping accommodating shape variance between detail objects and lists.
 */
export const useSales = ({ businessId, saleId, limit = 20 }: FetchSalesParams) => {
  const queryClient = useQueryClient();

  const queryKey = ["business", businessId, "sales", { saleId, limit }];

  const queryInfo = useQuery({
    queryKey,
    queryFn: () => fetchSalesApi({ businessId, saleId, limit }),
    enabled: !!businessId, 
    staleTime: 1000 * 15, // 15 seconds fresh state for quick retail matching
    gcTime: 1000 * 60 * 5, // 5 minutes cache fallback holding tank
  });

  const refresh = async () => {
    // Invalidates all sales queries scoped under this business node
    await queryClient.invalidateQueries({ queryKey: ["business", businessId, "sales"] });
  };

  return {
    ...queryInfo,
    sales: queryInfo.data || [],
    refresh,
    error: queryInfo.error as Error | null,
  };
};