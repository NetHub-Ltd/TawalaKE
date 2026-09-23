import { proxyPlatform } from "@/lib/api/platform-proxy";

/** BFF: browser → POST /api/v1/platform/auth/login → FastAPI */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { detail: "Invalid JSON body" },
      { status: 400 }
    );
  }
  return proxyPlatform("/platform/auth/login", { method: "POST", body });
}
