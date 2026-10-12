import { proxyPublic } from "@/lib/api/messaging-proxy";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ detail: "Invalid JSON" }, { status: 400 });
  }
  return proxyPublic(`/public/support/${encodeURIComponent(token)}/messages`, {
    method: "POST",
    body,
  });
}
