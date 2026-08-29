import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const API_BASE = process.env.BACKEND_URL;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized!" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("business_id");
  const productId = searchParams.get("product_id");
  const limit = searchParams.get("limit") || "50";
  const offset = searchParams.get("offset") || "0";
  if (!businessId || !productId) {
    return NextResponse.json({ error: "business_id and product_id required" }, { status: 400 });
  }
  const res = await fetch(
    `${API_BASE}/business/stock/movements/${businessId}/${productId}?limit=${limit}&offset=${offset}`,
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
