import { backendUrl } from "@/lib/api/backend";

/**
 * Public plan catalogue for /pricing — no session required.
 */
export async function GET() {
  try {
    const res = await fetch(backendUrl("/organizations/plans/public"), {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upstream error";
    return Response.json(
      { status: false, message: msg, data: [] },
      { status: 502 }
    );
  }
}
