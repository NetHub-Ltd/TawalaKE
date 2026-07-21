// File Path: src/types/next-auth.d.ts

import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Represents the user payload returned from the authorize callback
   * and seeded into session/JWT flows.
   */
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    organization_id: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }

  /**
   * Represents the session object available across client and server contexts.
   */
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    error?: string | null;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      organization_id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /**
   * Represents the persisted JSON Web Token used in the JWT session strategy.
   */
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string | null;
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
      organization_id: string;
    };
  }
}