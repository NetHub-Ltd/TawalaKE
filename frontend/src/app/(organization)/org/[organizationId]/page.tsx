
// import React from "react";
// import { Metadata } from "next";
// import { headers } from "next/headers";
// import { redirect } from "next/navigation";
// import Link from "next/link";
// import { 
//   AlertOctagon, 
//   LogOut, 
//   LifeBuoy, 
//   RefreshCw, 
//   Building2 
// } from "lucide-react";

// interface DecisionPageProps {
//   params: Promise<{ organizationId: string }>;
// }

// export async function generateMetadata({ params }: DecisionPageProps): Promise<Metadata> {
//   const { organizationId } = await params;
//   return {
//     title: "Organization Resolution Terminal | NetHub",
//     description: "Verify and route to active business workspace.",
//     alternates: {
//       canonical: `/org/${organizationId}`,
//     },
//     robots: {
//       index: false,
//       follow: false,
//     },
//   };
// }

// export default async function OrganizationDecisionPage({ params }: DecisionPageProps) {
//   const { organizationId } = await params;

//   const headersList = await headers();
//   const host = headersList.get("host") || "localhost:3000";
//   const cookieHeader = headersList.get("cookie") || "";
//   const protocol = host.startsWith("localhost") ? "http" : "https";

//   let targetRedirectPath: string | null = null;

//   try {
//     const response = await fetch(`${protocol}://${host}/api/v1/org/stores`, {
//       method: "GET",
//       headers: { Cookie: cookieHeader },
//       cache: "no-store",
//     });

//     if (response.ok) {
//       const stores = await response.json();
      
//       if (Array.isArray(stores) && stores.length > 0) {
//         const primaryStore = stores[0];
//         targetRedirectPath = `/org/${organizationId}/${primaryStore.id}`;
//       } else if (Array.isArray(stores) && stores.length === 0) {
//         targetRedirectPath = `/org/${organizationId}/setup-business`;
//       }
//     }
//   } catch (error) {
//     console.error("[OrgDecisionPage] Failed to resolve stores from API:", error);
//   }

//   // Execute redirection ONLY when a target path is verified.
//   // Next.js handles `redirect()` by throwing an internal signal exception.
//   if (targetRedirectPath) {
//     redirect(targetRedirectPath);
//   }

//   // IN-PLACE TERMINAL UI: Rendered directly on /org/[organizationId] when context resolution fails.
//   const jsonLdSchema = {
//     "@context": "https://schema.org",
//     "@type": "WebPage",
//     name: "Business Profile Resolution Error",
//     description: "Terminal fallback for unresolvable business contexts.",
//   };

//   return (
//     <main 
//       id="main-content" 
//       className="w-full min-h-[85vh] flex items-center justify-center p-4 sm:p-6 font-sans antialiased"
//     >
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
//       />

//       <section 
//         aria-labelledby="terminal-error-heading"
//         className="w-full max-w-lg bg-card border border-border/60 rounded-[1.5rem] p-6 sm:p-8 shadow-lift flex flex-col items-center text-center space-y-6"
//       >
//         {/* Status Badge & Visual Landmark */}
//         <div className="relative">
//           <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
//             <AlertOctagon className="w-8 h-8" strokeWidth={1.75} aria-hidden="true" />
//           </div>
//           <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
//             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
//             <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-primary" />
//           </div>
//         </div>

//         {/* Messaging */}
//         <div className="space-y-2">
//           <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/60 border border-border/40 text-[10px] font-mono font-bold uppercase tracking-wider text-muted mb-1">
//             <Building2 className="w-3 h-3 text-muted" aria-hidden="true" />
//             <span>Org ID: {organizationId.slice(0, 8)}...</span>
//           </div>

//           <h1 
//             id="terminal-error-heading"
//             className="text-lg sm:text-xl font-bold text-foreground tracking-tight"
//           >
//             Business Profile Unavailable
//           </h1>

//           <p className="text-xs text-muted font-medium leading-relaxed max-w-md">
//             We couldn't link your account to an active store or business profile within this organization. You cannot proceed further until a valid business context is configured.
//           </p>
//         </div>

//         {/* Action Panel (Fitts's Law Mobile Touch Targets) */}
//         <div className="w-full space-y-3 pt-2">
//           <Link
//             href={`/org/${organizationId}`}
//             className="w-full min-h-[44px] px-4 rounded-xl bg-brand-secondary text-background font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:bg-brand-secondary/90 focus:outline-hidden focus:ring-2 focus:ring-brand-primary cursor-pointer"
//           >
//             <RefreshCw className="w-4 h-4" aria-hidden="true" />
//             <span>Retry Context Connection</span>
//           </Link>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//             <Link
//               href="/api/auth/signout"
//               className="w-full min-h-[44px] px-4 rounded-xl bg-background border border-border/60 text-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-surface transition-colors focus:outline-hidden focus:ring-2 focus:ring-brand-primary cursor-pointer"
//             >
//               <LogOut className="w-4 h-4 text-muted" aria-hidden="true" />
//               <span>Sign Out</span>
//             </Link>

