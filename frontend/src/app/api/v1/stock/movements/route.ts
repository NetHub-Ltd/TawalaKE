import { NextRequest, NextResponse } from "next/server";
import { proxyStockGet } from "@/lib/api/stockProxy";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("business_id");
  const productId = searchParams.get("product_id");
  const limit = searchParams.get("limit") || "50";
  const offset = searchParams.get("offset") || "0";
  if (!businessId || !productId) {
    return NextResponse.json(
      { error: "business_id and product_id required" },
      { status: 400 }
    );
  }
  const path = `/stock/movements/${businessId}/${productId}?limit=${limit}&offset=${offset}`;
  return proxyStockGet(path, "Failed to load stock movements");
}
