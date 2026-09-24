import { BrandLoader } from "@/lib/components/ui";

/** Next.js loading UI for /org segment */
export default function OrgRootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <BrandLoader
        size="lg"
        label="Loading organization…"
        hint="Preparing your workspace"
      />
    </div>
  );
}
