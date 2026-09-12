import React from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { orgMatchesSession } from "@/lib/auth/require-api-auth";
import { OrgShell } from "@/features/org/components/OrgShell";
import { permissionsForRole, can, Permission } from "@/lib/rbac";

interface StaffLayoutProps {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}

/**
 * Organization shell for Team — org-scoped (no businessId).
 * Requires org:staff:manage.
 */
export default async function OrgStaffLayout({
  children,
  params,
}: StaffLayoutProps) {
  const { organizationId } = await params;
  const session = await auth();

  if (!session?.user || session.error) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/org/${organizationId}/staff`)}`,
    );
  }

  if (!orgMatchesSession(organizationId, session.user.organization_id)) {
    notFound();
  }

  const userRole = (session.user.role || "").toUpperCase().trim();
  if (!userRole) redirect("/org");

  const perms = permissionsForRole(userRole);
  if (!can(perms, Permission.ORG_STAFF_MANAGE)) {
    redirect(`/org/${organizationId}`);
  }

  return (
    <OrgShell organizationId={organizationId} userRole={userRole}>
      {children}
    </OrgShell>
  );
}
