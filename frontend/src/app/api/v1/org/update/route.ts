import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const orgId =
    (session.user as { organization_id?: string })?.organization_id ||
    new URL(req.url).searchParams.get("organization_id");
  if (!orgId) {
    return NextResponse.json({ message: "Missing organization id" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }
  try {
    const res = await fetch(
      backendUrl(`/organizations/update-org?organization_id=${orgId}`),
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    const message =
      e instanceof Error && e.message.includes("BACKEND_URL")
        ? "Backend URL not configured"
        : "Upstream unavailable";
    return NextResponse.json({ message }, { status: 502 });
  }
}
