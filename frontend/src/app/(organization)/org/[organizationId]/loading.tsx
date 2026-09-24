import { BrandLoader } from "@/lib/components/ui";

function LayoutGhost() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="h-14 border-b border-border/40" />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <div className="hidden w-52 shrink-0 border-r border-border/35 md:block" />
        <div className="flex-1 space-y-4 p-6 md:p-8">
          <div className="h-7 w-44 rounded-lg border border-border/40" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-28 rounded-xl border border-border/35" />
            <div className="h-28 rounded-xl border border-border/35" />
            <div className="h-28 rounded-xl border border-border/35" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrgLoading() {
  return (
    <div className="relative min-h-screen">
      <LayoutGhost />
      <BrandLoader
        overlay
        size="md"
        label="Loading organization…"
        hint="Fetching your workspace"
      />
    </div>
  );
}
