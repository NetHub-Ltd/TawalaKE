// // app/org/page.tsx
// import { auth } from "@/auth";
// import { redirect } from "next/navigation";
// import { Suspense } from "react";
// import { OrgDecisionLoading } from "@/features/org/components/OrgDecisionLoading";
// import { OrgDecisionError } from "@/features/org/components/OrgDecisionError";
// import { OrgNoSession } from "@/features/org/components/OrgNoSession";

// type ResolveResult =
//   | { type: "no-session" }
//   | { type: "no-org" }
//   | { type: "success"; orgId: string; businessId: string };

// async function resolveOrganization(): Promise<ResolveResult> {
//   const session = await auth();

//   // 1. No valid session
//   if (!session?.user || session.error || !session.accessToken) {
//     return { type: "no-session" };
//   }

//   try {
//     // 2. Fetch the full staff profile using the token from the session
//     const res = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
//       headers: {
//         Authorization: `Bearer ${session.accessToken}`,
//         "Content-Type": "application/json",
//       },
//       // Important: don't cache this – we need fresh data
//       cache: "no-store",
//     });

//     if (!res.ok) {
//       // Token might be expired or invalid
//       return { type: "no-session" };
//     }

//     const fullStaffData = await res.json();

//     const resolvedOrgId = fullStaffData.organization_id;
//     const resolvedBusinessId = fullStaffData.assigned_businesses?.[0]?.id;

//     // 3. Missing organization or business context
//     if (!resolvedOrgId || !resolvedBusinessId) {
//       return { type: "no-org" };
//     }

//     // 4. Happy path
//     return {
//       type: "success",
//       orgId: resolvedOrgId,
//       businessId: resolvedBusinessId,
//     };
//   } catch (error) {
//     console.error("[OrgResolution] Failed to resolve organization:", error);
//     // Network / unexpected error → treat as no-org so user can recover
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

//   switch (result.type) {
//     case "no-session":
//       return <OrgNoSession />;

//     case "no-org":
//       return <OrgDecisionError />;

//     case "success":
//       // This redirect happens on the server – user never sees the page
//       redirect(
//         `/org/${result.orgId}/${result.businessId}/overview`
//       );
//   }
// }

// import { Metadata } from "next";
// import { auth } from "@/auth";
// import { redirect } from "next/navigation";
// import { Suspense } from "react";
// import Link from "next/link";
// import { Store, Plus, ArrowRight, Building2, ShieldCheck } from "lucide-react";
// import { OrgDecisionLoading } from "@/features/org/components/OrgDecisionLoading";
// import { OrgDecisionError } from "@/features/org/components/OrgDecisionError";
// import { OrgNoSession } from "@/features/org/components/OrgNoSession";

// /* =========================================================
//    TECHNICAL SEO: METADATA API CONFIGURATION
//    ========================================================= */
// export const metadata: Metadata = {
//   title: "Select Business Terminal | Tawala Hub",
//   description:
//     "Select an active store terminal or provision new store locations within your Tawala multi-tenant workspace.",
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
//   name: string;
//   role: string;
//   organization_id: string;
//   assigned_businesses?: BusinessItem[];
// }

// type ResolveResult =
//   | { type: "no-session" }
//   | { type: "no-org" }
//   | { type: "redirect"; destination: string }
//   | {
//       type: "select-business";
//       orgId: string;
//       userRole: string;
//       userName: string;
//       businesses: BusinessItem[];
//     };

// /* =========================================================
//    SERVER-SIDE DECISION ENGINE
//    ========================================================= */
// async function resolveOrganization(): Promise<ResolveResult> {
//   const session = await auth();

//   // 1. Unauthenticated or invalid session state
//   if (!session?.user || session.error || !session.accessToken) {
//     return { type: "no-session" };
//   }

//   try {
//     // 2. Fetch non-cached, real-time staff profile
//     const res = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
//       headers: {
//         Authorization: `Bearer ${session.accessToken}`,
//         "Content-Type": "application/json",
//       },
//       cache: "no-store",
//     });

//     if (!res.ok) {
//       return { type: "no-session" };
//     }

//     const fullStaffData: StaffProfileResponse = await res.json();

//     const resolvedOrgId = fullStaffData.organization_id;
//     const assignedBusinesses = fullStaffData.assigned_businesses ?? [];
//     const userRole = (
//       fullStaffData.role ||
//       session.user.role ||
//       "CASHIER"
//     ).toUpperCase();

//     // 3. Missing tenant or organization context
//     if (!resolvedOrgId) {
//       return { type: "no-org" };
//     }

//     const isAuthorizedToSelect = ["OWNER", "MANAGER"].includes(userRole);

