import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ status: false, error: "Unauthorized" }, { status: 401 });
  }
  const sp = req.nextUrl.searchParams;
  const qs = new URLSearchParams();
  if (sp.get("business_id")) qs.set("business_id", sp.get("business_id")!);
  if (sp.get("active_only")) qs.set("active_only", sp.get("active_only")!);
  const url = backendUrl(`/catalog/categories?${qs.toString()}`);
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
