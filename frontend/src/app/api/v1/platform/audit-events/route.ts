import { bearerFrom, proxyPlatform } from "@/lib/api/platform-proxy";

export async function GET(req: Request) {
  const authorization = bearerFrom(req);
  if (!authorization) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  return proxyPlatform("/platform/audit-events", {
    method: "GET",
    authorization,
    searchParams,
  });
}
