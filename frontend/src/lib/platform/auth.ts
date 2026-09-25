/**
 * Platform operator auth helpers (isolated from staff NextAuth session).
 *
 * Browser calls are same-origin BFF only (`/api/v1/platform/...`).
 * BACKEND_URL is never used in the client.
 */

const PLATFORM_TOKEN_KEY = "tawala.platform.access_token";
const PLATFORM_TOKEN_EXPIRES_KEY = "tawala.platform.expires_at";

/** Same-origin BFF prefix — never point this at the FastAPI host. */
const BFF = "/api/v1/platform";

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
  must_change_password?: boolean;
};

/** Login may return a token (current API) or an MFA challenge (when MFA ships). */
export type PlatformLoginResult =
  | { kind: "token"; token: PlatformTokenResponse }
  | { kind: "challenge"; challenge: PlatformChallenge };

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

function detailMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "message" in detail) {
    return String((detail as { message: string }).message);
  }
  if (
    "message" in (data as object) &&
    typeof (data as { message: unknown }).message === "string"
  ) {
    return (data as { message: string }).message;
  }
  return fallback;
}

async function bffFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${BFF}${path}`, { ...init, headers });
}

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
  return fetch(`${BFF}${path}`, { ...init, headers });
}

function throwPlatformError(
  data: unknown,
  status: number,
  fallback: string
): never {
  throw Object.assign(new Error(detailMessage(data, fallback)), {
    status,
    data,
  });
}

export async function platformLogin(
  email: string,
  password: string
): Promise<PlatformLoginResult> {
  const res = await bffFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformError(data, res.status, "Invalid email or password");
  }
  if (data && typeof data === "object" && "access_token" in data) {
    return { kind: "token", token: data as PlatformTokenResponse };
  }
  if (data && typeof data === "object" && "challenge_id" in data) {
    return { kind: "challenge", challenge: data as PlatformChallenge };
  }
  throw Object.assign(new Error("Unexpected login response"), {
    status: res.status,
    data,
  });
}

export async function platformVerifyCode(
  challengeId: string,
  code: string
): Promise<PlatformTokenResponse> {
  const res = await bffFetch("/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ challenge_id: challengeId, code }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformError(
      data,
      res.status,
      "Incorrect or expired verification code"
    );
  }
  return data as PlatformTokenResponse;
}

export async function platformResendCode(
  challengeId: string
): Promise<PlatformChallenge> {
  const res = await bffFetch("/auth/resend-code", {
    method: "POST",
    body: JSON.stringify({ challenge_id: challengeId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformError(data, res.status, "Could not resend code");
  }
  return data as PlatformChallenge;
}

export async function platformChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<unknown> {
  const res = await platformFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwPlatformError(data, res.status, "Could not change password");
  }
  return data;
}

export type PlatformOrgStats = {
  businesses: number;
  staff: number;
  sales: number;
  subscriptions: number;
  products: number;
  customers: number;
};

export type PlatformOrgSubscription = {
  id: string;
  active: boolean;
  tier?: string | null;
  plan_id?: string | null;
  plan_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  /** Present when platform list/detail includes subscription grace fields. */
  grace_end_date?: string | null;
  /** active | grace | locked | unknown — from subscription access phase. */
  access_phase?: string | null;
  current_usage?: Record<string, unknown> | null;
};

export type PlatformOrg = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  active: boolean;
  onboarding?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  stats?: PlatformOrgStats | null;
  subscriptions?: PlatformOrgSubscription[] | null;
};

export type PlatformOrgHardDeleteResult = {
  organization_id: string;
  name?: string | null;
  email?: string | null;
  pre_delete_counts: Record<string, number>;
  deleted_table_rows: Record<string, number>;
};

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
  const res = await platformFetch(`/organizations${qs ? `?${qs}` : ""}`);
  const data = await res.json().catch(() => []);
  if (!res.ok)
    throwPlatformError(data, res.status, "Could not load organizations");
  return data as PlatformOrg[];
}


export async function getPlatformOrganization(
  organizationId: string
): Promise<PlatformOrg> {
  const res = await platformFetch(`/organizations/${organizationId}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwPlatformError(data, res.status, "Could not load organization");
  return data as PlatformOrg;
}

export async function createPlatformOrganization(body: {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  active?: boolean;
  onboarding?: boolean;
}): Promise<PlatformOrg> {
  const res = await platformFetch(`/organizations`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwPlatformError(data, res.status, "Could not create organization");
  return data as PlatformOrg;
}

export async function updatePlatformOrganization(
  organizationId: string,
  body: {
    name?: string;
    email?: string;
    phone?: string | null;
    address?: string | null;
    active?: boolean;
    onboarding?: boolean;
  }
): Promise<PlatformOrg> {
  const res = await platformFetch(`/organizations/${organizationId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throwPlatformError(data, res.status, "Could not update organization");
  return data as PlatformOrg;
}

export async function hardDeletePlatformOrganization(
  organizationId: string,
  body: { confirm_name: string; confirm_phrase: string; reason: string }
): Promise<PlatformOrgHardDeleteResult> {
  const res = await platformFetch(`/organizations/${organizationId}`, {
    method: "DELETE",
    body: JSON.stringify(body),
  });
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
