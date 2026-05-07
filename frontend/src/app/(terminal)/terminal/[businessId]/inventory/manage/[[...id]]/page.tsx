import { Metadata } from "next";
// import { AssetComposer } from "@/features/inventory/components/AssetComposer";
import { AssetComposer } from "@/features/inventory/AssetComposer";

/**
 * @Scribe_Audit
 * Architecture: Optional catch-all segment allows one route to handle Create & Edit.
 * SEO: Title updates dynamically based on the presence of an ID.
 */

interface Props {
  params: { id?: string[] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const isEdit = !!params.id?.[0];
  return {
    title: isEdit
      ? "Edit Asset | Inventory Management"
      : "Create New Asset | Inventory Management",
    description:
      "Configure product specifications, pricing, and stock levels in the central registry.",
  };
}

export default function Page({ params }: Props) {
  const productId = params.id?.[0];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: productId ? "Asset Editor" : "Asset Creator",
            description: "Interface for modifying business inventory data.",
          }),
        }}
      />
      <AssetComposer productId={productId} />
    </>
  );
}