//             <a
//               href="mailto:support@nethub.co.ke?subject=Business%20Context%20Resolution%20Error"
//               className="w-full min-h-[44px] px-4 rounded-xl bg-background border border-border/60 text-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-surface transition-colors focus:outline-hidden focus:ring-2 focus:ring-brand-primary cursor-pointer"
//             >
//               <LifeBuoy className="w-4 h-4 text-muted" aria-hidden="true" />
//               <span>Contact Support</span>
//             </a>
//           </div>
//         </div>

//       </section>
//     </main>
//   );
// }

import React from "react";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { 
  AlertOctagon, 
  LogOut, 
  LifeBuoy, 
  RefreshCw, 
  Building2 
} from "lucide-react";

interface DecisionPageProps {
  params: Promise<{ organizationId: string }>;
}

export async function generateMetadata({ params }: DecisionPageProps): Promise<Metadata> {
  const { organizationId } = await params;
  return {
    title: "Organization Resolution Terminal | NetHub",
    description: "Verify and route to active business workspace.",
    alternates: {
      canonical: `/org/${organizationId}`,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

interface StoreItem {
  id: string;
  name: string;
}

export default async function OrganizationDecisionPage({ params }: DecisionPageProps) {
  const { organizationId } = await params;

  // 1. Authenticate server-side via Auth.js / NextAuth session
  const session = await auth();

  // Redirect to login if token is unauthenticated
  if (!session?.accessToken) {
    redirect(`/api/auth/signin?callbackUrl=/org/${organizationId}`);
  }

  let targetRedirectPath: string | null = null;

  // 2. Direct Server-to-Backend fetch using Bearer Token
  try {
    const backendUrl = (process.env.BACKEND_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
    const response = await fetch(`${backendUrl}/organizations/stores/${organizationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    if (response.ok) {
      const payload = await response.json();
      
      // Handle normalized backend envelope response
      const stores: StoreItem[] = payload?.status && Array.isArray(payload.data) 
        ? payload.data 
        : Array.isArray(payload) 
        ? payload 
        : [];

      if (stores.length > 0) {
        targetRedirectPath = `/org/${organizationId}/${stores[0].id}`;
      } else {
        targetRedirectPath = `/org/${organizationId}/setup-business`;
      }
    }
  } catch (error) {
    console.error("[OrgDecisionPage] Direct backend fetch failed:", error);
  }

  // 3. Perform server redirect if context resolved successfully
  if (targetRedirectPath) {
    redirect(targetRedirectPath);
  }

  // 4. In-Place Terminal UI (Fallback rendered when backend resolution fails)
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Business Profile Resolution Error",
    description: "Terminal fallback for unresolvable business contexts.",
  };

  return (
    <main 
      id="main-content" 
      className="w-full min-h-[85vh] flex items-center justify-center p-4 sm:p-6 font-sans antialiased select-none"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />

      <section 
        aria-labelledby="terminal-error-heading"
        className="w-full max-w-lg bg-card border border-border/60 rounded-[1.5rem] p-6 sm:p-8 shadow-lift flex flex-col items-center text-center space-y-6"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
            <AlertOctagon className="w-8 h-8" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/60 border border-border/40 text-[10px] font-mono font-bold uppercase tracking-wider text-muted mb-1">
            <Building2 className="w-3 h-3 text-muted" aria-hidden="true" />
            <span>Org ID: {organizationId.slice(0, 8)}...</span>
          </div>

          <h1 
            id="terminal-error-heading"
            className="text-lg sm:text-xl font-bold text-foreground tracking-tight"
          >
            Business Profile Unavailable
          </h1>

          <p className="text-xs text-muted font-medium leading-relaxed max-w-md">
            We couldn&apos;t link your account to an active store or business profile within this organization. You cannot proceed further until a valid business context is configured.
          </p>
        </div>

        <div className="w-full space-y-3 pt-2">
          <Link
            href={`/org/${organizationId}`}
            className="w-full min-h-[44px] px-4 rounded-xl bg-brand-secondary text-background font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:bg-brand-secondary/90 focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>Retry Context Connection</span>
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/api/auth/signout"
              className="w-full min-h-[44px] px-4 rounded-xl bg-background border border-border/60 text-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-muted" aria-hidden="true" />
              <span>Sign Out</span>
            </Link>

            <a
              href="mailto:support@nethub.co.ke?subject=Business%20Context%20Resolution%20Error"
              className="w-full min-h-[44px] px-4 rounded-xl bg-background border border-border/60 text-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
            >
              <LifeBuoy className="w-4 h-4 text-muted" aria-hidden="true" />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}