import React, { Suspense } from "react";
import type { Metadata } from "next";
import { CustomerWorkspace } from "@/features/customers/components/CustomerWorkspace";

interface PageProps {
  params: Promise<{
    organizationId: string;
    businessId: string;
    customerId: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Customer | Tawala POS",
    description: "Customer workspace — credit, history, and profile.",
  };
}

export default async function CustomerWorkspacePage({ params }: PageProps) {
  const { organizationId, businessId, customerId } = await params;
  return (
    <main id="main-content" className="flex h-full min-h-0 w-full flex-col">
      <Suspense
        fallback={
          <div className="flex min-h-[240px] items-center justify-center text-sm text-muted">
            Loading workspace…
          </div>
        }
      >
        <CustomerWorkspace
          organizationId={organizationId}
          businessId={businessId}
          customerId={customerId}
        />
      </Suspense>
    </main>
  );
}
