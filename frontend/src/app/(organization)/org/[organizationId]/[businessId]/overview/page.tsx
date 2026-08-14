import React, { Suspense } from "react";
import type { Metadata } from "next";
import { OverviewClient } from "@/features/analytics/components/OverviewClient";
import { OverviewSkeleton } from "@/features/analytics/components/OverviewSkeleton";

interface OverviewPageProps {
  params: Promise<{
    organizationId: string;
    businessId: string;
  }>;
}

export async function generateMetadata({ params }: OverviewPageProps): Promise<Metadata> {
  const { organizationId, businessId } = await params;
  return {
    title: "Sales Analytics | Tawala POS",
    description: "Monitor real-time sales, revenue trends, and key performance indicators.",
    alternates: {
      canonical: `https://nethub.co.ke/org/${organizationId}/${businessId}/overview`,
    },
  };
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const { organizationId, businessId } = await params;

  // JSON-LD Structured Data (BreadcrumbList)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Organization",
        "item": `https://nethub.co.ke/org/${organizationId}`,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Business",
        "item": `https://nethub.co.ke/org/${organizationId}/${businessId}`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Overview",
        "item": `https://nethub.co.ke/org/${organizationId}/${businessId}/overview`,
      },
    ],
  };

  return (
    <main id="main-content" className="w-full h-full flex flex-col min-h-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewClient organizationId={organizationId} businessId={businessId} />
      </Suspense>
    </main>
  );
}