import { NextRequest } from "next/server";
import { proxyPlatform } from "@/lib/api/platform-proxy";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await ctx.params;
  const authorization = req.headers.get("authorization");
  return proxyPlatform(`/platform/support/${conversationId}`, {
    method: "GET",
    authorization,
  });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await ctx.params;
  const authorization = req.headers.get("authorization");
  const body = await req.json().catch(() => null);
  return proxyPlatform(`/platform/support/${conversationId}`, {
    method: "PATCH",
    authorization,
    body,
  });
}
