import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

/** Proxy GET /api/v1/jobs/history → FastAPI durable job history */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const qs = req.nextUrl.searchParams.toString();
  try {
    const res = await fetch(
      backendUrl(`/jobs/history${qs ? `?${qs}` : ""}`),
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    const message =
      e instanceof Error && e.message.includes("BACKEND_URL")
        ? "Backend URL not configured"
        : "Upstream unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
