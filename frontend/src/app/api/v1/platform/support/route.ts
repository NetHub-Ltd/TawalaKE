import { NextRequest } from "next/server";
import { proxyPlatform } from "@/lib/api/platform-proxy";

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  return proxyPlatform("/platform/support", {
    method: "GET",
    authorization,
    searchParams: req.nextUrl.searchParams,
  });
}
