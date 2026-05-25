import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
// import { zUserRead } from "./lib/types/api/zod.gen";
// import { zUserRead } from "./lib/types/api/zod.gen";
import { zUserRead } from "./lib/types/zod.gen";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // debug: process.env.NODE_ENV === "development",
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: { params: { scope: "openid profile email" } },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // 1. INITIAL SIGN-IN
      if (account && user) {
        try {
          const response = await fetch(
            `${process.env.RESOURCE_SERVER_URL}/users/sync`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${account.access_token}` },
            },
          );

          if (!response.ok) throw new Error("Backend rejected IdP token");

          const backendUser = await response.json();
          const parsed_data = zUserRead.parse(backendUser);

          // hit another onboarding request to the backend, 
          // this will later remove the need for calling the resource server

          

          if (!parsed_data.is_active) {
            throw new Error("User account is inactive");
          }
          const onboarding_payload = {
            full_name: parsed_data.full_name,
            email: parsed_data.email,
            active: parsed_data.is_active,
            tenant_id: parsed_data.tenant_id,
          };

         const res = await fetch(`${process.env.BACKEND_URL}/tenants/onboarding`, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${account.access_token}`,
            // ⚡ FIX: Tells FastAPI to parse the incoming stringified body as JSON
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(onboarding_payload),
        });

        console.debug("Onboarding response status:", res.status); // Log status directly

        const res_data = await res.json();
        if (!res.ok) {
          // If your FastAPI custom validation error payload uses a field other than .message (like .detail), fallback safely
          throw new Error(res_data.message || res_data.detail || "Onboarding configuration failed");
        }

          return {
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            idToken: account.id_token, // Saved for federated logout
            expiresAt: (account.expires_at ?? 0) * 1000,
            user: {
              id: res_data?.id,
              fullName: res_data?.full_name,
              // email: parsed_data.email,
              isActive: parsed_data.is_active,
              // tenantId: parsed_data.tenant_id,
            },
          };
        } catch (error) {
          console.error("Backend Sync Error:", error);
          return { ...token, error: "SyncError" };
        }
      }

      // 2. STALE SESSION CLEARANCE
      // If the session was flagged as dead in a previous cycle, return null to delete the cookie
      if (
        token.error === "RefreshAccessTokenError" ||
        token.error === "SyncError"
      ) {
        console.warn("JWT: Cleaning up stale session cookie.");
        return null;
      }

      // 3. MAINTENANCE: Token Freshness check
      const now = Date.now();
      const buffer = 60 * 1000; // 1 minute
      if (now > (token.expiresAt as number) - buffer) {
        return await refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      // Pass all our custom data to the client-side session object
      if (token) {
        session.user = {
          ...session.user,
          ...(token.user as any),
        };
        session.accessToken = token.accessToken as string;
        session.idToken = token.idToken as string; // Available for federatedLogout action
        session.error = token.error as string;
      }
      return session;
    },
  },
});

async function refreshAccessToken(token: any) {
  console.log("Attempting token refresh...");
  try {
    const response = await fetch(
      `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.KEYCLOAK_CLIENT_ID!,
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
        }),
      },
    );

    const tokens = await response.json();
    if (!response.ok) throw tokens;

    console.log("Token refreshed successfully.");

    return {
      ...token,
      accessToken: tokens.access_token,
      idToken: tokens.id_token ?? token.idToken, // Update ID token if provided
      expiresAt: Date.now() + tokens.expires_in * 1000,
      refreshToken: tokens.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("Refresh Error Logic Triggered:", error);
    // Flag the token as dead
    return { ...token, error: "RefreshAccessTokenError" };
  }
}