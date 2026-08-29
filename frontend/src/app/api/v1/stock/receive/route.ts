import { NextRequest, NextResponse } from "next/server";
import { proxyStockPost } from "@/lib/api/stockProxy";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  return proxyStockPost("/stock/receive", body, "Receive stock failed");
}
