import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

type Ctx = { params: Promise<{ businessId: string }> };

/** PATCH branch profile (tax_rate, receipt config, contact). */
export async function PATCH(req: NextRequest, context: Ctx) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = await context.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const res = await fetch(
      backendUrl(`/business/update-business/${businessId}`),
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data?.detail;
      const message =
        typeof detail === "string"
          ? detail
          : detail?.message || data?.message || data?.error || res.statusText;
      return NextResponse.json(
        { error: message, detail, code: detail?.code },
        { status: res.status },
      );
    }
    return NextResponse.json(data?.data ?? data, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Upstream unavailable",
      },
      { status: 502 },
    );
  }
}

/** GET single branch via list filter (no dedicated get route). */
export async function GET(_req: NextRequest, context: Ctx) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { businessId } = await context.params;
  const orgId = session.user?.organization_id;
  if (!orgId) {
    return NextResponse.json({ error: "Organization required" }, { status: 400 });
  }
  try {
    const res = await fetch(
      backendUrl(`/organizations/stores/${orgId}`),
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || res.statusText },
        { status: res.status },
      );
    }
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    const found = list.find((b: { id?: string }) => String(b.id) === String(businessId));
    if (!found) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }
    return NextResponse.json(found, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upstream unavailable" },
      { status: 502 },
    );
  }
}
