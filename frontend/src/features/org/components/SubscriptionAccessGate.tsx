"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AccessPayload = {
  access_phase?: string;
  trial_consumed?: boolean;
  trial_eligible?: boolean;
  is_trial?: boolean;
  end_date?: string | null;
  grace_end_date?: string | null;
  days_remaining?: number | null;
  grace_days_remaining?: number | null;
  plan_name?: string | null;
  plan_code?: string | null;
};

/**
 * Grace reminder modal + full lock overlay after grace ends.
 * Login still works; locked orgs cannot use product routes.
 */
export function SubscriptionAccessGate({
  organizationId,
}: {
  organizationId: string;
}) {
  const pathname = usePathname();
  const [access, setAccess] = useState<AccessPayload | null>(null);
  const [dismissedGrace, setDismissedGrace] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/org/subscription", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!cancelled) setAccess((body?.data as AccessPayload) || null);
      } catch {
        if (!cancelled) setAccess(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId, pathname]);

  // Allow billing + contact while locked
  const isBillingPath =
    pathname?.includes("/billing") || pathname?.includes("/contact");

  if (!access) return null;

  const phase = access.access_phase || "none";

  if (phase === "grace" && !dismissedGrace) {
    const days = access.grace_days_remaining ?? 0;
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="grace-title"
      >
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lift">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Grace period
          </p>
          <h2 id="grace-title" className="text-lg font-semibold text-foreground">
            Your trial has ended
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            You still have full access for about{" "}
            <strong className="text-foreground">
              {days} day{days === 1 ? "" : "s"}
            </strong>
            . Please arrange payment so your team is not locked out.
            The organization owner has been notified by email.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/org/${organizationId}/billing`}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white"
            >
              View billing
            </Link>
            <button
              type="button"
              onClick={() => setDismissedGrace(true)}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-foreground"
            >
              Continue for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "locked" && !isBillingPath) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-md"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="lock-title"
      >
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 text-center shadow-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="mx-auto h-10 w-10 object-contain" />
          <h2 id="lock-title" className="text-lg font-semibold text-foreground">
            Access locked
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Your organization&apos;s trial and grace period have ended. You can still
            sign in, but workspaces are locked until payment is completed.
            Contact your organization owner or Tawala support if you need a short
            extension.
          </p>
          <Link
            href={`/org/${organizationId}/billing`}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white"
          >
            Go to billing
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
