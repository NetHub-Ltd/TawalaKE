import { Metadata } from "next";
import { notFound } from "next/navigation";
import ReceiptClientView from "./ReceiptClientView";

type Props = {
  params: Promise<{ saleId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { saleId } = await params;

  return {
    title: `Receipt #${saleId.slice(0, 8).toUpperCase()} | Tawala POS`,
    description: "View and print your secure transaction receipt and digital tax invoice.",
    alternates: {
      canonical: `/receipts/${saleId}/preview`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function ReceiptPreviewPage({ params }: Props) {
  const { saleId } = await params;

  if (!saleId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <ReceiptClientView saleId={saleId} />
      </div>
    </div>
  );
}