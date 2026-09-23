import { bearerFrom, proxyPlatform } from "@/lib/api/platform-proxy";

export async function GET(req: Request) {
  const authorization = bearerFrom(req);
  if (!authorization) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  return proxyPlatform("/platform/organizations", {
    method: "GET",
    authorization,
    searchParams,
  });
}

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
  return proxyPlatform("/platform/organizations", {
    method: "POST",
    body,
    authorization,
  });
}
