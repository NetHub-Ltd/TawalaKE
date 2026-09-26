"use client";

import React from "react";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { PermissionKey } from "@/lib/rbac";

export function RequirePermission({
  permission,
  anyOf,
  fallback = null,
  children,
}: {
  permission?: PermissionKey;
  anyOf?: PermissionKey[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { can, canAny, isLoading } = usePermissions();
  // Avoid blank/deny flash while NextAuth session hydrates (slow networks).
  if (isLoading) {
    return (
      <div className="flex min-h-[8rem] items-center justify-center text-sm text-muted">
        Checking permissions…
      </div>
    );
  }
  const ok = permission
    ? can(permission)
    : anyOf
      ? canAny(anyOf)
      : false;
  if (!ok) return <>{fallback}</>;
  return <>{children}</>;
}
