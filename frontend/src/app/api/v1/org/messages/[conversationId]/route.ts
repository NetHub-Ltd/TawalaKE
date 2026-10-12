import { proxyAuthed } from "@/lib/api/messaging-proxy";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await ctx.params;
  return proxyAuthed(`/org/messages/${conversationId}`);
}
