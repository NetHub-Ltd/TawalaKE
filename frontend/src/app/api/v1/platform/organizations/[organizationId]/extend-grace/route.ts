import { bearerFrom, proxyPlatform } from "@/lib/api/platform-proxy";

type Ctx = { params: Promise<{ organizationId: string }> };

/** Proxy POST extend-grace; `days` query is forwarded to FastAPI. */
export async function POST(req: Request, ctx: Ctx) {
  const authorization = bearerFrom(req);
  if (!authorization) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const { organizationId } = await ctx.params;
  const { searchParams } = new URL(req.url);
  return proxyPlatform(
    `/platform/organizations/${organizationId}/extend-grace`,
    {
      method: "POST",
      authorization,
      searchParams,
    }
  );
}
