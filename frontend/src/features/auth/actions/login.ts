"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export type LoginState = {
  error?: string;
  code?: string;
};

/** Relative path only — blocks open redirects. */
function safeCallbackUrl(raw: FormDataEntryValue | null): string {
  if (typeof raw !== "string" || !raw.trim()) return "/org";
  const url = raw.trim();
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("://")) {
    // Disallow protocol-relative and absolute URLs
    return url.slice(0, 2048);
  }
  return "/org";
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = safeCallbackUrl(formData.get("callbackUrl"));

  if (!email || !password) {
    return { error: "Email and password are required", code: "invalid_credentials" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });

    return {};
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    // Next.js redirect() throws; rethrow so the browser follows callbackUrl
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest || "").startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin": {
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
