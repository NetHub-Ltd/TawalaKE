import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const business_id = searchParams.get("business_id");
  const sale_id = searchParams.get("sale_id");
  const page_size =
    searchParams.get("page_size") || searchParams.get("limit") || "20";
  const page = searchParams.get("page") || "1";

  if (!business_id) {
    return NextResponse.json(
      { error: "Business ID not provided" },
      { status: 400 },
    );
  }

  const qs = new URLSearchParams();
  qs.set("page", page);
  qs.set("page_size", page_size);
  if (sale_id) qs.set("sale_id", sale_id);

  const targetUrl = `${process.env.BACKEND_URL}/business/sales/${business_id}?${qs.toString()}`;

  const res = await fetch(targetUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail =
      (typeof body?.detail === "string" && body.detail) ||
      (typeof body?.error === "string" && body.error) ||
      res.statusText;
    return NextResponse.json({ error: detail, detail }, { status: res.status });
  }

  // Prefer ApiResponse.data envelope; fall back to body
  return NextResponse.json(body.data ?? body, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (!body) {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }

  const res = await fetch(`${process.env.BACKEND_URL}/business/new-sale`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail =
      (typeof data?.detail === "string" && data.detail) ||
      (typeof data?.error === "string" && data.error) ||
      "An error occurred";
    return NextResponse.json({ error: detail, detail }, { status: res.status });
  }

  return NextResponse.json(data, { status: 200 });
}
