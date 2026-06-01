import React from "react";
import { Metadata } from "next";
import { BusinessProvider } from "@/features/business/components/BusinessProvider";

export const metadata: Metadata = {
  title: "Terminal | Sales Hub",
  description: "High-performance POS interface for streamlined business operations.",
  robots: "noindex, nofollow",
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

  if (!businessId) {
    return null;
  }

  const businessName = "Terminal Node";

  return (
    <BusinessProvider businessId={businessId} businessName={businessName} organizationId={organizationId}>
      {/* MAIN APP SHELL: 
        - h-dvh (Dynamic Viewport Height) completely locks the container to the screen size.
        - overflow-hidden strips the main body of any scrolling capabilities.
      */}
      <div className="h-dvh w-full flex flex-col bg-background overflow-hidden select-none text-foreground">
        
        {/* FIXED HEADER: Stays clamped to the top */}
        {/* <TerminalHeader businessName={businessName} /> */}

        {/* BODY CONTAINER: 
          - flex-1 + min-h-0 prevents inner elements from expanding this container beyond the screen boundaries.
        */}
        <div className="flex flex-1 min-h-0 w-full overflow-hidden">
          
          {/* FIXED SIDE NAVIGATION: Frozen layout sidebar element */}
          {/* <TerminalSidebar businessId={businessId} /> */}

          {/* INTERNAL VIEWPORT:
            - overflow-hidden forces containment.
          */}
          <main 
            id="main-content" 
            className="flex-1 flex flex-col min-w-0 min-h-0 bg-background overflow-hidden relative"
          >
            {/* SCROLLABLE VIEWPORT FRAME:
              - overflow-y-auto ensures that only the child forms (like AssetComposer) scroll if they overflow.
            */}
            <div className="h-full w-full flex flex-col min-h-0 min-w-0 overflow-y-auto relative">
              {children}
            </div>
          </main>

        </div>
      </div>
    </BusinessProvider>
  );
}