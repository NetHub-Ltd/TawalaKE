// // src/app/products/[id]/new/page.tsx (or wherever it is)

// import { AssetFormWrapper } from "@/features/inventory/AssetFormWrapper";

// interface PageProps {
//   params: Promise<{
//     businessId: string;
//   }>;
// }

// export default async function NewProductPage({ params }: PageProps) {
//   const resolvedParams = await params;
//   const businessId = resolvedParams.businessId;

//   return (
//     <div className="w-full mx-auto">
//       <AssetFormWrapper businessId={businessId} />
//     </div>
//   );
// }

import { Metadata } from "next";
import React from "react";
import { AssetFormWrapper } from "@/features/inventory/AssetFormWrapper";

interface NewAssetPageProps {
  params: Promise<{ businessId: string, organizationId: string }>;
}

export async function generateMetadata({
  params,
}: NewAssetPageProps): Promise<Metadata> {
  const { businessId} = await params;
  return {
    title: "New Asset Registration | NetHub Terminal",
    description: "Register and catalog new inventory assets, set valuation, and track stock.",
    alternates: {
      canonical: `https://nethub.co.ke/terminal/${businessId}/inventory/new`,
    },
  };
}

export default async function NewAssetPage({ params }: NewAssetPageProps) {
  const { businessId, organizationId } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Terminal",
        item: `https://nethub.co.ke/terminal/${businessId}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Inventory",
        item: `https://nethub.co.ke/terminal/${businessId}/inventory`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "New Asset",
        item: `https://nethub.co.ke/terminal/${businessId}/inventory/new`,
      },
    ],
  };

  return (
    <main id="main-content" className="w-full min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto">
        <AssetFormWrapper businessId={businessId} organizationId={organizationId} />
      </div>
    </main>
  );
}