import React from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { orgMatchesSession } from "@/lib/auth/require-api-auth";
import { OrgShell } from "@/features/org/components/OrgShell";
import { permissionsForRole, can, Permission } from "@/lib/rbac";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}

/** Org profile settings — org:write (OWNER, ADMIN) */
export default async function OrgSettingsLayout({
  children,
  params,
}: LayoutProps) {
  const { organizationId } = await params;
  const session = await auth();

  if (!session?.user || session.error) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/org/${organizationId}/settings`)}`,
    );
  }
  if (!orgMatchesSession(organizationId, session.user.organization_id)) {
    notFound();
  }

  const userRole = (session.user.role || "").toUpperCase().trim();
  if (!userRole) redirect("/org");

  if (!can(permissionsForRole(userRole), Permission.ORG_WRITE)) {
    redirect(`/org/${organizationId}`);
  }

  return (
    <OrgShell organizationId={organizationId} userRole={userRole}>
      {children}
    </OrgShell>
  );
}
