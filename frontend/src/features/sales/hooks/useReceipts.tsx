import { useQuery } from '@tanstack/react-query';

// Query Key Factory
export const receiptKeys = {
  all: ['receipts'] as const,
  bySaleId: (saleId: string) => [...receiptKeys.all, saleId] as const,
};

// API Call
const fetchReceipt = async (saleId: string) => {
  const response = await fetch(`/api/v1/org/stores/sales/receipts?sale_id=${saleId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch receipt');
  }

  return response.json();
};

// Main Hook
export const useReceipt = (saleId: string | null | undefined) => {
  return useQuery({
    queryKey: receiptKeys.bySaleId(saleId!),
    queryFn: () => fetchReceipt(saleId!),
    enabled: !!saleId,                    // Only run when saleId exists
    staleTime: 5 * 60 * 1000,            // 5 minutes
    gcTime: 10 * 60 * 1000,              // 10 minutes (cache time)
    retry: 2,
    refetchOnWindowFocus: false,         // Usually not needed for receipts
  });
};