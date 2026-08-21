// import NextAuth, { CredentialsSignin, type User, type Session } from "next-auth";
// import Credentials from "next-auth/providers/credentials";
// import { JWT } from "next-auth/jwt";
// import { jwtDecode } from "jwt-decode";

// // ---------------------------------------------------------------------------
// // 1. Domain Types & Type Augmentation (Server & Client Type Safety)
// // ---------------------------------------------------------------------------
// export interface AssignedBusiness {
//   id: string;
//   name: string;
// }

// // ---------------------------------------------------------------------------
// // 2. Custom Auth Errors – these surface on the login page via `code`
// // ---------------------------------------------------------------------------
// export class InvalidCredentialsError extends CredentialsSignin {
//   code = "invalid_credentials";
// }

// export class MissingOrganizationError extends CredentialsSignin {
//   code = "missing_organization";
// }

// export class ProfileFetchError extends CredentialsSignin {
//   code = "profile_fetch_failed";
// }

// export class NetworkAuthError extends CredentialsSignin {
//   code = "network_auth_error";
// }

// // ---------------------------------------------------------------------------
// // 3. Token Rotation – fails closed
// // ---------------------------------------------------------------------------
// async function refreshAccessToken(token: JWT): Promise<JWT> {
//   try {
//     if (!token.refreshToken) {
//       throw new Error("Missing refresh token");
//     }

//     const response = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ refresh_token: token.refreshToken }),
//       cache: "no-store",
//     });

//     if (!response.ok) {
//       const details = await response.text().catch(() => "No error payload");
//       throw new Error(
//         `Token refresh rejected by backend: ${response.status} ${details}`
//       );
//     }

//     const newTokens = await response.json();

//     if (!newTokens.access_token) {
//       throw new Error("Backend refresh payload missing 'access_token'");
//     }

//     let expiresAt: number;
//     if (newTokens.expires_at) {
//       expiresAt = Date.parse(newTokens.expires_at);
//     } else {
//       const decoded: { exp?: number } = jwtDecode(newTokens.access_token);
//       expiresAt = decoded.exp
//         ? decoded.exp * 1000
//         : Date.now() + 15 * 60 * 1000;
//     }

//     return {
//       ...token,
//       accessToken: newTokens.access_token,
//       refreshToken: newTokens.refresh_token ?? token.refreshToken,
//       expiresAt,
//       error: undefined,
//     };
//   } catch (error) {
//     console.error("[Auth Engine] Token rotation failure:", error);

//     return {
//       ...token,
//       accessToken: undefined,
//       refreshToken: undefined,
//       expiresAt: 0,
//       error: "RefreshTokenError",
//     };
//   }
// }

// // ---------------------------------------------------------------------------
// // 4. Main Auth.js Configuration
// // ---------------------------------------------------------------------------
// export const { handlers, auth, signIn, signOut } = NextAuth({
//   debug: process.env.NODE_ENV === "development",
//   trustHost: true,
//   session: {
//     strategy: "jwt",
//     maxAge: 7 * 24 * 60 * 60,
//   },
//   pages: {
//     signIn: "/login",
//     error: "/login",
//   },
//   providers: [
//     Credentials({
//       id: "credentials",
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },

//       async authorize(credentials): Promise<User | null> {
//         if (!credentials?.email || !credentials?.password) {
//           throw new InvalidCredentialsError();
//         }

//         let loginResponse: Response;
//         try {
//           loginResponse = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/x-www-form-urlencoded",
//             },
//             body: new URLSearchParams({
//               grant_type: "password",
//               username: credentials.email as string,
//               password: credentials.password as string,
//             }),
//             cache: "no-store",
//           });
//         } catch {
//           throw new NetworkAuthError();
//         }

//         if (!loginResponse.ok) {
//           throw new InvalidCredentialsError();
//         }

//         const tokens = await loginResponse.json();

//         if (!tokens.access_token) {
//           throw new InvalidCredentialsError();
//         }

//         let profileResponse: Response;
//         try {
//           profileResponse = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${tokens.access_token}`,
//             },
//             cache: "no-store",
//           });
//         } catch {
//           throw new NetworkAuthError();
//         }

//         if (!profileResponse.ok) {
//           throw new ProfileFetchError();
//         }

//         const profile = await profileResponse.json();
//         // console.log("Fetched profile:", profile);

//         if (!profile.organization_id) {
//           throw new MissingOrganizationError();
//         }

//         let expiresAt = Date.parse(tokens.expires_at);
//         if (isNaN(expiresAt)) {
//           const decoded: { exp?: number } = jwtDecode(tokens.access_token);
//           expiresAt = decoded.exp
//             ? decoded.exp * 1000
//             : Date.now() + 15 * 60 * 1000;
//         }

//         const businesses = profile.assigned_businesses ?? []
//         const topFive = businesses.splice(0, 2);

//         return {
//           id: String(profile.id),
//           email: profile.email,
//           name: profile.full_name,
//           role: profile.role,
//           organization_id: profile.organization_id,
//           assigned_businesses: topFive ?? [],
//           accessToken: tokens.access_token,
//           refreshToken: tokens.refresh_token,
//           expiresAt,
//         };
//       },
//     }),
//   ],

