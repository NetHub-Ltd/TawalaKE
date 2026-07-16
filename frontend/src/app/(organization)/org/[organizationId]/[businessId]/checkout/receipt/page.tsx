import { Metadata } from "next";
// import ReceiptClientView from "./ReceiptClientView";
import ReceiptClientView from "@/features/sales/components/ReceiptClientView"

/**
 * @SEO_Architect_Audit
 * Guarding index integrity by enforcing strict, singular canonical pathways.
 * Pre-rendering localized structured JSON-LD schemas directly to the raw payload stream.
 */

export const metadata: Metadata = {
  title: "Transaction Receipt | Tawala POS Settlement",
  description: "View and print your secure transaction receipt, digital tax invoice, and retail ledger records instantly on the Tawala POS platform.",
  alternates: {
    canonical: "https://nethub.co.ke/checkout/receipt",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ReceiptPage() {
  // Generate strict, standardized point-of-sale receipt schemas
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "OrderAction",
    "name": "Point of Sale Settlement Document",
    "description": "Secure cryptographic client ledger transaction documentation processed via Tawala Engine.",
    "agent": {
      "@type": "Organization",
      "name": "Tawala Retail Ltd",
      "location": "Mombasa Road, Nairobi, KE"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />
      <ReceiptClientView />
    </>
  );
}