import { Metadata } from "next";
import { AssetComposer } from "@/features/inventory/AssetComposer";

/**
 * @Scribe_Audit
 * Fix: Updated Props to use Promise for params, resolving Next.js 15+ Type error 37:29.
 * Architecture: Server Component awaits params before passing ID to the Client Composer.
 * SEO: Dynamic metadata titles for CRUD situational awareness.
 */

interface Props {
  params: Promise<{
    businessId: string;
    id?: string[];
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const isEdit = !!id?.[0];

  return {
    title: isEdit
      ? "Edit Asset | Inventory Management"
      : "Create New Asset | Inventory Management",
    description:
      "Configure product specifications, pricing, and stock levels in the central registry.",
  };
}

export default async function Page({ params }: Props) {
  // Awaiting params is mandatory in the latest Next.js APIs
  const { businessId, id } = await params;
  const productId = id?.[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: productId ? "Asset Editor" : "Asset Creator",
    description: "Interface for modifying business inventory data.",
    breadcrumb: `Inventory > ${productId ? "Edit" : "Create"}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AssetComposer productId={productId} businessId={businessId} />
    </>
  );
}