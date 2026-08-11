import React from "react";
import { Metadata } from "next";
import { BusinessProvider } from "@/features/business/components/BusinessProvider";
import { Sidebar } from "@/features/org/components/Sidebar";
import { Header } from "@/features/org/components/Header";

export const metadata: Metadata = {
  title: "Terminal | Sales Hub",
  description: "High-performance POS interface for streamlined business operations.",
  robots: "noindex, nofollow",
  alternates: {
    canonical: "https://tawala.io/terminal",
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

  if (!businessId) {
    return null;
  }

  const businessName = "Terminal Node";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Tawala POS Terminal",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, Mobile, Desktop",
    "description": "Secure transactional workspace for active point-of-sale environments.",
  };

  return (
    <BusinessProvider businessId={businessId} businessName={businessName} organizationId={organizationId}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* MAIN APP SHELL: 
        Changed min-h-screen to h-screen to strictly clamp the viewport bounds.
        Added overscroll-behavior-y-none to prevent bounce-back layout painting shifts.
      */}
      <div className="h-screen w-full flex flex-row overflow-hidden select-none overscroll-none">
        
        {/* FIXED LEFT SIDEBAR PANEL */}
        <Sidebar businessId={businessId} organizationId={organizationId} />

        {/* WORKSPACE COLUMN CONTENT STREAM */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          
          {/* HEADER ROW */}
          <Header />
          
          {/* INTERNAL ISOLATED CONTENT VIEWPORT */}
          <main 
            id="main-content" 
            className="flex-1 min-w-0 min-h-0 relative"
          >
            {/* SCROLLABLE VIEWPORT FRAME */}
            <div className="absolute inset-0 overflow-y-auto overscroll-contain focus:outline-none">
              {children}
            </div>
          </main>

        </div>
      </div>
    </BusinessProvider>
  );
}