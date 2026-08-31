// import React from "react";
// import { Metadata } from "next";
// import { BusinessProvider } from "@/features/business/components/BusinessProvider";
// import { Sidebar } from "@/features/org/components/Sidebar";
// import { Header } from "@/features/org/components/Header";

// export const metadata: Metadata = {
//   title: "Terminal | Sales Hub",
//   description: "High-performance POS interface for streamlined business operations.",
//   robots: "noindex, nofollow",
//   alternates: {
//     canonical: "https://tawala.io/terminal",
//   },
// };

// interface LayoutProps {
//   children: React.ReactNode;
//   params: Promise<{ businessId: string; organizationId: string }>;
// }

// export default async function TerminalLayout({
//   children,
//   params,
// }: LayoutProps) {
//   const { organizationId, businessId } = await params;

//   if (!businessId) {
//     return null;
//   }

//   const businessName = "Terminal Node";

//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "SoftwareApplication",
//     "name": "Tawala POS Terminal",
//     "applicationCategory": "BusinessApplication",
//     "operatingSystem": "Web, Mobile, Desktop",
//     "description": "Secure transactional workspace for active point-of-sale environments.",
//   };

//   return (
//     <BusinessProvider businessId={businessId} businessName={businessName} organizationId={organizationId}>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />
      
//       <div className="h-screen w-full flex flex-row overflow-hidden select-none overscroll-none">
//         {/* FIXED LEFT SIDEBAR PANEL */}
//         <Sidebar businessId={businessId} organizationId={organizationId} />

//         {/* WORKSPACE COLUMN CONTENT STREAM */}
//         <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
//           <Header />
          
//           <main 
//             id="main-content" 
//             className="flex-1 min-w-0 min-h-0 relative"
//           >
//             <div className="absolute inset-0 px-2 overflow-y-auto overscroll-contain focus:outline-none">
//               {children}
//             </div>
//           </main>
//         </div>
//       </div>
//     </BusinessProvider>
//   );
// }
import React from "react";
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { orgMatchesSession } from "@/lib/auth/require-api-auth";
import { BusinessProvider } from "@/features/business/components/BusinessProvider";
import { Sidebar } from "@/features/org/components/Sidebar";
import { Header } from "@/features/org/components/Header";

export const metadata: Metadata = {
  title: "Terminal | Sales Hub",
  description:
    "High-performance POS interface for streamlined business operations.",
  robots: {
    index: false,
    follow: false,
  },
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ businessId: string; organizationId: string }>;
}

export default async function TerminalLayout({
  children,
  params,
}: LayoutProps) {
  const { organizationId, businessId } = await params;

  if (!businessId || !organizationId) {
    return null;
  }

  const session = await auth();

  if (!session?.user || session.error) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(
        `/org/${organizationId}/${businessId}/overview`,
      )}`,
    );
  }

  if (!orgMatchesSession(organizationId, session.user.organization_id)) {
    notFound();
  }

  // Real role from JWT/session — no CASHIER default
  const userRole = (session.user.role || "").toUpperCase().trim();

  if (!userRole) {
    redirect("/org");
  }

  const businessName = "Terminal Node";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tawala POS Terminal",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Mobile, Desktop",
    description:
      "Secure transactional workspace for active point-of-sale environments.",
  };

  return (
    <BusinessProvider
      businessId={businessId}
      businessName={businessName}
      organizationId={organizationId}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* POS is optimized for widescreen terminals — soft guidance on small screens */}
      <div className="flex md:hidden fixed inset-0 z-[100] flex-col items-center justify-center bg-background p-6 text-center font-sans">
        <p className="text-xs font-bold uppercase tracking-wider text-foreground">
          Wider screen recommended
        </p>
        <p className="mt-2 max-w-xs text-[11px] font-medium leading-relaxed text-muted">
          The sales terminal works best on a tablet or desktop. You can still
          continue on this device, but some controls may feel cramped.
        </p>
      </div>

      <div className="hidden md:flex h-screen w-full flex-row overflow-hidden select-none overscroll-none">
        <Sidebar
          businessId={businessId}
          organizationId={organizationId}
          userRole={userRole}
        />

        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Header />

          <main id="terminal-main" className="relative min-h-0 min-w-0 flex-1">
            <div className="absolute inset-0 overflow-y-auto overscroll-contain px-2 focus:outline-none">
              {children}
            </div>
          </main>
        </div>
      </div>
    </BusinessProvider>
  );
}