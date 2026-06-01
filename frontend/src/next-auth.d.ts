// src/types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    error?: string | null;
    user: {
      id: string;
      role: string;
      tenant_id: string;
      organization_id: string;
      business_id: string | null;
      active: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    error?: string | null;
    userProfile?: {
      id: string;
      email: string;
      name: string;
      role: string;
      tenant_id: string;
      organization_id: string;
      business_id: string | null;
      active: boolean;
    };
  }
}