"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Spinner } from "@/lib/components/ui";
import {
  clearPlatformSession,
  getPlatformAccessToken,
  listPlatformOrganizations,
  type PlatformOrg,
} from "@/lib/platform/auth";

const GRACE_ATTENTION_DAYS = 7;

type AttentionItem = {
  org: PlatformOrg;
  kind: "inactive" | "grace";
  detail: string;
};

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const ms = t - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function buildAttention(orgs: PlatformOrg[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const org of orgs) {
    if (!org.active) {
      items.push({
        org,
        kind: "inactive",
        detail: "Organization is inactive",
      });
      continue;
    }
    const subs = org.subscriptions ?? [];
    for (const sub of subs) {
      const phase = (sub.access_phase || "").toLowerCase();
      const days = daysUntil(sub.grace_end_date);
      if (
        (phase === "grace" || (days !== null && days >= 0 && days <= GRACE_ATTENTION_DAYS)) &&
        days !== null &&
        days <= GRACE_ATTENTION_DAYS
      ) {
        items.push({
          org,
          kind: "grace",
          detail:
            days < 0
              ? "Grace period ended"
              : days === 0
                ? "Grace ends today"
                : `Grace ends in ${days} day${days === 1 ? "" : "s"}`,
        });
        break;
      }
    }
  }
  // Prefer grace urgency, then inactive; stable by name
  items.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "grace" ? -1 : 1;
    return a.org.name.localeCompare(b.org.name);
  });
  return items;
}

/**
 * Operator home for `/platform` — KPIs, attention list, quick actions.
 * Uses existing cross-tenant org list; no tenant chrome.
 */
export function PlatformDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      setError(null);
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
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const stats = useMemo(() => {
    const active = orgs.filter((o) => o.active).length;
    const inactive = orgs.length - active;
    const businesses = orgs.reduce(
      (n, o) => n + (o.stats?.businesses ?? 0),
      0
    );
    const staff = orgs.reduce((n, o) => n + (o.stats?.staff ?? 0), 0);
    return { active, inactive, businesses, staff, total: orgs.length };
  }, [orgs]);

  const attention = useMemo(() => buildAttention(orgs), [orgs]);

  if (!ready) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center gap-2 text-muted">
        <Spinner />
        <span className="text-sm">Loading console…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-h3 text-foreground">Platform console</h1>
        <p className="text-sm text-muted">
          Cross-tenant operations for NetHub. Review health, act on orgs that
          need attention, and manage the operator surface.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--error)]/40 bg-[var(--error)]/10 px-3 py-2 text-sm text-foreground"
        >
          <p className="font-medium">Could not load dashboard</p>
          <p className="mt-1 text-muted">{error}</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-3"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-muted">
          <Spinner />
          <span className="text-sm">Loading organization summary…</span>
        </div>
      ) : (
        <>
          <section aria-label="Key metrics">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Organizations" value={String(stats.total)} />
              <StatCard label="Active" value={String(stats.active)} />
              <StatCard label="Inactive" value={String(stats.inactive)} />
              <StatCard label="Businesses" value={String(stats.businesses)} />
              <StatCard label="Staff" value={String(stats.staff)} />
            </div>
          </section>

          <section className="space-y-3" aria-label="Needs attention">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">
                Needs attention
              </h2>
              <span className="text-xs text-muted">
                {attention.length === 0
                  ? "All clear"
                  : `${attention.length} item${attention.length === 1 ? "" : "s"}`}
              </span>
            </div>

            {attention.length === 0 ? (
              <div className="rounded-lg border border-border/60 bg-card px-4 py-6 text-sm text-muted">
                No inactive organizations and no grace windows ending within{" "}
                {GRACE_ATTENTION_DAYS} days.
              </div>
            ) : (
              <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
                {attention.map((item) => (
                  <li
                    key={`${item.kind}-${item.org.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-foreground">
                          {item.org.name}
                        </span>
                        <Badge
                          variant={
                            item.kind === "grace" ? "warning" : "neutral"
                          }
                        >
                          {item.kind === "grace" ? "Grace" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted">{item.detail}</p>
                      <p className="truncate text-xs text-muted">
                        {item.org.email}
                      </p>
                    </div>
                    <Link
                      href="/platform/orgs"
                      className="shrink-0 text-sm font-medium text-brand-primary hover:underline"
                    >
                      Open orgs
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            className="flex flex-wrap gap-3"
            aria-label="Quick actions"
          >
            <Button
              type="button"
              variant="primary"
              onClick={() => router.push("/platform/orgs")}
            >
              Manage organizations
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/platform/users")}
            >
              Operators
            </Button>
          </section>
        </>
      )}
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
