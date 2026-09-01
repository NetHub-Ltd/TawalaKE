import NextAuth, { CredentialsSignin, type User, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { jwtDecode } from "jwt-decode";

export interface AssignedBusiness {
  id: string;
  name: string;
}

export class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

export class MissingOrganizationError extends CredentialsSignin {
  code = "missing_organization";
}

export class ProfileFetchError extends CredentialsSignin {
  code = "profile_fetch_failed";
}

export class NetworkAuthError extends CredentialsSignin {
  code = "network_auth_error";
}

/**
 * Rotate backend access token. Tokens live on the Auth.js JWT (encrypted cookie),
 * not on the client-visible session.
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) {
      throw new Error("Missing refresh token");
    }

    const response = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token.refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "No error payload");
      throw new Error(
        `Token refresh rejected by backend: ${response.status} ${details}`,
      );
    }

    const newTokens = await response.json();

    if (!newTokens.access_token) {
      throw new Error("Backend refresh payload missing 'access_token'");
    }

    let expiresAt: number;
    if (newTokens.expires_at) {
      expiresAt = Date.parse(newTokens.expires_at);
    } else {
      const decoded: { exp?: number } = jwtDecode(newTokens.access_token);
      expiresAt = decoded.exp
        ? decoded.exp * 1000
        : Date.now() + 15 * 60 * 1000;
    }

    return {
      ...token,
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token ?? token.refreshToken,
      expiresAt,
      error: undefined,
    };
  } catch (error) {
    console.error("[Auth Engine] Token rotation failure:", error);

    return {
      ...token,
      accessToken: undefined,
      refreshToken: undefined,
      expiresAt: 0,
      error: "RefreshTokenError",
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  trustHost: true,

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new InvalidCredentialsError();
        }

        let loginResponse: Response;
        try {
          loginResponse = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "password",
              username: credentials.email as string,
              password: credentials.password as string,
            }),
            cache: "no-store",
          });
        } catch {
          throw new NetworkAuthError();
        }

        if (!loginResponse.ok) {
          throw new InvalidCredentialsError();
        }

        const tokens = await loginResponse.json();

        if (!tokens.access_token) {
          throw new InvalidCredentialsError();
        }

        let profileResponse: Response;
        try {
          profileResponse = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens.access_token}`,
            },
            cache: "no-store",
          });
        } catch {
          throw new NetworkAuthError();
        }

        if (!profileResponse.ok) {
          throw new ProfileFetchError();
        }

        const profile = await profileResponse.json();

        if (!profile.organization_id) {
          throw new MissingOrganizationError();
        }

        let expiresAt = Date.parse(tokens.expires_at);
        if (Number.isNaN(expiresAt)) {
          const decoded: { exp?: number } = jwtDecode(tokens.access_token);
          expiresAt = decoded.exp
            ? decoded.exp * 1000
            : Date.now() + 15 * 60 * 1000;
        }

        return {
          id: String(profile.id),
          email: profile.email,
          name: profile.full_name,
          role: profile.role,
          organization_id: profile.organization_id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      if (!user || !(user as User).organization_id) {
        throw new MissingOrganizationError();
      }
      return true;
    },

    async jwt({ token, user, account }): Promise<JWT> {
      if (user && account?.provider === "credentials") {
        const u = user as User;
        return {
          ...token,
          accessToken: u.accessToken,
          refreshToken: u.refreshToken,
          expiresAt: u.expiresAt,
          error: undefined,
          user: {
            id: u.id ?? undefined,
            email: u.email ?? undefined,
            name: u.name ?? undefined,
            role: u.role ?? undefined,
            organization_id: u.organization_id ?? undefined,
          },
        };
      }

      if (token.error === "RefreshTokenError") {
        return token;
      }

      const bufferMs = 60 * 1000;
      if (Date.now() + bufferMs > (token.expiresAt ?? 0)) {
        return refreshAccessToken(token);
      }

      return token;
    },

    /**
     * Client-visible session: identity only.
     * API bearer stays on the encrypted JWT cookie (getServerAccessToken).
     */
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      session.error = token.error as string | undefined;

      if (token.error || !token.user) {
        return session;
      }

      session.user = {
        ...session.user,
        id: token.user.id as string,
        email: token.user.email as string,
        name: token.user.name as string,
        role: token.user.role as string,
        organization_id: token.user.organization_id as string,
      };

      // Server Route Handlers may still read this via auth() on the server.
      // Prefer getServerAccessToken() for new code. Not required for client UI.
      session.accessToken = token.accessToken as string | undefined;

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch {
        // invalid URL
      }

      return `${baseUrl}/org`;
    },
  },
});
