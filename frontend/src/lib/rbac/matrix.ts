import { Permission, PermissionKey, StaffRoleName } from "./permissions";

/** 1:1 with backend ROLE_PERMISSIONS */
export const ROLE_PERMISSIONS: Record<StaffRoleName, readonly PermissionKey[]> = {
  OWNER: Object.values(Permission),
  ADMIN: [
    Permission.ORG_READ,
    Permission.ORG_WRITE,
    Permission.ORG_STAFF_MANAGE,
    Permission.CATALOG_READ,
    Permission.CATALOG_WRITE,
    Permission.STOCK_READ,
    Permission.STOCK_ADJUST,
    Permission.SALES_WRITE,
    Permission.SALES_READ_OWN,
    Permission.SALES_READ_BUSINESS,
    Permission.REPORTS_READ,
  ],
  MANAGER: [
    Permission.ORG_READ,
    Permission.CATALOG_READ,
    Permission.CATALOG_WRITE,
    Permission.STOCK_READ,
    Permission.STOCK_ADJUST,
    Permission.SALES_WRITE,
    Permission.SALES_READ_OWN,
    Permission.SALES_READ_BUSINESS,
    Permission.REPORTS_READ,
  ],
  CASHIER: [
    Permission.ORG_READ,
    Permission.CATALOG_READ,
    Permission.STOCK_READ,
    Permission.SALES_WRITE,
    Permission.SALES_READ_OWN,
  ],
};

export function normalizeRole(role?: string | null): StaffRoleName | null {
  if (!role) return null;
  const r = String(role).toUpperCase().trim();
  if (r === "OWNER" || r === "ADMIN" || r === "MANAGER" || r === "CASHIER") {
    return r;
  }
  return null;
}

export function permissionsForRole(role?: string | null): ReadonlySet<PermissionKey> {
  const r = normalizeRole(role);
  if (!r) return new Set();
  return new Set(ROLE_PERMISSIONS[r]);
}
