// import { DefaultSession } from "next-auth";
// import "next-auth/jwt"; // Use empty import for JWT augmentation

// interface AssignedBusiness {
//   [key: string]: unknown;
// }

// declare module "next-auth" {
//   /**
//    * Represents the user payload returned from the authorize callback
//    * and seeded into session/JWT flows.
//    */

//   interface User {
//     role?: string;
//     organization_id?: string;
//     assigned_businesses?: AssignedBusiness[];
//     accessToken?: string;
//     refreshToken?: string;
//     expiresAt?: number;
//   }

//   interface Session {
//     accessToken?: string;
//     refreshToken?: string;
//     error?: string;
//     user: {
//       id: string;
//       email: string;
//       name: string;
//       role: string;
//       organization_id: string;
//       assigned_businesses: AssignedBusiness[];
//     };
//   }
// }

// declare module "next-auth/jwt" {
//   interface JWT {
//     accessToken?: string;
//     refreshToken?: string;
//     expiresAt?: number;
//     error?: string;
//     user?: {
//       id?: string;
//       email?: string;
//       name?: string;
//       role?: string;
//       organization_id?: string;
//       assigned_businesses?: AssignedBusiness[];
//     };
//   }
// }
  
// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
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