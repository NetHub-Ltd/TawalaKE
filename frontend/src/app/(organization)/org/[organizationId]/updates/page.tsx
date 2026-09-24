import type { Metadata } from "next";
import { loadProductChangelog } from "@/features/org/lib/product-changelog";
import { OrgUpdatesClient } from "@/features/org/components/OrgUpdatesClient";

export const metadata: Metadata = {
  title: "Product updates | Tawala",
  description: "Recent product improvements, fixes, and new features for your organization.",
  robots: { index: false, follow: false },
};

export default async function OrgUpdatesPage() {
  const changelog = await loadProductChangelog();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Product updates
        </h1>
        <p className="mt-1 text-sm text-muted">
          What&apos;s new in Tawala — features, fixes, and improvements. No technical internals;
          just what matters for your team.
        </p>
      </header>
      <OrgUpdatesClient entries={changelog.entries} updatedAt={changelog.updated_at} />
    </div>
  );
}
