import React from "react";
import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { orgMatchesSession } from "@/lib/auth/require-api-auth";
import { OrgShell } from "@/features/org/components/OrgShell";
import { OrgHomeClient } from "@/features/org/components/OrgHomeClient";
import {
  permissionsForRole,
  can,
  Permission,
  normalizeRole,
} from "@/lib/rbac";

interface DecisionPageProps {
  params: Promise<{ organizationId: string }>;
}

export async function generateMetadata({
  params,
}: DecisionPageProps): Promise<Metadata> {
  const { organizationId } = await params;
  return {
    title: "Organization | Tawala",
    description: "Organization home — branches, usage, and team.",
    alternates: { canonical: `/org/${organizationId}` },
    robots: { index: false, follow: false },
  };
}

/**
 * OWNER / ADMIN → Org HQ home (shell + usage + branches).
 * MANAGER / CASHIER → first assigned business (floor).
 */
export default async function OrganizationHomePage({
  params,
}: DecisionPageProps) {
  const { organizationId } = await params;
  const session = await auth();

  if (!session?.user || session.error) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/org/${organizationId}`)}`,
    );
  }

  if (!orgMatchesSession(organizationId, session.user.organization_id)) {
    notFound();
  }

  const userRole = (session.user.role || "").toUpperCase().trim();
  if (!userRole) redirect("/org");

  const role = normalizeRole(userRole);
  const perms = permissionsForRole(userRole);
  const isHq = role === "OWNER" || role === "ADMIN";

  // Floor roles: land in a business workspace
  if (!isHq) {
    const assigned =
      (
        session.user as {
          assigned_businesses?: { id: string }[];
        }
      ).assigned_businesses ?? [];
    const first = assigned[0]?.id;
    if (first) {
      redirect(`/org/${organizationId}/${first}/overview`);
    }
    // No assignment — still show limited home so they are not stuck
  }

  return (
    <OrgShell organizationId={organizationId} userRole={userRole}>
      <OrgHomeClient
        organizationId={organizationId}
        canManageBranches={can(perms, Permission.ORG_WRITE)}
        canBilling={can(perms, Permission.ORG_BILLING)}
      />
    </OrgShell>
  );
}