//     // 4. CASHIER RULE: Instant direct routing (zero decision UI)
//     if (!isAuthorizedToSelect) {
//       const cashierBusinessId = assignedBusinesses[0]?.id;
//       if (!cashierBusinessId) {
//         return { type: "no-org" };
//       }
//       return {
//         type: "redirect",
//         destination: `/org/${resolvedOrgId}/${cashierBusinessId}/overview`,
//       };
//     }

//     // 5. MANAGER / OWNER RULE: Store selection workspace
//     return {
//       type: "select-business",
//       orgId: resolvedOrgId,
//       userRole,
//       userName: fullStaffData.name || session.user.name || "User",
//       businesses: assignedBusinesses,
//     };
//   } catch (error) {
//     console.error("[OrgResolution] Failed to resolve organization context:", error);
//     return { type: "no-org" };
//   }
// }

// /* =========================================================
//    REACT SERVER COMPONENT (RSC) ENTRY POINT
//    ========================================================= */
// export default function OrgPage() {
//   return (
//     <Suspense fallback={<OrgDecisionLoading />}>
//       <OrgDecisionWrapper />
//     </Suspense>
//   );
// }

// async function OrgDecisionWrapper() {
//   const result = await resolveOrganization();

//   if (result.type === "no-session") {
//     return <OrgNoSession />;
//   }

//   if (result.type === "no-org") {
//     return <OrgDecisionError />;
//   }

//   if (result.type === "redirect") {
//     redirect(result.destination);
//   }

//   const { orgId, userRole, userName, businesses } = result;

//   /* Search Engine Structured Data Injection (Schema.org ItemPage) */
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "ItemPage",
//     name: "Tawala Business Decision Hub",
//     description: "Select an active business terminal or provision new store locations.",
//     url: "https://tawala.io/org",
//   };

//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />

//       <main
//         id="main-content"
//         className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-x-hidden"
//       >
//         <div className="max-w-6xl w-full mx-auto space-y-10 my-auto py-8">
//           {/* Header Workspace Section */}
//           <header className="space-y-3 text-center sm:text-left border-b border-slate-200 dark:border-slate-800 pb-6">
//             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-mono font-bold">
//               <ShieldCheck size={14} className="shrink-0" />
//               <span className="uppercase tracking-wider">{userRole} Workspace</span>
//             </div>
//             <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50">
//               Welcome back, {userName}
//             </h1>
//             <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
//               Select an active business terminal below to access your point-of-sale management center, or launch a new branch location.
//             </p>
//           </header>

//           {/* Stores & Actions Grid */}
//           <section
//             aria-label="Assigned Business Terminals"
//             className="space-y-6"
//           >
//             <div className="flex items-center justify-between">
//               <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
//                 Your Assigned Business Locations ({businesses.length})
//               </h2>
//             </div>

//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//               {businesses.map((business) => (
//                 <article
//                   key={business.id}
//                   className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between space-y-6"
//                 >
//                   <div className="space-y-4">
//                     <div className="flex items-center justify-between">
//                       <div className="h-12 w-12 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
//                         <Store size={22} strokeWidth={2} />
//                       </div>
//                       <span className="inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
//                         Active
//                       </span>
//                     </div>

//                     <div>
//                       <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
//                         {business.name}
//                       </h3>
//                       {business.code && (
//                         <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
//                           Store Code: {business.code}
//                         </p>
//                       )}
//                     </div>
//                   </div>

//                   <Link
//                     href={`/org/${orgId}/${business.id}/overview`}
//                     className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-900 dark:text-slate-100 text-xs font-bold transition-all duration-200 flex items-center justify-between group-hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
//                   >
//                     <span>Launch Terminal</span>
//                     <ArrowRight
//                       size={16}
//                       className="transition-transform group-hover:translate-x-1"
//                     />
//                   </Link>
//                 </article>
//               ))}

//               {/* Create New Store Action Card */}
//               <article className="group relative bg-slate-100/60 dark:bg-slate-900/40 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 flex flex-col justify-between space-y-6">
//                 <div className="space-y-4">
//                   <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600/10 group-hover:text-blue-600 transition-colors">
//                     <Plus size={22} strokeWidth={2} />
//                   </div>

//                   <div>
//                     <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
//                       Provision New Store
//                     </h3>
//                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
//                       Add a new branch, outlet, or register under your organization.
//                     </p>
//                   </div>
//                 </div>

//                 <Link
//                   href="/org/new-store"
//                   className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all duration-200 flex items-center justify-between shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
//                 >
//                   <span>Create Store</span>
//                   <ArrowRight
//                     size={16}
//                     className="transition-transform group-hover:translate-x-1"
//                   />
//                 </Link>
//               </article>
//             </div>
//           </section>
//         </div>

//         {/* Localized Footer Landmark */}
//         <footer className="w-full max-w-6xl mx-auto pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
//           <div className="flex items-center gap-2">
//             <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
//             <span className="font-semibold text-slate-700 dark:text-slate-300">
//               Tawala Multi-Tenant Core
//             </span>
//           </div>
//           <p>&copy; {new Date().getFullYear()} Tawala. All rights reserved.</p>
//         </footer>
//       </main>
//     </>
//   );
// }

