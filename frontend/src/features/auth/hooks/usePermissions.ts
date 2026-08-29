"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  can,
  canAny,
  canAll,
  permissionsForRole,
  PermissionKey,
  normalizeRole,
  StaffRoleName,
} from "@/lib/rbac";

export function usePermissions() {
  const { data: session, status } = useSession();
  const role = normalizeRole(session?.user?.role);

  const perms = useMemo(() => permissionsForRole(role), [role]);

  return {
    role: role as StaffRoleName | null,
    permissions: perms,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated" && !!session?.user,
    can: (p: PermissionKey) => can(perms, p),
    canAny: (ps: PermissionKey[]) => canAny(perms, ps),
    canAll: (ps: PermissionKey[]) => canAll(perms, ps),
  };
}
