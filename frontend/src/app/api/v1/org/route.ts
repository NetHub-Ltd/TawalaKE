import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const organization_id =
    searchParams.get("organization_id") ||
    (session.user as { organization_id?: string })?.organization_id;

  if (!organization_id) {
    return NextResponse.json(
      { error: "Organization ID not provided" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(backendUrl(`/organizations/${organization_id}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            data?.message ||
            data?.detail ||
            data?.error ||
            res.statusText ||
            "Failed to load organization",
        },
        { status: res.status },
      );
    }
    if (data?.status === false) {
      return NextResponse.json(
        { error: data.message || "Failed to load organization" },
        { status: 502 },
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