import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  Store,
  Plus,
  ArrowRight,
  Building2,
  ShieldCheck,
  Pencil,
  Users,
  CreditCard,
  Settings,
  Sparkles,
} from "lucide-react";
import { OrgDecisionLoading } from "@/features/org/components/OrgDecisionLoading";
import { OrgDecisionError } from "@/features/org/components/OrgDecisionError";
import { OrgNoSession } from "@/features/org/components/OrgNoSession";

/* =========================================================
   TECHNICAL SEO: METADATA ENGINE & CANONICAL LINKING
   ========================================================= */
export const metadata: Metadata = {
  title: "Organization Hub & Terminals | Tawala",
  description:
    "Manage your organization settings, staff, billing, and store terminals in your Tawala multi-tenant workspace.",
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
    const assignedBusinesses = fullStaffData.assigned_businesses ?? [];
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

      <main
        id="main-content"
        className="h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden"
      >
        {/* =========================================================
            FIXED HEADER (NON-SCROLLING TOP NAVIGATION BAR)
            ========================================================= */}
        <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  Organization Command Center
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold uppercase border border-blue-500/20">
                  <ShieldCheck size={12} />
                  {userRole}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Signed in as <span className="font-semibold text-slate-700 dark:text-slate-300">{userName}</span>
              </p>
            </div>
          </div>

          {/* Fixed Header Primary Action */}
          <Link
            href="/org/new-store"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Provision New Store</span>
            <span className="sm:hidden">New Store</span>
          </Link>
        </header>

        {/* =========================================================
            INDEPENDENTLY SCROLLABLE MAIN CONTENT AREA
            ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 space-y-10">
          <div className="max-w-7xl mx-auto space-y-10">
            
            {/* ---------------------------------------------------------
                ORGANIZATION MANAGEMENT CONTROL CARDS
                --------------------------------------------------------- */}
            <section aria-label="Organization Governance" className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-500" />
                  Organization Management
                </h2>
                <span className="text-xs text-slate-400 font-mono">Org ID: {orgId}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Org Settings / Metadata Card */}
                <Link
                  href="#"
                  className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md flex items-start gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-blue-600/10 group-hover:text-blue-600 transition-colors">
                    <Settings size={20} />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                      Org Metadata & Settings
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      Update company legal name, tax IDs, contact details, and brand assets.
                    </p>
                  </div>
                </Link>

                {/* Staff & Roles Governance */}
                <Link
                  href="#"
                  className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md flex items-start gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-blue-600/10 group-hover:text-blue-600 transition-colors">
                    <Users size={20} />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                      Manage Staff & PINs
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      Invite managers, assign cashiers to specific stores, and adjust permissions.
                    </p>
                  </div>
                </Link>

                {/* Billing & Subscriptions */}
                <Link
                  href="#"
                  className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md flex items-start gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-blue-600/10 group-hover:text-blue-600 transition-colors">
                    <CreditCard size={20} />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                      Billing & Subscriptions
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      View active store tier plans, download tax invoices, and manage payment methods.
                    </p>
                  </div>
                </Link>
              </div>
            </section>

            {/* ---------------------------------------------------------
                SCROLLABLE STORE TERMINALS GRID SECTION
                --------------------------------------------------------- */}
            <section aria-label="Assigned Business Terminals" className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Store size={14} className="text-blue-500" />
                  Active Business Locations ({businesses.length})
                </h2>
              </div>

              {/* Scrollable Container Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                {businesses.map((business) => (
                  <article
                    key={business.id}
                    className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <Store size={22} strokeWidth={2} />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                            Active
                          </span>
                          
                          {/* Store Quick Edit Icon Button */}
                          <Link
                            href="#"
                            aria-label={`Edit ${business.name} settings`}
                            className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            <Pencil size={14} />
                          </Link>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {business.name}
                        </h3>
                        {business.code && (
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            Code: {business.code}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/org/${orgId}/${business.id}/overview`}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-900 dark:text-slate-100 text-xs font-bold transition-all duration-200 flex items-center justify-between group-hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <span>Launch Terminal</span>
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </Link>
                  </article>
                ))}

                {/* Secondary CTA Store Creation Card */}
                <article className="group relative bg-slate-100/60 dark:bg-slate-900/40 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600/10 group-hover:text-blue-600 transition-colors">
                      <Plus size={22} strokeWidth={2} />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Add Another Location
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Expand your business footprint by adding a new outlet or register.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/org/new-store"
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all duration-200 flex items-center justify-between shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span>Provision Store</span>
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </article>
              </div>
            </section>

          </div>
        </div>
      </main>
    </>
  );
}