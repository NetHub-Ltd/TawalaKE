import { proxyAuthed } from "@/lib/api/messaging-proxy";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ detail: "Invalid JSON" }, { status: 400 });
  }
  return proxyAuthed(`/org/messages/${conversationId}/messages`, {
    method: "POST",
    body,
  });
}
