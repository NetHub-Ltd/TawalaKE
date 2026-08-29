// src/features/auth/actions/login.ts
"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type LoginState = {
  error?: string;
  code?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required", code: "invalid_credentials" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/org",
    });

    // If we reach here, signIn redirected successfully
    return {};
  } catch (error) {
    // Auth.js throws a special redirect error on success – rethrow it
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    // Handle our custom CredentialsSignin errors
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          // The `code` we set on the custom error classes is available here
          const code = (error as { code?: string }).code as string | undefined;

          switch (code) {
            case "invalid_credentials":
              return {
                error: "Invalid email or password. Please try again.",
                code,
              };
            case "missing_organization":
              return {
                error:
                  "Your account is not linked to an organization yet. Please complete onboarding or contact support.",
                code,
              };
            case "profile_fetch_failed":
              return {
                error: "We couldn’t load your profile. Please try again in a moment.",
                code,
              };
            case "network_auth_error":
              return {
                error: "Network error. Please check your connection and try again.",
                code,
              };
            default:
              return {
                error: "Invalid email or password. Please try again.",
                code: "invalid_credentials",
              };
          }
        default:
          return {
            error: "Something went wrong while signing in. Please try again.",
          };
      }
    }

    return {
      error: "Something went wrong while signing in. Please try again.",
    };
  }
}