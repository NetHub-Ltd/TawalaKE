import { PermissionKey } from "./permissions";
import { permissionsForRole } from "./matrix";

export function can(
  roleOrPerms: string | null | undefined | ReadonlySet<PermissionKey>,
  permission: PermissionKey,
): boolean {
  if (roleOrPerms instanceof Set) {
    return roleOrPerms.has(permission);
  }
  return permissionsForRole(roleOrPerms).has(permission);
}

export function canAny(
  roleOrPerms: string | null | undefined | ReadonlySet<PermissionKey>,
  permissions: PermissionKey[],
): boolean {
  return permissions.some((p) => can(roleOrPerms, p));
}

export function canAll(
  roleOrPerms: string | null | undefined | ReadonlySet<PermissionKey>,
  permissions: PermissionKey[],
): boolean {
  return permissions.every((p) => can(roleOrPerms, p));
}
