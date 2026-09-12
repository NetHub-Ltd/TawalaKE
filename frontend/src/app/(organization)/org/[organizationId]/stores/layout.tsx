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

/** Branches list — org:read */
export default async function StoresLayout({ children, params }: LayoutProps) {
  const { organizationId } = await params;
  const session = await auth();

  if (!session?.user || session.error) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/org/${organizationId}/stores`)}`,
    );
  }
  if (!orgMatchesSession(organizationId, session.user.organization_id)) {
    notFound();
  }

  const userRole = (session.user.role || "").toUpperCase().trim();
  if (!userRole) redirect("/org");

  if (!can(permissionsForRole(userRole), Permission.ORG_READ)) {
    redirect(`/org/${organizationId}`);
  }

  return (
    <OrgShell organizationId={organizationId} userRole={userRole}>
      {children}
    </OrgShell>
  );
}
