import React from "react";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { orgMatchesSession } from "@/lib/auth/require-api-auth";
import { Sidebar } from "@/features/org/components/Sidebar";
import { Header } from "@/features/org/components/Header";

interface StaffLayoutProps {
  children: React.ReactNode;
  params: Promise<{ organizationId: string }>;
}

/**
 * Org-level shell for Team directory + member workspace.
 * Staff is organization-scoped; do not require a businessId in the URL.
 * Business-scoped nav targets resolve via Sidebar session fallback.
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

  // Optional: prefer first assigned business for business-scoped sidebar links
  const assigned =
    (
      session.user as {
        assigned_businesses?: { id: string }[];
      }
    ).assigned_businesses ?? [];
  const fallbackBusinessId = assigned[0]?.id;

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden select-none overscroll-none">
      <Sidebar
        organizationId={organizationId}
        businessId={fallbackBusinessId}
        userRole={userRole}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header />

        <main id="main-content" className="flex-1 min-w-0 min-h-0 relative">
          <div className="absolute inset-0 px-2 overflow-y-auto overscroll-contain focus:outline-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
