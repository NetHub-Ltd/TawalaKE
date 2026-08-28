/** Must stay aligned with backend app.core.rbac.Permission values. */
export const Permission = {
  ORG_READ: "org:read",
  ORG_WRITE: "org:write",
  ORG_BILLING: "org:billing",
  ORG_STAFF_MANAGE: "org:staff:manage",
  CATALOG_READ: "catalog:read",
  CATALOG_WRITE: "catalog:write",
  STOCK_READ: "stock:read",
  STOCK_ADJUST: "stock:adjust",
  SALES_WRITE: "sales:write",
  SALES_READ_OWN: "sales:read:own",
  SALES_READ_BUSINESS: "sales:read:business",
  REPORTS_READ: "reports:read",
} as const;

export type PermissionKey = (typeof Permission)[keyof typeof Permission];

export type StaffRoleName = "OWNER" | "ADMIN" | "MANAGER" | "CASHIER";

export const STAFF_ROLES: StaffRoleName[] = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "CASHIER",
];
