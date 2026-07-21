import NextAuth, { CredentialsSignin, type User, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { jwtDecode } from "jwt-decode";

// ---------------------------------------------------------------------------
// 1. Custom Auth Errors for Precise Client-Side Error Propagation
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// 2. Resilient Token Rotation Service
// ---------------------------------------------------------------------------
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refreshToken) {
      throw new Error("Missing refresh token context");
    }

    const response = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token.refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "No error payload");
      throw new Error(`Token refresh rejected by backend: ${response.status} ${details}`);
    }

    const newTokens = await response.json();

    if (!newTokens.access_token) {
      throw new Error("Backend refresh payload missing 'access_token'");
    }

    const decoded: { exp?: number } = jwtDecode(newTokens.access_token);
    const expiresAt = decoded.exp ? decoded.exp * 1000 : Date.now() + 15 * 60 * 1000;

    return {
      ...token,
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token ?? token.refreshToken,
      expiresAt,
      error: null,
    };
  } catch (error) {
    console.error("[Auth Engine] Token rotation failure:", error);
    return {
      ...token,
      error: "RefreshTokenError",
    };
  }
}

// ---------------------------------------------------------------------------
// 3. Main Auth.js Engine Configuration
// ---------------------------------------------------------------------------
export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30-day absolute ceiling
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
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

        // console.log("login request", loginResponse)

        if (!loginResponse.ok) {
          console.error("we encountered an error when trying to authenticate", loginResponse.statusText)
          throw new InvalidCredentialsError();
        }

        const tokens = await loginResponse.json();
        // console.log("Login Response", tokens);

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

        console.debug("[AUTH] user profile fetch response", profileResponse)

        if (!profileResponse.ok) {
          throw new ProfileFetchError();
        }

        const profile = await profileResponse.json();
        console.log("Fetched user profile", profile)

        // Strict Business Rule Guard: Reject missing or null organization IDs
        if (!profile.organization_id) {
          throw new MissingOrganizationError();
        }

        // Resilient Fallback Resolution for Role Schema Variations
        const resolvedRole = profile.role

        if (!resolvedRole) {
          console.warn("[Auth Engine] Warning: No role specified in user profile payload.");
        }

        let expiresAt = Date.parse(tokens.expires_at);
        if (isNaN(expiresAt)) {
          const decoded: { exp?: number } = jwtDecode(tokens.access_token);
          expiresAt = decoded.exp ? decoded.exp * 1000 : Date.now() + 15 * 60 * 1000;
        }

        return {
          id: String(profile.id),
          email: profile.email,
          name: profile.full_name,
          role: resolvedRole,
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
          error: null,
          user: {
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            organization_id: u.organization_id,
          },
        };
      }

      const bufferMs = 60 * 1000;
      const isExpired = Date.now() + bufferMs > (token.expiresAt ?? 0);

      if (isExpired) {
        return await refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (token && session.user) {
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        session.error = token.error;

        if (token.user) {
          session.user.id = token.user.id;
          session.user.email = token.user.email;
          session.user.name = token.user.name;
          session.user.role = token.user.role;
          session.user.organization_id = token.user.organization_id;
        }
      }

      return session;
    },
  },
});