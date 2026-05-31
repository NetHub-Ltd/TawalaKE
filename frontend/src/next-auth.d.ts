// next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    user: {
      id: string;
      role: string;
      tenant_id: string;
      organization_id: string | null;
      business_id: string | null;
      active: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: string;
    tenant_id?: string;
    organization_id?: string | null;
    business_id?: string | null;
    active?: boolean;
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    userProfile?: {
      id: string;
      email: string;
      name: string;
      role: string;
      tenant_id: string;
      organization_id: string | null;
      business_id: string | null;
      active: boolean;
    };
  }
}