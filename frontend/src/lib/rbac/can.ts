import { PermissionKey } from "./permissions";
import { permissionsForRole } from "./matrix";

function asPermSet(
  roleOrPerms: string | null | undefined | ReadonlySet<PermissionKey>,
): ReadonlySet<PermissionKey> {
  if (roleOrPerms != null && typeof roleOrPerms === "object" && "has" in roleOrPerms) {
    return roleOrPerms as ReadonlySet<PermissionKey>;
  }
  return permissionsForRole(
    typeof roleOrPerms === "string" ? roleOrPerms : null,
  );
}

export function can(
  roleOrPerms: string | null | undefined | ReadonlySet<PermissionKey>,
  permission: PermissionKey,
): boolean {
  return asPermSet(roleOrPerms).has(permission);
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
