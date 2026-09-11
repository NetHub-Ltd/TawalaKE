import React, { Suspense } from "react";
import type { Metadata } from "next";
import { CustomersList } from "@/features/customers/components/CustomersList";

interface PageProps {
  params: Promise<{ organizationId: string; businessId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Customers | Tawala POS",
    description: "Manage customers, open credit, and sales history.",
  };
}

export default async function CustomersPage({ params }: PageProps) {
  const { organizationId, businessId } = await params;
  return (
    <main id="main-content" className="flex h-full min-h-0 w-full flex-col">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center text-sm text-muted">
            Loading customers…
          </div>
        }
      >
        <CustomersList organizationId={organizationId} businessId={businessId} />
      </Suspense>
    </main>
  );
}
