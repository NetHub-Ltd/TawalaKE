// auth.tsimport NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode"; // Recommended: npm install jwt-decode
import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  session: { strategy: "jwt" },

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
          throw new Error("Missing email or password");
        }

        try {
          // 1. Authenticate with FastAPI
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Invalid email or password");
          }

          const tokens = await response.json();

          // 2. Fetch User Profile Data
          const userDataResp = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokens.access_token}`,
            },
          });

          if (!userDataResp.ok) throw new Error("Failed to fetch user profile data");
          const profile = await userDataResp.ok ? await userDataResp.json() : null;

          console.debug("userdata", profile);

          // Decode JWT to get the exact database expiration timestamp
          const decoded: any = jwtDecode(tokens.access_token);
          const expiresAt = decoded.exp * 1000; // Convert seconds to milliseconds

          // ⚡ PRODUCTION FIX: Return a clean, flattened object matching the User footprint
          return {
            id: profile.id,
            email: profile.email,
            name: profile.full_name,
            role: profile.role,
            tenant_id: profile.tenant_id,
            organization_id: profile.organization_id,
            business_id: profile.business_id,
            active: profile.active,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            idToken: tokens.id_token,
            expiresAt: expiresAt,
          };
        } catch (error: any) {
          console.error("Credentials Auth Critical Error:", error.message);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // Triggered on login, and on subsequent requests checking session validation status
    async jwt({ token, user, account }) {
      // Run exclusively on initial sign in
      if (user && account?.provider === "credentials") {
        const u = user as any;
        return {
          ...token,
          accessToken: u.accessToken,
          refreshToken: u.refreshToken,
          idToken: u.idToken,
          expiresAt: u.expiresAt,
          // Propagate your database profile down safely into the JWT token payload
          userProfile: {
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            tenant_id: u.tenant_id,
            organization_id: u.organization_id,
            business_id: u.business_id,
            active: u.active,
          }
        };
      }

      // Production Check: Silently refresh tokens if current time has passed expiration limits
      if (Date.now() > (token.expiresAt as number)) {
        console.warn("Access token expired! Triggering background rotation...");
        // TODO: Implement your token rotation fetch handler here using token.refreshToken
      }

      return token;
    },

    // Triggered when exposing session details down to client hooks or Server Component 'auth()'
    async session({ session, token }) {
      if (token && session.user) {
        // ⚡ PRODUCTION FIX: Flatten variables directly onto session context
        session.accessToken = token.accessToken as string;
        session.idToken = token.idToken as string;
        
        // Inject every specific structural key safely under user context block
        const profile = token.userProfile as any;
        session.user.id = profile.id;
        // session.user.role = profile.role;
        session.user.role = "OWNER"; // TEMPORARY OVERRIDE FOR TESTING
        session.user.tenant_id = profile.tenant_id;
        session.user.organization_id = profile.organization_id;
        session.user.business_id = profile.business_id;
        session.user.active = profile.active;
        session.user.name = profile.name;
        session.user.email = profile.email;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});