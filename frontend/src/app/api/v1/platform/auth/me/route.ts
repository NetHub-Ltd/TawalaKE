import { bearerFrom, proxyPlatform } from "@/lib/api/platform-proxy";

export async function GET(req: Request) {
  const authorization = bearerFrom(req);
  if (!authorization) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }
  return proxyPlatform("/platform/auth/me", {
    method: "GET",
    authorization,
  });
}
