export type AnalyticsRange = "today" | "yesterday" | "3d" | "7d" | "month";
export type ReportResource =
  | "dashboard"
  | "hourly"
  | "products"
  | "staff"
  | "insights";

export async function fetchReport<T>(
  businessId: string,
  resource: ReportResource,
  period: AnalyticsRange,
  extra?: Record<string, string>
): Promise<T> {
  const params = new URLSearchParams({
    businessId,
    resource,
    period,
    ...extra,
  });
  const res = await fetch(`/api/v1/org/reports?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      body.error || body.detail || body.message || "Failed to load report"
    );
  }
  // Backend often wraps in { status, data }
  return (body?.data !== undefined ? body.data : body) as T;
}
