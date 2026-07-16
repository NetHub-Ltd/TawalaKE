import type { Metadata } from "next";
import React from "react";
import SalesHistoryWorkspace from "@/features/sales/components/SalesHistoryWorkspace";

export const metadata: Metadata = {
  title: "Sales History Audit | POS Terminal",
  description: "Real-time secure transaction ledger matching point-of-sale historical records.",
  alternates: {
    canonical: "https://nethub.co.ke/sales",
  },
};

/**
 * @Scribe_Audit
 * Architecture: Server-Side Page Wrapper enforcing a rigid viewport framework.
 * UX: Enforces a strict 100vh layout with zero leakage to match native desktop desktop standards.
 */
export default async function SalesHistoryPage() {
  // Structured Data to fulfill Technical SEO Mandate
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Sales History Audit Terminal",
    "description": "Real-time immutable point-of-sale historical ledger access panel.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Enforce full desktop window lock via h-screen + overflow-hidden */}
      <main id="main-content" className="w-full flex flex-col p-4 overflow-hidden">
        {/* CORE INTERACTIVE CLIENT BOUNDARY - Takes exactly remaining screen space with zero leakage */}
        <div className="flex-1 w-full flex flex-col">
          <SalesHistoryWorkspace />
        </div>
      </main>
    </>
  );
}