import { auth } from "@/auth";
import { getServerAccessToken } from "@/lib/auth/get-server-access-token";

export type ApiAuth = {
  accessToken: string;
  user: {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string;
    organization_id?: string;
  };
};

/**
 * Resolve bearer token for BFF → backend calls.
 * Prefer encrypted JWT cookie; fall back to auth() session on server.
 */
export async function requireApiAuth(): Promise<ApiAuth | null> {
  const token = await getServerAccessToken();
  const session = await auth();

  if (session?.error) {
    return null;
  }

  const accessToken = token ?? session?.accessToken ?? null;
  if (!accessToken || !session?.user) {
    return null;
  }

  return {
    accessToken,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      organization_id: session.user.organization_id,
    },
  };
}

/** True when path org segment matches authenticated staff organization. */
export function orgMatchesSession(
  pathOrgId: string | undefined | null,
  sessionOrgId: string | undefined | null,
): boolean {
  if (!pathOrgId || !sessionOrgId) return false;
  return String(pathOrgId) === String(sessionOrgId);
}
