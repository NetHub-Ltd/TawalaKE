import { bearerFrom, proxyPlatform } from "@/lib/api/platform-proxy";

type Ctx = { params: Promise<{ organizationId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const authorization = bearerFrom(req);
  if (!authorization) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const { organizationId } = await ctx.params;
  return proxyPlatform(`/platform/organizations/${organizationId}`, {
    method: "GET",
    authorization,
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const authorization = bearerFrom(req);
  if (!authorization) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const { organizationId } = await ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ detail: "Invalid JSON body" }, { status: 400 });
  }
  return proxyPlatform(`/platform/organizations/${organizationId}`, {
    method: "PATCH",
    body,
    authorization,
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const authorization = bearerFrom(req);
  if (!authorization) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const { organizationId } = await ctx.params;
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  return proxyPlatform(`/platform/organizations/${organizationId}`, {
    method: "DELETE",
    body,
    authorization,
  });
}
