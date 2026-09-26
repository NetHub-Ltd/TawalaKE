import { loadProductChangelog } from "@/features/org/lib/product-changelog";
import { OrgUpdatesClient } from "@/features/org/components/OrgUpdatesClient";

export const metadata = {
  title: "Product updates | Tawala",
  description: "Recent product improvements and fixes.",
};

export const revalidate = 900;

export default async function OrgUpdatesPage() {
  const changelog = await loadProductChangelog();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Product updates
        </h1>
        <p className="mt-1 text-sm text-muted">
          What&apos;s new in Tawala — features and fixes as they ship on main and development.
        </p>
      </div>
      <OrgUpdatesClient
        entries={changelog.entries}
        updatedAt={changelog.updated_at}
      />
    </div>
  );
}
