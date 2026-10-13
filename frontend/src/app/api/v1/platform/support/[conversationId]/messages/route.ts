import { NextRequest } from "next/server";
import { proxyPlatform } from "@/lib/api/platform-proxy";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await ctx.params;
  const authorization = req.headers.get("authorization");
  const body = await req.json().catch(() => null);
  return proxyPlatform(`/platform/support/${conversationId}/messages`, {
    method: "POST",
    authorization,
    body,
  });
}
