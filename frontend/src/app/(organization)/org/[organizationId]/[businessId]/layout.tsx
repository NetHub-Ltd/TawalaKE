import React from "react";
import { Metadata } from "next";
import { BusinessProvider } from "@/features/business/components/BusinessProvider";
import { Sidebar} from "@/features/org/components/Sidebar";
import {Header} from "@/features/org/components/Header"


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

  // Real-time operations platform tracking configuration for hardware telemetry
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
      
      {/* 
        MAIN APP SHELL: 
        Enforces a hardware-bounded app viewport. Restricts color variables to global design tokens 
        without explicit hardcoded color text or typography overrides.
      */}
      <div className="h-screen w-full flex flex-row overflow-hidden select-none">
        
        {/* FIXED LEFT SIDEBAR PANEL */}
        <Sidebar businessId={businessId} organizationId={organizationId} />

        {/* WORKSPACE COLUMN CONTENT STREAM */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <Header />
          
          {/* INTERNAL ISOLATED CONTENT VIEWPORT */}
          <main 
            id="main-content" 
            className="flex-1 min-w-0 min-h-0 relative"
          >
            {/* SCROLLABLE VIEWPORT FRAME */}
            <div className="absolute inset-0 overflow-y-auto focus:outline-none">
              {children}
            </div>
          </main>

        </div>
      </div>
    </BusinessProvider>
  );
}