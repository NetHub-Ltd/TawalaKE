import { useQuery } from "@tanstack/react-query";

export const receiptKeys = {
  all: ["receipts"] as const,
  bySaleId: (saleId: string) => [...receiptKeys.all, saleId] as const,
};

function errorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const b = body as Record<string, unknown>;
  if (typeof b.detail === "string") return b.detail;
  if (b.detail && typeof b.detail === "object") {
    const d = b.detail as Record<string, unknown>;
    if (typeof d.message === "string") return d.message;
  }
  if (typeof b.error === "string") return b.error;
  if (typeof b.message === "string") return b.message;
  return fallback;
}

export class DocumentNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentNotReadyError";
  }
}

const fetchReceipt = async (saleId: string) => {
  const response = await fetch(
    `/api/v1/org/stores/sales/receipts?sale_id=${encodeURIComponent(saleId)}`,
    { credentials: "include", headers: { Accept: "application/json" } },
  );

  if (response.status === 404) {
    const error = await response.json().catch(() => ({}));
    throw new DocumentNotReadyError(
      errorMessage(error, "Document not ready yet — try again in a moment"),
    );
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(errorMessage(error, "Failed to fetch receipt"));
  }

  const body = await response.json();
  if (body && typeof body === "object" && body.data && !body.seller) {
    return body.data;
  }
  return body;
};

export const useReceipt = (saleId: string | null | undefined) => {
  return useQuery({
    queryKey: receiptKeys.bySaleId(saleId!),
    queryFn: () => fetchReceipt(saleId!),
    enabled: !!saleId,
    staleTime: 30_000,
    gcTime: 10 * 60 * 1000,
    retry: (count, err) => {
      if (err instanceof DocumentNotReadyError) return count < 12;
      return count < 2;
    },
    retryDelay: (n) => Math.min(800 * 2 ** n, 5000),
    // Keep polling while document is still generating
    refetchInterval: (query) => {
      if (query.state.data) return false;
      if (query.state.error instanceof DocumentNotReadyError) return 2000;
      return false;
    },
    refetchOnWindowFocus: true,
  });
};
