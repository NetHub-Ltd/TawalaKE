import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Organization settings | Tawala",
  description: "Organization profile and identity.",
};

/**
 * Org settings shell — profile form wiring is a follow-up (Phase 3/4).
 * Phase 1: route + permission-gated layout exist.
 */
export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-2 sm:p-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Organization settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Legal identity for this account (name, phone, address, KRA PIN). Full
          profile editor ships next; billing stays under Billing for the owner.
        </p>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        <p>
          Organization ID{" "}
          <span className="font-mono text-foreground">
            {organizationId.slice(0, 8)}…
          </span>
        </p>
        <p className="mt-3">
          Manage branches under{" "}
          <Link
            href={`/org/${organizationId}/stores`}
            className="font-semibold text-brand-primary hover:underline"
          >
            Branches
          </Link>
          , people under{" "}
          <Link
            href={`/org/${organizationId}/staff`}
            className="font-semibold text-brand-primary hover:underline"
          >
            Team
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
