import { redirect } from "next/navigation";
import CompleteSaleClient from "@/features/sales/components/CompleteSaleClient";

type Props = {
  params: Promise<{ organizationId: string; businessId: string }>;
  searchParams: Promise<{ saleId?: string }>;
};

export default async function CompleteSalePage({ params, searchParams }: Props) {
  const { organizationId, businessId } = await params;
  const { saleId } = await searchParams;

  if (!saleId) {
    redirect(`/org/${organizationId}/${businessId}/terminal`);
  }

  return (
    <CompleteSaleClient
      organizationId={organizationId}
      businessId={businessId}
      saleId={saleId}
    />
  );
}
