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

// ---------------------------------------------------------------------------
// Platform organizations (issue #300 — uses #297 API)
// ---------------------------------------------------------------------------

export type PlatformOrg = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  active: boolean;
  onboarding?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type PlatformOrgHardDeleteResult = {
  organization_id: string;
  name?: string | null;
  email?: string | null;
  pre_delete_counts: Record<string, number>;
  deleted_table_rows: Record<string, number>;
};

async function platformFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = getPlatformAccessToken();
  if (!token) {
    throw Object.assign(new Error("Not signed in"), { status: 401 });
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${apiBase()}${path}`, { ...init, headers });
}

function throwPlatformError(data: unknown, status: number, fallback: string): never {
  const detail =
    data && typeof data === "object"
      ? (data as { detail?: unknown }).detail
      : undefined;
  const msg =
    typeof detail === "string"
      ? detail
      : detail && typeof detail === "object" && "message" in detail
        ? String((detail as { message: string }).message)
        : fallback;
  throw Object.assign(new Error(msg), { status, data });
}

export async function listPlatformOrganizations(params?: {
  q?: string;
  active?: boolean;
  limit?: number;
}): Promise<PlatformOrg[]> {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.active !== undefined) sp.set("active", String(params.active));
  if (params?.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  const res = await platformFetch(
    `/api/v1/platform/organizations${qs ? `?${qs}` : ""}`
  );
  const data = await res.json().catch(() => ([]));
  if (!res.ok) throwPlatformError(data, res.status, "Could not load organizations");
  return data as PlatformOrg[];
}

export async function hardDeletePlatformOrganization(
  organizationId: string,
  body: { confirm_name: string; confirm_phrase: string; reason: string }
): Promise<PlatformOrgHardDeleteResult> {
  const res = await platformFetch(
    `/api/v1/platform/organizations/${organizationId}`,
    { method: "DELETE", body: JSON.stringify(body) }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformError(
      data,
      res.status,
      "Hard delete failed (flag off, permissions, or server error)"
    );
  }
  return data as PlatformOrgHardDeleteResult;
}
