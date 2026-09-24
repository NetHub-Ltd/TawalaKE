import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ status: false, error: "Unauthorized" }, { status: 401 });
  }
  const activeOnly = req.nextUrl.searchParams.get("active_only") ?? "true";
  const url = backendUrl(`/catalog/units?active_only=${activeOnly}`);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
