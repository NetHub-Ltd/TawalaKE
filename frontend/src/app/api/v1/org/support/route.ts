import { proxyAuthed } from "@/lib/api/messaging-proxy";

export async function GET(req: Request) {
  const url = new URL(req.url);
  return proxyAuthed("/org/support", {
    searchParams: url.searchParams,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ detail: "Invalid JSON" }, { status: 400 });
  }
  return proxyAuthed("/org/support", { method: "POST", body });
}
