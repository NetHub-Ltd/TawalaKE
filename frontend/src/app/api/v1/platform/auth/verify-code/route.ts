import { proxyPlatform } from "@/lib/api/platform-proxy";

/** BFF: MFA verify (when backend MFA is deployed). */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ detail: "Invalid JSON body" }, { status: 400 });
  }
  return proxyPlatform("/platform/auth/verify-code", { method: "POST", body });
}
