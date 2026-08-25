import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const res = await fetch(backendUrl("/organizations/onboarding-status"), {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    const message = e instanceof Error && e.message.includes("BACKEND_URL")
      ? "Backend URL not configured"
      : "Upstream unavailable";
    return NextResponse.json({ message }, { status: 502 });
  }
}
