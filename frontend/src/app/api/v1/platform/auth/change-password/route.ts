import { bearerFrom, proxyPlatform } from "@/lib/api/platform-proxy";

export async function POST(req: Request) {
  const authorization = bearerFrom(req);
  if (!authorization) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ detail: "Invalid JSON body" }, { status: 400 });
  }
  return proxyPlatform("/platform/auth/change-password", {
    method: "POST",
    body,
    authorization,
  });
}
