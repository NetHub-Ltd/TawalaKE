import type { Metadata } from "next";
import { Suspense } from "react";
import { CartFullPage } from "@/features/sales/components/CartFullPage";

export const metadata: Metadata = {
  title: "Cart | Tawala POS",
  description: "Review cart items before checkout.",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ organizationId: string; businessId: string }>;
}

export default async function CartPage({ params }: PageProps) {
  const { organizationId, businessId } = await params;
  return (
    <main id="main-content" className="flex min-h-0 w-full flex-1 flex-col">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
            Loading cart…
          </div>
        }
      >
        <CartFullPage organizationId={organizationId} businessId={businessId} />
      </Suspense>
    </main>
  );
}
