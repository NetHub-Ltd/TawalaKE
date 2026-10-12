import { proxyPublic } from "@/lib/api/messaging-proxy";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return Response.json({ detail: "Invalid JSON" }, { status: 400 });
  }
  return proxyPublic("/public/support", { method: "POST", body });
}
