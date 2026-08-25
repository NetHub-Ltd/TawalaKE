// import { Metadata } from "next";
// import { auth } from "@/auth";
// import { redirect } from "next/navigation";
// import { Suspense } from "react";
// import { OrgDecisionLoading } from "@/features/org/components/OrgDecisionLoading";
// import { OrgDecisionError } from "@/features/org/components/OrgDecisionError";
// import { OrgCommandCenterClient } from "@/features/org/components/OrgCommandCenterClient";

// export const metadata: Metadata = {
//   title: "Organization Command Center & Footprint | Tawala",
//   description:
//     "Executive hub for multi-tenant retail footprints. Manage organization settings, staff, billing, and active store terminals in Tawala.",
//   alternates: {
//     canonical: "https://tawala.io/org",
//   },
// };

// interface BusinessItem {
//   id: string;
//   name: string;
//   code?: string;
//   status?: string;
// }

// interface StaffProfileResponse {
//   id: string;
//   email: string;
//   name?: string;
//   full_name?: string;
//   role: string;
//   organization_id: string;
//   assigned_businesses?: BusinessItem[];
// }

// type ResolveResult =
//   | { type: "no-org" }
//   | { type: "redirect"; destination: string }
//   | {
//       type: "select-business";
//       orgId: string;
//       userRole: string;
//       userName: string;
//       businesses: BusinessItem[];
//     };

// const SELECTOR_ROLES = new Set(["OWNER", "MANAGER", "ADMIN"]);

// async function resolveOrganization(): Promise<ResolveResult> {
//   const session = await auth();

//   // Unauthenticated / refresh failed → login (middleware should usually catch this)
//   if (!session?.user || session.error || !session.accessToken) {
//     redirect("/login?callbackUrl=%2Forg");
//   }

//   try {
//     const res = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
//       headers: {
//         Authorization: `Bearer ${session.accessToken}`,
//         "Content-Type": "application/json",
//       },
//       cache: "no-store",
//     });

//     if (!res.ok) {
//       // Token rejected by backend
//       redirect("/login?callbackUrl=%2Forg");
//     }

//     const profile: StaffProfileResponse = await res.json();

//     const resolvedOrgId =
//       profile.organization_id || session.user.organization_id;

//     if (!resolvedOrgId) {
//       return { type: "no-org" };
//     }

//     const assignedBusinesses = (profile.assigned_businesses ?? []).slice(0, 5);

//     const userRole = (
//       profile.role ||
//       session.user.role ||
//       "CASHIER"
//     ).toUpperCase();

//     const userName =
//       profile.name ||
//       profile.full_name ||
//       session.user.name ||
//       "User";

//     // Cashier (and any non-selector role) → first store
//     if (!SELECTOR_ROLES.has(userRole)) {
//       const businessId = assignedBusinesses[0]?.id;
//       if (!businessId) {
//         return { type: "no-org" };
//       }
//       return {
//         type: "redirect",
//         destination: `/org/${resolvedOrgId}/${businessId}/overview`,
//       };
//     }

//     return {
//       type: "select-business",
//       orgId: resolvedOrgId,
//       userRole,
//       userName,
//       businesses: assignedBusinesses,
//     };
//   } catch (error) {
//     console.error("[OrgResolution] Failed:", error);
//     return { type: "no-org" };
//   }
// }

// export default function OrgPage() {
//   return (
//     <Suspense fallback={<OrgDecisionLoading />}>
//       <OrgDecisionWrapper />
//     </Suspense>
//   );
// }

// async function OrgDecisionWrapper() {
//   const result = await resolveOrganization();

//   if (result.type === "no-org") {
//     return <OrgDecisionError />;
//   }

//   if (result.type === "redirect") {
//     redirect(result.destination);
//   }

//   const { orgId, userRole, userName, businesses } = result;

//   return (
//     <OrgCommandCenterClient
//       orgId={orgId}
//       userRole={userRole}
//       userName={userName}
//       businesses={businesses}
//     />
//   );
// }

import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AlertCircle } from "lucide-react";
import { OrgDecisionLoading } from "@/features/org/components/OrgDecisionLoading";
import { OrgDecisionError } from "@/features/org/components/OrgDecisionError";
import { OrgCommandCenterClient } from "@/features/org/components/OrgCommandCenterClient";

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
  name?: string;
  full_name?: string;
  role?: string;
  organization_id?: string;
  assigned_businesses?: BusinessItem[];
}

