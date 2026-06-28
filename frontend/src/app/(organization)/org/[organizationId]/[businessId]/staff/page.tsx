import type { Metadata } from "next";
import React from "react";
// import StaffWorkspace from "@/features/staff/components/StaffWorkspace";
import StaffWorkspace from "@/features/staff/components/StaffWorkSpace";

export const metadata: Metadata = {
  title: "Staff Management | POS Administrative Terminal",
  description: "Audit organization user identities, manage operational scope roles, and allocate workspace permissions.",
  alternates: {
    canonical: "https://nethub.co.ke/staff",
  },
};

/**
 * @Scribe_Audit
 * Architecture: Server-Side Page Controller providing zero-overhead SEO ingestion.
 * Intent: Isolates static semantic boundaries from dynamic runtime hook states to optimize initial layout painting.
 */
export default async function StaffPage() {
  // Administrative Workspace Schema Configuration
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Staff Management Roster Terminal",
    "description": "Secure access-matrix console for managing multi-tenant business personnel structures.",
    "provider": {
      "@type": "Organization",
      "name": "NetHub",
      "url": "https://nethub.co.ke"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Structural HTML5 Landmark Constraint */}
      <main id="main-content" className="w-full h-full min-h-0 flex flex-col">
        <StaffWorkspace />
      </main>
    </>
  );
}