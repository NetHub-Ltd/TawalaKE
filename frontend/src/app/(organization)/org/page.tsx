import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { OrgDecisionLoading } from "@/features/org/components/OrgDecisionLoading";
import { OrgDecisionError } from "@/features/org/components/OrgDecisionError";
import { OrgNoSession } from "@/features/org/components/OrgNoSession";
import { OrgCommandCenterClient } from "@/features/org/components/OrgCommandCenterClient";

/* =========================================================
   TECHNICAL SEO: METADATA ENGINE & CANONICAL LINKING
   ========================================================= */
export const metadata: Metadata = {
  title: "Organization Command Center & Footprint | Tawala",
  description:
    "Executive hub for multi-tenant retail footprints. Manage organization settings, staff, billing, and active store terminals in Tawala.",
  alternates: {
    canonical: "https://tawala.io/org",
  },
};

interface BusinessItem {
  id: string;
  name: string;
  code?: string;
  status?: string;
}

interface StaffProfileResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  organization_id: string;
  assigned_businesses?: BusinessItem[];
}

type ResolveResult =
  | { type: "no-session" }
  | { type: "no-org" }
  | { type: "redirect"; destination: string }
  | {
      type: "select-business";
      orgId: string;
      userRole: string;
      userName: string;
      businesses: BusinessItem[];
    };

/* =========================================================
   SERVER-SIDE DECISION ENGINE
   ========================================================= */
async function resolveOrganization(): Promise<ResolveResult> {
  const session = await auth();

  if (!session?.user || session.error || !session.accessToken) {
    return { type: "no-session" };
  }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return { type: "no-session" };
    }

    const fullStaffData: StaffProfileResponse = await res.json();
    const resolvedOrgId = fullStaffData.organization_id;
    const topFive = fullStaffData.assigned_businesses ?? [];
    const assignedBusinesses = topFive.slice(0, 3);
    const userRole = (
      fullStaffData.role ||
      session.user.role ||
      "CASHIER"
    ).toUpperCase();

    if (!resolvedOrgId) {
      return { type: "no-org" };
    }

    const isAuthorizedToSelect = ["OWNER", "MANAGER"].includes(userRole);

    // CASHIER DIRECT ROUTING: Zero decision UI
    if (!isAuthorizedToSelect) {
      const cashierBusinessId = assignedBusinesses[0]?.id;
      if (!cashierBusinessId) {
        return { type: "no-org" };
      }
      return {
        type: "redirect",
        destination: `/org/${resolvedOrgId}/${cashierBusinessId}/overview`,
      };
    }

    // MANAGER / OWNER DECISION HUB
    return {
      type: "select-business",
      orgId: resolvedOrgId,
      userRole,
      userName: fullStaffData.name || session.user.name || "User",
      businesses: assignedBusinesses,
    };
  } catch (error) {
    console.error("[OrgResolution] Failed to resolve organization context:", error);
    return { type: "no-org" };
  }
}

/* =========================================================
   REACT SERVER COMPONENT (RSC) ENTRY POINT
   ========================================================= */
export default function OrgPage() {
  return (
    <Suspense fallback={<OrgDecisionLoading />}>
      <OrgDecisionWrapper />
    </Suspense>
  );
}

async function OrgDecisionWrapper() {
  const result = await resolveOrganization();

  if (result.type === "no-session") {
    return <OrgNoSession />;
  }

  if (result.type === "no-org") {
    return <OrgDecisionError />;
  }

  if (result.type === "redirect") {
    redirect(result.destination);
  }

  const { orgId, userRole, userName, businesses } = result;

  /* Search Engine Structured Data Injection (Schema.org ItemPage) */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    name: "Tawala Organization Command Center",
    description: "Manage organization metadata, staff, billing, and store terminals.",
    url: "https://tawala.io/org",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OrgCommandCenterClient
        orgId={orgId}
        userRole={userRole}
        userName={userName}
        businesses={businesses}
      />
    </>
  );
}