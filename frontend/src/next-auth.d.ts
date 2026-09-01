import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    /** Server BFFs may read this; prefer getServerAccessToken for new code. */
    accessToken?: string;
    error?: string;
    user: {
      id: string;
      role: string;
      organization_id: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    organization_id?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
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
  }
}
