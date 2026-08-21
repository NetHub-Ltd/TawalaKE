// lib/auth/get-server-access-token.ts
import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";

export type ServerAuthToken = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    organization_id?: string;
  };
};

/**
 * Reads the encrypted Auth.js JWT from cookies (server-only).
 * Use this in Server Components, Route Handlers, and server actions
 * when you need accessToken — never expose it via the client session.
 */
export async function getServerAuthToken(): Promise<ServerAuthToken | null> {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    console.error("[getServerAuthToken] AUTH_SECRET is not set");
    return null;
  }

  const cookieStore = await cookies();

  // Build a cookie header string for getToken (App Router)
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  if (!cookieHeader) {
    return null;
  }

  let token: JWT | null = null;

  try {
    token = await getToken({
      req: {
        headers: {
          cookie: cookieHeader,
        },
      } as Parameters<typeof getToken>[0]["req"],
      secret,
      secureCookie: process.env.NODE_ENV === "production",
    });
  } catch (error) {
    console.error("[getServerAuthToken] Failed to decode JWT:", error);
    return null;
  }

  if (!token) {
    return null;
  }

  // Refresh failed earlier — treat as unauthenticated
  if (token.error === "RefreshTokenError") {
    return {
      accessToken: "",
      error: "RefreshTokenError",
      user: token.user as ServerAuthToken["user"],
    };
  }

  const accessToken = token.accessToken as string | undefined;

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: token.refreshToken as string | undefined,
    expiresAt: token.expiresAt as number | undefined,
    error: token.error as string | undefined,
    user: token.user as ServerAuthToken["user"],
  };
}

/**
 * Convenience: access token only, or null if missing / invalid.
 */
export async function getServerAccessToken(): Promise<string | null> {
  const token = await getServerAuthToken();

  if (!token || token.error || !token.accessToken) {
    return null;
  }

  return token.accessToken;
}