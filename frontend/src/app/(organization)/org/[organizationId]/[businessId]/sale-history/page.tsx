// import React from "react";
// import SalesHistoryWorkspace from "@/features/sales/components/SalesHistoryWorkspace";

// /**
//  * @Scribe_Audit
//  * Architecture: Server-Side Page Wrapper decoupling server layouts from interactive state hooks.
//  */
// export default async function SalesHistoryPage() {
//   return (
//     <div className="w-full max-h-screen bg-background text-foreground flex flex-col p-6 selection:bg-brand-primary/20 overflow-hidden">
//       {/* GLOBAL VIEWPORT HEADER */}
//       <header className="w-full pb-5 border-b border-border/40 shrink-0 mb-6">
//         <span className="text-[9px] font-black tracking-wider uppercase text-brand-primary block">Secure POS Stream</span>
//         <h1 className="text-sm font-black uppercase tracking-tight text-foreground">Sales Transaction Audit</h1>
//       </header>

//       {/* CORE INTERACTIVE CLIENT BOUNDARY */}
//       <div className="flex-1 min-h-0 w-full flex flex-col">
//         <SalesHistoryWorkspace />
//       </div>
//     </div>
//   );
// }

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
      <main id="main-content" className="h-screen w-full bg-background text-foreground flex flex-col p-4 overflow-hidden">
        {/* CORE INTERACTIVE CLIENT BOUNDARY - Takes exactly remaining screen space with zero leakage */}
        <div className="flex-1 min-h-0 w-full flex flex-col">
          <SalesHistoryWorkspace />
        </div>
      </main>
    </>
  );
}