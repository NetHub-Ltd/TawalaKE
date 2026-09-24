import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ExpensesClient } from "@/features/expenses/components/ExpensesClient";

interface PageProps {
  params: Promise<{ organizationId: string; businessId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Expenses | Tawala POS",
    description: "Track operating expenses for profit after expenses.",
  };
}

export default async function ExpensesPage({ params }: PageProps) {
  const { organizationId, businessId } = await params;
  return (
    <main id="main-content" className="flex h-full min-h-0 w-full flex-col">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center text-sm text-muted">
            Loading expenses…
          </div>
        }
      >
        <ExpensesClient
          organizationId={organizationId}
          businessId={businessId}
        />
      </Suspense>
    </main>
  );
}
