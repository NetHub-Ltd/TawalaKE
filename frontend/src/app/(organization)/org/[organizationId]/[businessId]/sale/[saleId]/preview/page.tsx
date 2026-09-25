import { Metadata } from "next";
import { notFound } from "next/navigation";
import ReceiptClientView from "./ReceiptClientView";

type Props = {
  params: Promise<{ saleId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { saleId } = await params;

  return {
    title: `Document ${saleId.slice(0, 8).toUpperCase()} | Tawala`,
    description: "View and print sales receipt or tax invoice.",
    robots: { index: false, follow: false },
  };
}

export default async function ReceiptPreviewPage({ params }: Props) {
  const { saleId } = await params;

  if (!saleId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto flex justify-center px-4 print:px-0">
        <ReceiptClientView saleId={saleId} />
      </div>
    </div>
  );
}
