import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode";

interface JWTTokenStructure {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  error: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenant_id: string;
    organization_id: string;
    business_id: string;
    active: boolean;
  };
}

/**
 * Connects with your FastAPI backend node to swap a stale or expiring
 * access token for a fresh cryptographic key pair.
 */
async function refreshAccessToken(token: any): Promise<any> {
  try {
    console.warn(`Initiating token rotation sequence for user: ${token.user?.email}`);

    if (!token.refreshToken) {
      throw new Error("Refresh token missing from cookie storage snapshot");
    }

    const response = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: token.refreshToken,
      }),
    });

    if (!response.ok) {
      const logDetails = await response.text().catch(() => "No response body");
      throw new Error(`FastAPI rejected token rotation. Status: ${response.status}. Reason: ${logDetails}`);
    }

    const newTokens = await response.json();
    
    if (!newTokens.access_token) {
      throw new Error("FastAPI response payload is missing 'access_token'");
    }

    // Safely parse expiration from the new token's internal payload
    const decoded: any = jwtDecode(newTokens.access_token);
    const expiresAt = decoded.exp * 1000;

    console.log(`[auth] Token rotation successful. Next expiration window: ${new Date(expiresAt).toISOString()}`);

    return {
      ...token,
      accessToken: newTokens.access_token,
      // Fallback to existing refresh token if FastAPI doesn't cycle it out
      refreshToken: newTokens.refresh_token ?? token.refreshToken,
      expiresAt: expiresAt,
      error: null, 
    };
  } catch (error: any) {
    console.error("[auth] Critical session rotation failure:", error.message);
    
    return {
      ...token,
      // Flag session corruption to trigger automated purging down inside proxy.ts
      error: "RefreshTokenError",
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days absolute lifecycle ceiling
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credentials mapping parameters are incomplete");
        }

        // 1. Authenticate with your FastAPI login endpoint
        const response = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "password",
            username: credentials.email as string,
            password: credentials.password as string,
          }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          throw new Error(errorPayload.detail || "Invalid access credentials supplied");
        }

        const tokens = await response.json();
        console.log("Token Response Captured:", tokens);

        // 2. Extract profile details via the Bearer token context
        const profileResponse = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        if (!profileResponse.ok) {
          throw new Error("Unable to retrieve operational profile identity metadata");
        }
        
        const profile = await profileResponse.json();

        // 🔥 CRITICAL PRODUCTION FIX: Parse FastAPI's ISO String format into precise Unix milliseconds
        const expiresAt = Date.parse(tokens.expires_at);

        if (isNaN(expiresAt)) {
          console.error("[auth] Warning: FastAPI returned an invalid date format. Falling back to JWT decode.");
          const decoded: any = jwtDecode(tokens.access_token);
          return { ...profile, accessToken: tokens.access_token, refreshToken: tokens.refresh_token, expiresAt: decoded.exp * 1000 };
        }

        return {
          id: profile.id,
          email: profile.email,
          name: profile.full_name,
          role: "OWNER", // Temporally overide for testing
          // role: profile.role || "OWNER",
          tenant_id: profile.tenant_id,
          organization_id: profile.organization_id,
          business_id: profile.business_id,
          active: profile.active,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: expiresAt,
        };
      },
    }),
  ],

  callbacks: {
    // Callback 1: The Gatekeeper (Security verification on initial login)
    async signIn({ user }) {
      const u = user as any;
      if (u) {
        if (u.active === false) {
          console.warn(`[auth] Blocked entry for deactivated account profile: ${u.email}`);
          return "/login?error=AccountDeactivated";
        }
        if (!u.tenant_id && u.role) {
          console.error(`[auth] Owner login rejected due to missing organizational bounds: ${u.email}`);
          return "/login?error=MissingOrganization";
        }
      }
      return true;
    },

    // Callback 2: The Redirection Shield (Prevents Open Redirection Vulnerabilities)
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/org`;
    },

    // Callback 3: The Cryptographic JWT State Processor
    async jwt({ token, user, account }) {
      // Execute exclusively during the initial sign-in phase
      if (user && account?.provider === "credentials") {
        const u = user as any;
        console.log(`[auth] Building session cookie tokens for worker identifier: ${u.email}`);
        
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
            tenant_id: u.tenant_id,
            organization_id: u.organization_id,
            business_id: u.business_id,
            active: u.active,
          },
        };
      }

      // Proactive Check: Evaluate expiration using our safety buffer window
      // TODO
      const bufferWindowMs = 60 * 1000; 
      const tokenHasExpired = Date.now() + bufferWindowMs > (token.expiresAt as number);

      if (tokenHasExpired) {
        return await refreshAccessToken(token);
      }
      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        // Map authorization credentials and operational error signals down to the thread
        (session as any).accessToken = token.accessToken;
        (session as any).refreshToken = token.refreshToken;
        (session as any).error = token.error;

        if (token.user) {
          session.user.id = token.user.id;
          session.user.role = token.user.role;  
          session.user.tenant_id = token.user.tenant_id;
          session.user.organization_id = token.user.organization_id;
          session.user.business_id = token.user.business_id;
          session.user.active = token.user.active;
          session.user.name = token.user.name;
          session.user.email = token.user.email;
        }
      }
      
      return session;
    },
  },
});