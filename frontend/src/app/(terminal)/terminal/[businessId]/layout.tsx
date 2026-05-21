// import React from "react";
// import { Metadata } from "next";
// import { TerminalHeader } from "@/features/business/components/TerminalHeader";
// import { TerminalSidebar } from "@/features/business/components/TerminalSidebar";
// import { BusinessProvider } from "@/features/business/components/BusinessProvider";
// import { cn } from "@/lib/utils";

// /**
//  * @Scribe_Audit
//  * Fix: Removed searchParams from LayoutProps to resolve Next.js Type Error 184:31.
//  * Performance: Layout is kept as a Server Component; navigation is handled via Client Islands.
//  * Architecture: businessName is now derived from businessId or a default to maintain layout stability.
//  */

// export const metadata: Metadata = {
//   title: "Terminal | Sales Hub",
//   description:
//     "High-performance POS interface for streamlined business operations.",
//   robots: "noindex, nofollow",
// };

// interface LayoutProps {
//   children: React.ReactNode;
//   params: Promise<{ businessId: string}>;
// }

// export default async function TerminalLayout({
//   children,
//   params,
// }: LayoutProps) {
//   // Await params for Next.js 16 asynchronous dynamic APIs
//   const { businessId} = await params;

// if (!businessId){
//   return null
// }

// const businessName = "Terminal Node"

//   return (
//     <BusinessProvider businessId={businessId} businessName={businessName}>
//       <div className="h-screen w-full flex flex-col bg-background overflow-hidden select-none text-foreground">
//         {/* GLOBAL HEADER (Client Island) */}
//         <TerminalHeader businessName={businessName} />

//         <div className="flex flex-1 min-h-0">
//           {/* SIDE NAVIGATION (Client Island) */}
//           <TerminalSidebar businessId={businessId} />

//           {/* INTERNAL VIEWPORT (Server Rendered) */}
//           <main
//             // className={cn(
//             //   "flex-1 overflow-y-auto relative bg-background",
//             //   "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
//             // )}
//           >
//             <div className="h-screen">{children}</div>
//           </main>
//         </div>
//       </div>
//     </BusinessProvider>
//   );
// }

import React from "react";
import { Metadata } from "next";
import { TerminalHeader } from "@/features/business/components/TerminalHeader";
import { TerminalSidebar } from "@/features/business/components/TerminalSidebar";
import { BusinessProvider } from "@/features/business/components/BusinessProvider";

export const metadata: Metadata = {
  title: "Terminal | Sales Hub",
  description:
    "High-performance POS interface for streamlined business operations.",
  robots: "noindex, nofollow",
};

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}

export default async function TerminalLayout({
  children,
  params,
}: LayoutProps) {
  // Await params for Next.js asynchronous dynamic APIs
  const { businessId } = await params;

  if (!businessId) {
    return null;
  }

  const businessName = "Terminal Node";

  return (
    <BusinessProvider businessId={businessId} businessName={businessName}>
      {/* Main App Shell: Locked strictly to the dynamic screen height. 
        select-none prevents accidental UI text highlighting during fast checkout clicks.
      */}
      <div className="h-dscreen w-screen flex flex-col bg-background overflow-hidden select-none text-foreground">
        
        {/* GLOBAL HEADER (Fixed height internally, e.g., h-14 or h-16) */}
        <TerminalHeader businessName={businessName} />

        {/* Body Wrapper: Takes up remaining vertical space; min-h-0 prevents child expansion scroll injection */}
        <div className="flex flex-1 min-h-0 w-full overflow-hidden">
          
          {/* SIDE NAVIGATION (Fixed width, native height) */}
          <TerminalSidebar businessId={businessId} />

          {/* INTERNAL VIEWPORT (Main Window Canvas):
            - flex-1 + min-w-0 / min-h-0 forces it to fill empty space perfectly without collapsing or breaking bounds.
            - overflow-hidden explicitly kills window-level scrolling.
          */}
          <main 
            id="main-content" 
            className="flex-1 flex flex-col min-w-0 min-h-0 bg-background overflow-hidden relative"
          >
            {/* Child Layout Target:
              - h-full + w-full ensures it stretches completely even if empty, giving that premium "blank application window" look.
              - Children are expected to manage their own scroll mechanics using `overflow-y-auto`.
            */}
            <div className="h-full w-full flex flex-col min-h-0 min-w-0 relative">
              {children}
            </div>
          </main>

        </div>
      </div>
    </BusinessProvider>
  );
}