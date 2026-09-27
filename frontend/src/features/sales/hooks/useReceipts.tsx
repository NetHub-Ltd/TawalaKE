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

const fetchReceipt = async (saleId: string) => {
  const response = await fetch(
    `/api/v1/org/stores/sales/receipts?sale_id=${encodeURIComponent(saleId)}`,
    { credentials: "include", headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const msg = errorMessage(
      error,
      response.status === 404
        ? "Document not ready yet — try again in a moment"
        : "Failed to fetch receipt",
    );
    throw new Error(msg);
  }

  const body = await response.json();
  // Support both bare snapshot and { data: snapshot } envelopes
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    // Document may still be generating right after checkout
    retry: (count, err) => {
      if (count >= 4) return false;
      const m = err instanceof Error ? err.message : "";
      return /not ready|404|queued/i.test(m) || count < 2;
    },
    retryDelay: (n) => Math.min(1000 * 2 ** n, 8000),
    refetchOnWindowFocus: false,
  });
};