//   callbacks: {
//     async signIn({ user }) {
//       if (!user || !(user as User).organization_id) {
//         throw new MissingOrganizationError();
//       }
//       return true;
//     },

//     async jwt({ token, user, account }): Promise<JWT> {
//       if (user && account?.provider === "credentials") {
//         const u = user as User;
//         return {
//           ...token,
//           accessToken: u.accessToken,
//           refreshToken: u.refreshToken,
//           expiresAt: u.expiresAt,
//           error: undefined,
//           user: {
//             id: u.id ?? undefined,
//             email: u.email ?? undefined,
//             name: u.name ?? undefined,
//             role: u.role ?? undefined,
//             organization_id: u.organization_id ?? undefined,
//             assigned_businesses: u.assigned_businesses ?? [],
//           },
//         };
//       }

//       if (token.error === "RefreshTokenError") {
//         return token;
//       }

//       const bufferMs = 60 * 1000;
//       const isExpired = Date.now() + bufferMs > (token.expiresAt ?? 0);

//       if (isExpired) {
//         return await refreshAccessToken(token);
//       }

//       return token;
//     },

//     async session({
//       session,
//       token,
//     }: {
//       session: Session;
//       token: JWT;
//     }): Promise<Session> {
//       session.error = token.error;

//       if (token.error) {
//         return session;
//       }

//       if (token && session.user) {
//         session.accessToken = token.accessToken as string;
//         session.refreshToken = token.refreshToken as string;

//         if (token.user) {
//           session.user.id = token.user.id as string;
//           session.user.email = token.user.email as string;
//           session.user.name = token.user.name as string;
//           session.user.role = token.user.role as string;
//           session.user.organization_id = token.user.organization_id as string;
//           session.user.assigned_businesses = token.user.assigned_businesses ?? [];
//         }
//       }

//       return session;
//     },
//   },
// });

// import NextAuth, { CredentialsSignin, type User, type Session } from "next-auth";
// import Credentials from "next-auth/providers/credentials";
// import type { JWT } from "next-auth/jwt";
// import { jwtDecode } from "jwt-decode";

// // ---------------------------------------------------------------------------
// // 1. Domain types (businesses are loaded under /org, not from the session)
// // ---------------------------------------------------------------------------
// export interface AssignedBusiness {
//   id: string;
//   name: string;
// }

// // ---------------------------------------------------------------------------
// // 2. Custom auth errors – surface on the login page via `code`
// // ---------------------------------------------------------------------------
// export class InvalidCredentialsError extends CredentialsSignin {
//   code = "invalid_credentials";
// }

// export class MissingOrganizationError extends CredentialsSignin {
//   code = "missing_organization";
// }

// export class ProfileFetchError extends CredentialsSignin {
//   code = "profile_fetch_failed";
// }

// export class NetworkAuthError extends CredentialsSignin {
//   code = "network_auth_error";
// }

// // ---------------------------------------------------------------------------
// // 3. Token rotation – server-only, fails closed
// //    refreshToken lives only on the JWT (encrypted cookie), never on session
// // ---------------------------------------------------------------------------
// async function refreshAccessToken(token: JWT): Promise<JWT> {
//   try {
//     if (!token.refreshToken) {
//       throw new Error("Missing refresh token");
//     }

//     const response = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ refresh_token: token.refreshToken }),
//       cache: "no-store",
//     });

//     if (!response.ok) {
//       const details = await response.text().catch(() => "No error payload");
//       throw new Error(
//         `Token refresh rejected by backend: ${response.status} ${details}`,
//       );
//     }

//     const newTokens = await response.json();

//     if (!newTokens.access_token) {
//       throw new Error("Backend refresh payload missing 'access_token'");
//     }

//     let expiresAt: number;
//     if (newTokens.expires_at) {
//       expiresAt = Date.parse(newTokens.expires_at);
//     } else {
//       const decoded: { exp?: number } = jwtDecode(newTokens.access_token);
//       expiresAt = decoded.exp
//         ? decoded.exp * 1000
//         : Date.now() + 15 * 60 * 1000;
//     }

//     return {
//       ...token,
//       accessToken: newTokens.access_token,
//       refreshToken: newTokens.refresh_token ?? token.refreshToken,
//       expiresAt,
//       error: undefined,
//     };
//   } catch (error) {
//     console.error("[Auth Engine] Token rotation failure:", error);

//     return {
//       ...token,
//       accessToken: undefined,
//       refreshToken: undefined,
//       expiresAt: 0,
//       error: "RefreshTokenError",
//     };
//   }
// }

// // ---------------------------------------------------------------------------
// // 4. Main Auth.js configuration
// // ---------------------------------------------------------------------------
// export const { handlers, auth, signIn, signOut } = NextAuth({
//   debug: process.env.NODE_ENV === "development",
//   // trustHost: true,

//   session: {
//     strategy: "jwt",
//     maxAge: 7 * 24 * 60 * 60, // 7 days
//   },

//   pages: {
//     signIn: "/login",
//     error: "/login",
//   },

