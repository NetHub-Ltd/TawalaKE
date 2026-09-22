/**
 * Platform operator auth helpers (isolated from staff NextAuth session).
 * Token is stored under a dedicated key so it never collides with store login.
 */

const PLATFORM_TOKEN_KEY = "tawala.platform.access_token";
const PLATFORM_TOKEN_EXPIRES_KEY = "tawala.platform.expires_at";

export type PlatformChallenge = {
  challenge_id: string;
  expires_in: number;
  email_hint: string;
  message?: string;
};

export type PlatformTokenResponse = {
  access_token: string;
  token_type: string;
  expires_at: string;
  role: string;
  kind: string;
};

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  return base.replace(/\/$/, "");
}

export function getPlatformAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = sessionStorage.getItem(PLATFORM_TOKEN_KEY);
  const expires = sessionStorage.getItem(PLATFORM_TOKEN_EXPIRES_KEY);
  if (!token) return null;
  if (expires) {
    const exp = Date.parse(expires);
    if (!Number.isNaN(exp) && exp < Date.now()) {
      clearPlatformSession();
      return null;
    }
  }
  return token;
}

export function setPlatformSession(token: string, expiresAt: string): void {
  sessionStorage.setItem(PLATFORM_TOKEN_KEY, token);
  sessionStorage.setItem(PLATFORM_TOKEN_EXPIRES_KEY, expiresAt);
}

export function clearPlatformSession(): void {
  sessionStorage.removeItem(PLATFORM_TOKEN_KEY);
  sessionStorage.removeItem(PLATFORM_TOKEN_EXPIRES_KEY);
}

export function isPlatformAuthenticated(): boolean {
  return Boolean(getPlatformAccessToken());
}

/** Extract human-readable error from FastAPI / network failures. */
export function platformApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;
  const ax = err as {
    response?: { data?: { detail?: unknown } };
    message?: string;
  };
  const detail = ax.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const d = detail as { message?: string; code?: string };
    if (d.message) return d.message;
  }
  if (ax.message && !ax.message.startsWith("Request failed")) return ax.message;
  return fallback;
}

export async function platformLogin(
  email: string,
  password: string
): Promise<PlatformChallenge> {
  const res = await fetch(`${apiBase()}/api/v1/platform/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : detail?.message || "Invalid email or password";
    throw Object.assign(new Error(msg), { status: res.status, data });
  }
  return data as PlatformChallenge;
}

export async function platformVerifyCode(
  challengeId: string,
  code: string
): Promise<PlatformTokenResponse> {
  const res = await fetch(`${apiBase()}/api/v1/platform/auth/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge_id: challengeId, code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : detail?.message || "Incorrect or expired verification code";
    throw Object.assign(new Error(msg), { status: res.status, data });
  }
  return data as PlatformTokenResponse;
}

export async function platformResendCode(
  challengeId: string
): Promise<PlatformChallenge> {
  const res = await fetch(`${apiBase()}/api/v1/platform/auth/resend-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challenge_id: challengeId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : detail?.message || "Could not resend code";
    throw Object.assign(new Error(msg), { status: res.status, data });
  }
  return data as PlatformChallenge;
}
