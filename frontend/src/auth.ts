// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",

  providers: [
    // Local Credentials Provider (Email + Password)
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
  if (!credentials?.email || !credentials?.password) {
    console.error("Missing email or password");
    return null;
  }

  try {
    const response = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded", // ← Important
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: credentials.email as string,      // FastAPI expects "username"
        password: credentials.password as string,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Login failed:", errorData);
      throw new Error(errorData.detail || "Invalid email or password");
    }

    const data = await response.json();
    console.debug('response', data)
    const userData = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.access_token}`,
      },
    });
    const user = await userData.json();
    console.debug('user', user)

    return {
      id: String(Date.now()),
      email: data.email, // Update this line
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idToken: data.id_token,
    };
  } catch (error) {
    console.error("Credentials Auth Error:", error);
    return null;
  }
},
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Handle local credentials login
      if (user && account?.provider === "credentials") {
        return {
          ...token,
          accessToken: (user as any).accessToken,
          refreshToken: (user as any).refreshToken,
          idToken: (user as any).idToken,
          expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
        };
      }

      // TODO: Add Keycloak logic here if still needed
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string;
        session.idToken = token.idToken as string;
        // You can add more fields later (role, organization_id, etc.)
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
});