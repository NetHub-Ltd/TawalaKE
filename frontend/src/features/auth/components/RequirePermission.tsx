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
  if (isLoading) return null;
  const ok = permission
    ? can(permission)
    : anyOf
      ? canAny(anyOf)
      : false;
  if (!ok) return <>{fallback}</>;
  return <>{children}</>;
}
