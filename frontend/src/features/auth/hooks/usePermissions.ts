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

/**
 * RBAC from the client session role.
 *
 * Critical: while NextAuth is hydrating (or authenticated without a role yet),
 * treat as loading — never as "denied". Empty role + can() === false caused
 * app-wide "You do not have permission" flashes until refresh.
 */
export function usePermissions() {
  const { data: session, status } = useSession();
  const role = normalizeRole(session?.user?.role);

  // status=loading → first paint / SSR→client
  // authenticated but role not on session yet (token race, refresh profile lag)
  const isLoading =
    status === "loading" ||
    (status === "authenticated" && !!session?.user && !role);

  const perms = useMemo(() => permissionsForRole(role), [role]);

  return {
    role: role as StaffRoleName | null,
    permissions: perms,
    isLoading,
    /** Session known and role present — safe to evaluate can() for deny UI */
    isReady: status === "authenticated" && !!role,
    isAuthenticated: status === "authenticated" && !!session?.user,
    can: (p: PermissionKey) => {
      if (isLoading) return false;
      return can(perms, p);
    },
    canAny: (ps: PermissionKey[]) => {
      if (isLoading) return false;
      return canAny(perms, ps);
    },
    canAll: (ps: PermissionKey[]) => {
      if (isLoading) return false;
      return canAll(perms, ps);
    },
  };
}
