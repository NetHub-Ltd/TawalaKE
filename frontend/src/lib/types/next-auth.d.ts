// import { DefaultSession } from "next-auth";

// declare module "next-auth" {
//   interface Session {
//     accessToken?: string;
//     error?: string; // Used to track refresh failures
//     user: {
//       id: string;
//       tenantId: string;
//       isActive: boolean;
//     } & DefaultSession["user"];
//   }

//   // This matches what Keycloak/Your Backend returns during sign-in
//   interface User {
//     id: string;
//     tenant_id: string;
//     is_active: boolean;
//     full_name?: string;
//   }
// }

// declare module "next-auth/jwt" {
//   interface JWT {
//     accessToken?: string;
//     refreshToken?: string;
//     expiresAt?: number;
//     error?: string;
//     // Matching your logic: token.user.tenantId
//     user?: {
//       id: string;
//       tenantId: string;
//       isActive: boolean;
//     };
//   }
// }

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      isActive: boolean;
    } & DefaultSession["user"];
    accessToken: string;
    idToken: string;
    error?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    user: {
      id: string;
      tenantId: string;
      isActive: boolean;
    };
    error?: string;
  }
}
