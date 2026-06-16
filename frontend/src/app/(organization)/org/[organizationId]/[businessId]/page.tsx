import { Metadata } from "next";
import { Suspense } from "react";
import TerminalCockpit from "@/features/business/components/TerminalCockpit";

/**
 * @Scribe_Audit
 * SEO: Protect corporate tenant operational layouts with tight indexing filters.
 * Architecture: Clean stream orchestration decoupled from strict layout boxes.
 */
export const metadata: Metadata = {
  title: "Terminal | POS System",
  description: "High-performance point of sale interface.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: "https://tawala.io/terminal",
  },
};

interface PageProps {
  params: Promise<{ businessId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { businessId } = await params;

  return (
    <Suspense fallback={<TerminalLoadingSkeleton />}>
      <TerminalCockpit businessId={businessId} />
    </Suspense>
  );
}

/**
 * TerminalLoadingSkeleton:
 * Perfectly aligns with your layout viewport boundaries to achieve zero-layout-shift (CLS).
 * Delegates background colors, borders, and border-radii directly to the system .card-layered design token.
 */
function TerminalLoadingSkeleton() {
  return (
    <div 
      className="absolute inset-0 flex overflow-hidden gap-6"
      aria-hidden="true"
    >
      {/* Primary Grid Stream Workspace */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 overflow-hidden min-w-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="card-layered h-full min-h-64 animate-pulse"
          />
        ))}
      </div>
      
      {/* Dynamic Sidebar Control Deck Panel */}
      <div className="hidden lg:block w-96 card-layered h-full bg-card/40 animate-pulse border-l" />
    </div>
  );
}