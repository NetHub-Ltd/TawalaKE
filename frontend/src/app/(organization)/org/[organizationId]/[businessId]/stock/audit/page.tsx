import { Metadata } from "next";
import { AuditWorkspace } from "@/features/inventory/AuditWorkspace";

interface PageProps {
  params: Promise<{
    organizationId: string;
    businessId: string;
  }>;
}

// 1. Enforce strict SEO constraints via Next.js Metadata API
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nethub.co.ke";
  const canonicalUrl = `${baseUrl}/org/${resolvedParams.organizationId}/terminal/${resolvedParams.businessId}/stock/audit`;

  return {
    title: "Inventory Stocktake Audit & Reconciliation | NetHub",
    description: "Execute real-time physical stock counts, reconcile system variances, and track warehouse shrinkage records securely.",
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false, // Internal terminal screens should remain unindexed for platform security
      follow: false,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const {businessId, organizationId} = await params;

  // 2. Structural Schema Injection for deep administrative context paths
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "NetHub Inventory Audit Terminal",
    "applicationCategory": "BusinessApplication",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "operatingSystem": "All",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-slate-50">
        <AuditWorkspace businessId={businessId} />
      </main>
    </>
  );
}