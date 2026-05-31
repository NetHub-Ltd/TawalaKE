import { Metadata } from "next";
// import TerminalCockpit from "@/features/terminal/components/TerminalCockpit";
import { Suspense } from "react";
import TerminalCockpit from "@/features/business/components/TerminalCockpit";


/**
 * @Scribe_Audit
 * SEO: No-index for internal terminal routes to protect business data.
 * Architecture: Server-side param handling with client-side interactivity.
 */

export const metadata: Metadata = {
  title: "Terminal | POS System",
  description: "High-performance point of sale interface.",
  robots: { index: false, follow: false },
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

function TerminalLoadingSkeleton() {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <div className="flex-1 p-6 grid grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-64 bg-card rounded-[2.5rem] animate-pulse"
          />
        ))}
      </div>
      <div className="w-[420px] border-l border-border bg-card/50 animate-pulse" />
    </div>
  );
}