type ResolveResult =
  | { type: "no-session" }
  | { type: "no-org" }
  | { type: "no-role" }
  | { type: "no-store" }
  | { type: "redirect"; destination: string }
  | {
      type: "select-business";
      orgId: string;
      userRole: string;
      userName: string;
      businesses: BusinessItem[];
    };

/** Roles that may pick a business on /org */
const SELECTOR_ROLES = new Set(["OWNER", "MANAGER", "ADMIN"]);

/**
 * Wait for a real session + profile role before any business routing.
 * Never default role to CASHIER for decisions.
 */
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

    if (res.status === 401 || res.status === 403) {
      return { type: "no-session" };
    }

    if (!res.ok) {
      return { type: "no-org" };
    }

    const profile: StaffProfileResponse = await res.json();

    const resolvedOrgId =
      profile.organization_id;

    if (!resolvedOrgId) {
      return { type: "no-org" };
    }

    // Prefer profile role; fall back to JWT snapshot only — never invent CASHIER
    const rawRole = profile.role || session.user.role || "";
    const userRole = rawRole.toUpperCase().trim();

    if (!userRole) {
      return { type: "no-role" };
    }

    const assignedBusinesses = (profile.assigned_businesses ?? []);

    const userName =
      profile.name ||
      profile.full_name ||
      session.user.name ||
      "User";

    // OWNER: incomplete onboarding or missing plan → onboarding entrypoints
    if (userRole === "OWNER") {
      try {
        const base = (process.env.BACKEND_URL || "").replace(/\/$/, "");
        const statusUrl = base.endsWith("/api/v1")
          ? `${base}/organizations/onboarding-status`
          : `${base}/api/v1/organizations/onboarding-status`;
        const statusRes = await fetch(statusUrl, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        if (statusRes.ok) {
          const statusJson = await statusRes.json();
          const st = statusJson.data ?? statusJson;
          if (!st.has_active_subscription) {
            return { type: "redirect", destination: "/onboarding/plans" };
          }
          if (!st.onboarding) {
            return { type: "redirect", destination: "/onboarding/organization" };
          }
        } else {
          console.error(
            "[OrgResolution] onboarding-status HTTP",
            statusRes.status,
            await statusRes.text().catch(() => ""),
          );
        }
      } catch (e) {
        console.error("[OrgResolution] onboarding status failed:", e);
      }
    }

    // Non-selector roles (e.g. CASHIER) → first assigned store
    if (!SELECTOR_ROLES.has(userRole)) {
      const businessId = assignedBusinesses[0]?.id;
      if (!businessId) {
        return { type: "no-store" };
      }
      return {
        type: "redirect",
        destination: `/org/${resolvedOrgId}/${businessId}/overview`,
      };
    }

    // OWNER / MANAGER / ADMIN → command center (even if business list is empty)
    return {
      type: "select-business",
      orgId: resolvedOrgId,
      userRole,
      userName,
      businesses: assignedBusinesses,
    };
  } catch (error) {
    console.error("[OrgResolution] Failed:", error);
    return { type: "no-org" };
  }
}

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
    return (
      <SessionIssue
        title="Session expired"
        message="Please sign in again to continue to your organization."
        showLogin
      />
    );
  }

  if (result.type === "no-role") {
    return (
      <SessionIssue
        title="Account incomplete"
        message="We couldn’t determine your role. Sign in again or contact support."
        showLogin
      />
    );
  }

  if (result.type === "no-store") {
    return (
      <SessionIssue
        title="No store assigned"
        message="Your account isn’t linked to a store yet. Ask your manager to assign one."
        showLogin={false}
      />
    );
  }

  if (result.type === "no-org") {
    return <OrgDecisionError />;
  }

  if (result.type === "redirect") {
    redirect(result.destination);
  }

  const { orgId, userRole, userName, businesses } = result;

  return (
    <OrgCommandCenterClient
      orgId={orgId}
      userRole={userRole}
      userName={userName}
      businesses={businesses}
    />
  );
}

/** Simple server-friendly fallback when we refuse to guess role/session */
function SessionIssue({
  title,
  message,
  showLogin,
}: {
  title: string;
  message: string;
  showLogin: boolean;
}) {
  return (
    <div className="min-h-[50vh] w-full flex flex-col items-center justify-center p-8 text-center gap-4">
      <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
        <AlertCircle size={22} />
      </div>
      <div className="space-y-1 max-w-sm">
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted">{message}</p>
      </div>
      {showLogin && (
        <Link
          href="/login?callbackUrl=%2Forg"
          className="mt-2 h-11 px-5 rounded-xl bg-brand-primary text-white text-sm font-semibold inline-flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          Sign in
        </Link>
      )}
    </div>
  );
}