import React, { Suspense } from "react";
import type { Metadata } from "next";
import { CollectCreditForm } from "@/features/customers/components/CollectCreditForm";

interface PageProps {
  params: Promise<{
    organizationId: string;
    businessId: string;
    customerId: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Collect Credit | Tawala POS",
    description: "Record payment on open credit sales for a customer.",
  };
}

export default async function CollectCreditPage({ params }: PageProps) {
  const { organizationId, businessId, customerId } = await params;
  return (
    <main id="main-content" className="flex h-full min-h-0 w-full flex-col">
      <Suspense
        fallback={
          <div className="flex min-h-[240px] items-center justify-center text-sm text-muted">
            Loading…
          </div>
        }
      >
        <CollectCreditForm
          organizationId={organizationId}
          businessId={businessId}
          customerId={customerId}
        />
      </Suspense>
    </main>
  );
}
