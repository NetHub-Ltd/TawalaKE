import { Metadata } from "next";
import { InventoryRegistry } from "@/features/business/components/InventoryRegistry";

/**
 * @Scribe_Audit
 * SEO: High-intent title for internal searchability.
 * Architecture: Server-side container to manage layout and metadata.
 */

export const metadata: Metadata = {
  title: "Inventory Registry | Asset Management",
  description:
    "Comprehensive overview of all business assets, stock levels, and procurement metrics.",
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: "Business Inventory Registry",
            description: "Real-time stock and SKU management ledger.",
          }),
        }}
      />
      <InventoryRegistry />
    </>
  );
}