//   providers: [
//     Credentials({
//       id: "credentials",
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },

//       async authorize(credentials): Promise<User | null> {
//         if (!credentials?.email || !credentials?.password) {
//           throw new InvalidCredentialsError();
//         }

//         // ---- Login ----
//         let loginResponse: Response;
//         try {
//           loginResponse = await fetch(`${process.env.BACKEND_URL}/auth/login`, {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/x-www-form-urlencoded",
//             },
//             body: new URLSearchParams({
//               grant_type: "password",
//               username: credentials.email as string,
//               password: credentials.password as string,
//             }),
//             cache: "no-store",
//           });
//         } catch {
//           throw new NetworkAuthError();
//         }

//         if (!loginResponse.ok) {
//           throw new InvalidCredentialsError();
//         }

//         const tokens = await loginResponse.json();

//         if (!tokens.access_token) {
//           throw new InvalidCredentialsError();
//         }

//         // ---- Profile ----
//         let profileResponse: Response;
//         try {
//           profileResponse = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${tokens.access_token}`,
//             },
//             cache: "no-store",
//           });
//         } catch {
//           throw new NetworkAuthError();
//         }

//         if (!profileResponse.ok) {
//           throw new ProfileFetchError();
//         }

//         const profile = await profileResponse.json();

//         if (!profile.organization_id) {
//           throw new MissingOrganizationError();
//         }

//         // ---- Expiry ----
//         let expiresAt = Date.parse(tokens.expires_at);
//         if (Number.isNaN(expiresAt)) {
//           const decoded: { exp?: number } = jwtDecode(tokens.access_token);
//           expiresAt = decoded.exp
//             ? decoded.exp * 1000
//             : Date.now() + 15 * 60 * 1000;
//         }

//         // Minimal user – no assigned_businesses (loaded under /org later)
//         return {
//           id: String(profile.id),
//           email: profile.email,
//           name: profile.full_name,
//           role: profile.role,
//           organization_id: profile.organization_id,
//           accessToken: tokens.access_token,
//           refreshToken: tokens.refresh_token,
//           expiresAt,
//         };
//       },
//     }),
//   ],

//   callbacks: {
//     async signIn({ user }) {
//       if (!user || !(user as User).organization_id) {
//         throw new MissingOrganizationError();
//       }
//       return true;
//     },

//     /**
//      * JWT is server-side only (encrypted cookie).
//      * Holds accessToken + refreshToken for rotation and for Route Handlers
//      * that call auth() — never exposed to the browser via useSession().
//      */
//     async jwt({ token, user, account }): Promise<JWT> {
//       // Initial sign-in
//       if (user && account?.provider === "credentials") {
//         const u = user as User;
//         return {
//           ...token,
//           accessToken: u.accessToken,
//           refreshToken: u.refreshToken,
//           expiresAt: u.expiresAt,
//           error: undefined,
//           user: {
//             id: u.id ?? undefined,
//             email: u.email ?? undefined,
//             name: u.name ?? undefined,
//             role: u.role ?? undefined,
//             organization_id: u.organization_id ?? undefined,
//           },
//         };
//       }

//       // Hard stop after a failed refresh
//       if (token.error === "RefreshTokenError") {
//         return token;
//       }

//       // Rotate ~1 minute before expiry
//       const bufferMs = 60 * 1000;
//       const isExpired = Date.now() + bufferMs > (token.expiresAt ?? 0);

//       if (isExpired) {
//         return refreshAccessToken(token);
//       }

//       return token;
//     },

//     /**
//      * Client-visible session — keep this tiny for fast hydration.
//      * No accessToken, no refreshToken, no assigned_businesses.
//      */
//     async session({
//       session,
//       token,
//     }: {
//       session: Session;
//       token: JWT;
//     }): Promise<Session> {
//       session.error = token.error as string | undefined;

//       if (token.error || !token.user) {
//         return session;
//       }

//       session.user = {
//         ...session.user,
//         id: token.user.id as string,
//         email: token.user.email as string,
//         name: token.user.name as string,
//         role: token.user.role as string,
//         organization_id: token.user.organization_id as string,
//       };

//       return session;
//     },

//     /**
//      * Honour callbackUrl from middleware / login form.
//      * Allows only same-origin redirects; otherwise falls back to /org.
//      */
//     async redirect({ url, baseUrl }) {
//       if (url.startsWith("/")) {
//         return `${baseUrl}${url}`;
//       }

//       try {
//         if (new URL(url).origin === baseUrl) {
//           return url;
//         }
//       } catch {
//         // invalid URL
//       }

//       return `${baseUrl}/org`;
//     },
//   },
// });

import NextAuth, { CredentialsSignin, type User, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import { jwtDecode } from "jwt-decode";

// ---------------------------------------------------------------------------
// Domain (businesses are loaded under /org, not stored in the session cookie)
// ---------------------------------------------------------------------------
export interface AssignedBusiness {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Custom errors → login page via `code`
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
// Token rotation — runs inside jwt callback only
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Auth.js v5 config
// ---------------------------------------------------------------------------
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

      // Needed so auth() on the server can call your backend.
      // Client should not use this to call the API directly.
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