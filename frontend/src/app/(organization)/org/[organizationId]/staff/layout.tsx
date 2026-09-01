import React from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { orgMatchesSession } from "@/lib/auth/require-api-auth";
import { OrgShell } from "@/features/org/components/OrgShell";

interface StaffLayoutProps {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}

/**
 * Organization shell for Team — not the business POS sidebar.
 * Staff is org-scoped; URL is /org/{organizationId}/staff (no businessId).
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
  if (!userRole) {
    redirect("/org");
  }

  return (
    <OrgShell organizationId={organizationId} userRole={userRole}>
      {children}
    </OrgShell>
  );
}
