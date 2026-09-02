import { PermissionKey } from "./permissions";

export type PermissionsPayload = {
  staff_id: string;
  organization_id?: string | null;
  role?: string | null;
  org_wide: boolean;
  permissions: PermissionKey[];
};

/**
 * Load RBAC snapshot from the dedicated BFF route.
 * Do not put this on the NextAuth session — keeps hydration lean.
 * Backend Redis-caches the permission list per staff.
 */
export async function fetchPermissions(
  init?: RequestInit,
): Promise<PermissionsPayload> {
  const res = await fetch("/api/v1/auth/permissions", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      (typeof body?.error === "string" && body.error) ||
      (typeof body?.message === "string" && body.message) ||
      `Permissions request failed (${res.status})`;
    throw new Error(msg);
  }
  const data = await res.json();
  // Support bare payload or ApiResponse envelope
  const payload = (data?.data ?? data) as PermissionsPayload;
  return {
    staff_id: String(payload.staff_id),
    organization_id: payload.organization_id ?? null,
    role: payload.role ?? null,
    org_wide: Boolean(payload.org_wide),
    permissions: Array.isArray(payload.permissions)
      ? (payload.permissions as PermissionKey[])
      : [],
  };
}

export function permissionsSet(
  payload: PermissionsPayload | null | undefined,
): ReadonlySet<PermissionKey> {
  if (!payload?.permissions?.length) return new Set();
  return new Set(payload.permissions);
}
