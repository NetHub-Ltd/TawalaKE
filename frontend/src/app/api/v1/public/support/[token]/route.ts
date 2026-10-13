import { proxyPublic } from "@/lib/api/messaging-proxy";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;
  return proxyPublic(`/public/support/${encodeURIComponent(token)}`);
}
