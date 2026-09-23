"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Spinner } from "@/lib/components/ui";
import {
  clearPlatformSession,
  getPlatformAccessToken,
  listPlatformOrganizations,
  type PlatformOrg,
} from "@/lib/platform/auth";

export default function PlatformHomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [orgs, setOrgs] = useState<PlatformOrg[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getPlatformAccessToken();
    if (!token) {
      router.replace("/platform/login");
      return;
    }
    setReady(true);
    void (async () => {
      try {
        const rows = await listPlatformOrganizations({ limit: 200 });
        setOrgs(rows);
      } catch (err) {
        const status = (err as { status?: number })?.status;
        if (status === 401) {
          clearPlatformSession();
          router.replace("/platform/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load summary");
      }
    })();
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center gap-2 text-muted">
        <Spinner />
        <span className="text-sm">Loading console…</span>
      </div>
    );
  }

  const active = orgs.filter((o) => o.active).length;
  const inactive = orgs.length - active;
  const businesses = orgs.reduce(
    (n, o) => n + (o.stats?.businesses ?? 0),
    0
  );
  const staff = orgs.reduce((n, o) => n + (o.stats?.staff ?? 0), 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-h3 text-foreground">Platform console</h1>
        <p className="text-sm text-muted">
          Cross-tenant operations for NetHub. Manage organizations, review
          subscriptions, and run controlled cleanup.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-[var(--error)]/40 bg-[var(--error)]/10 px-3 py-2 text-sm text-foreground">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Organizations" value={String(orgs.length)} />
        <StatCard label="Active" value={String(active)} />
        <StatCard label="Inactive" value={String(inactive)} />
        <StatCard label="Businesses" value={String(businesses)} hint={`${staff} staff`} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="primary" onClick={() => router.push("/platform/orgs")}>
          <Link href="/platform/orgs">Manage organizations</Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
