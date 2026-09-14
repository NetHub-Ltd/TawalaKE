"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Package,
  ArrowRight,
  Plus,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

type Entitlements = {
  plan_code?: string;
  plan_name?: string;
  active?: boolean;
  trial?: boolean;
  limits?: Record<string, number | null | undefined>;
  usage?: Record<string, number | undefined>;
};

type Branch = {
  id: string;
  name: string;
  active?: boolean;
  tax_rate?: number | null;
  address?: string | null;
  phone?: string | null;
};

type BranchStats = {
  grossSales: number;
  orders: number;
  products: number;
  staff: number;
  openCredit: number;
  openCreditSales: number;
};

function Meter({
  label,
  current,
  max,
}: {
  label: string;
  current: number;
  max: number | null | undefined;
}) {
  const pct =
    max != null && max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const hot = max != null && current >= max;
  return (
    <div className="rounded-md border border-border bg-card p-4 dark:border-border dark:bg-card">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {max != null ? `${current} / ${max}` : current}
        </p>
        <span className="text-xs font-medium uppercase tracking-wide text-foreground">
          {label}
        </span>
      </div>
      {max != null && max > 0 && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-register">
          <div
            className={`h-full rounded-full ${hot ? "bg-brand-secondary" : "bg-brand-accent"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}


function Skel({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-register ${className}`}
      aria-hidden
    />
  );
}

function HomeLoadingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading organization home">
      <section className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-md border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <Skel className="h-8 w-20" />
              <Skel className="h-3 w-16" />
            </div>
            <Skel className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </section>
      <section className="grid gap-2 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-md border border-border bg-card p-4 space-y-2">
            <Skel className="h-3 w-28" />
            <Skel className="h-7 w-24" />
            <Skel className="h-3 w-16" />
          </div>
        ))}
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Skel className="h-4 w-20" />
          <Skel className="h-3 w-14" />
        </div>
        {[0, 1].map((i) => (
          <div
            key={i}
            className="w-full rounded-md border border-border bg-card p-4 space-y-4"
          >
            <div className="flex justify-between gap-3">
              <div className="space-y-2 flex-1">
                <Skel className="h-5 w-48 max-w-full" />
                <Skel className="h-3 w-32" />
              </div>
              <Skel className="h-8 w-16 shrink-0" />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-5">
              {[0, 1, 2, 3, 4].map((j) => (
                <div key={j} className="space-y-2">
                  <Skel className="h-3 w-14" />
                  <Skel className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
      <section className="grid gap-2 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-md border border-border bg-card p-4"
          >
            <Skel className="h-10 w-10 shrink-0 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skel className="h-4 w-24" />
              <Skel className="h-3 w-40 max-w-full" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function formatKes(n: number) {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `KES ${Math.round(n).toLocaleString()}`;
  }
}

async function loadBranchStats(
  branchId: string,
  staffRoster: { assigned_businesses?: { id: string }[] }[],
): Promise<BranchStats> {
  const stats: BranchStats = {
    grossSales: 0,
    orders: 0,
    products: 0,
    staff: 0,
    openCredit: 0,
    openCreditSales: 0,
  };

  stats.staff = staffRoster.filter((s) =>
    (s.assigned_businesses || []).some((b) => String(b.id) === String(branchId)),
  ).length;

  try {
    const dash = await fetch(
      `/api/v1/org/reports?businessId=${encodeURIComponent(branchId)}&resource=dashboard&period=7d`,
      { credentials: "include" },
    );
    if (dash.ok) {
      const body = await dash.json();
      const data = body?.data ?? body;
      const summary = data?.summary ?? data;
      stats.grossSales = Number(
        summary?.gross_sales_volume ??
          summary?.gross_sales ??
          summary?.net_revenue_collected ??
          summary?.net_revenue ??
          0,
      );
      stats.orders = Number(
        summary?.total_completed_orders_count ?? summary?.orders ?? 0,
      );
      stats.openCredit = Number(
        summary?.credit_outstanding ?? summary?.open_credit_total ?? 0,
      );
      stats.openCreditSales = Number(
        summary?.open_credit_sales ?? summary?.open_credit_sales_count ?? 0,
      );
    }
  } catch {
    /* ignore per-branch dashboard failures */
  }

  try {
    const prod = await fetch(
      `/api/v1/products?business_id=${encodeURIComponent(branchId)}&page=1&size=1`,
      { credentials: "include" },
    );
    if (prod.ok) {
      const body = await prod.json();
      const total =
        body?.pagination?.total ??
        body?.meta?.total ??
        body?.total ??
        body?.count ??
        body?.data?.total ??
        body?.data?.pagination?.total ??
        (Array.isArray(body?.data?.items) ? body.data.items.length : null) ??
        (Array.isArray(body?.items) ? body.items.length : null) ??
        (Array.isArray(body?.data) ? body.data.length : null) ??
        (Array.isArray(body) ? body.length : 0);
      stats.products = Number(total || 0);
    }
  } catch {
    /* ignore */
  }

  return stats;
}

export function OrgHomeClient({
  organizationId,
  canManageBranches,
  canBilling,
}: {
  organizationId: string;
  canManageBranches: boolean;
  canBilling: boolean;
}) {
  const [ent, setEnt] = useState<Entitlements | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [statsById, setStatsById] = useState<Record<string, BranchStats>>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, eRes, staffRes] = await Promise.all([
        fetch("/api/v1/org/stores", { credentials: "include" }),
        fetch("/api/v1/org/entitlements", { credentials: "include" }).catch(
          () => null,
        ),
        fetch("/api/v1/org/staff", { credentials: "include" }).catch(() => null),
      ]);

      let list: Branch[] = [];
      if (bRes.ok) {
        const body = await bRes.json();
        list = Array.isArray(body) ? body : body?.data ?? [];
        setBranches(list);
      } else {
        setBranches([]);
      }

      if (eRes && eRes.ok) {
        const body = await eRes.json();
        setEnt(body?.data ?? body);
      } else {
        const sub = await fetch("/api/v1/org/subscription", {
          credentials: "include",
        }).catch(() => null);
        if (sub && sub.ok) {
          const body = await sub.json();
          setEnt(body?.data ?? body);
        }
      }

      let roster: { assigned_businesses?: { id: string }[] }[] = [];
      if (staffRes && staffRes.ok) {
        const body = await staffRes.json();
        roster = Array.isArray(body) ? body : body?.data ?? [];
      }

      setStatsLoading(true);
      const entries = await Promise.all(
        list.map(async (b) => {
          const s = await loadBranchStats(b.id, roster);
          return [b.id, s] as const;
        }),
      );
      setStatsById(Object.fromEntries(entries));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load org home");
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [organizationId, load]);

  const usage = ent?.usage || {};
  const limits = ent?.limits || {};
  const bizCur = Number(
    usage.max_businesses ?? usage.businesses ?? branches.length ?? 0,
  );
  const staffCur = Number(usage.max_staff ?? usage.staff ?? 0);
  const prodCur = Number(usage.max_products ?? usage.products ?? 0);
  const bizMax = limits.max_businesses as number | null | undefined;
  const staffMax = limits.max_staff as number | null | undefined;
  const prodMax = limits.max_products as number | null | undefined;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-2 sm:p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Organization home
          </h1>
          <p className="mt-1 text-sm text-foreground">
            {ent?.plan_name || ent?.plan_code || "Plan"}
            {ent?.trial ? " · Trial" : ""}
            {ent?.active === false ? " · Inactive" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted hover:bg-register dark:border-border dark:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {canManageBranches && (
            <Link
              href={`/org/${organizationId}/stores/new`}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand-accent px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--success)]"
            >
              <Plus className="h-4 w-4" />
              New branch
            </Link>
          )}
        </div>
      </header>

      {loading ? (
        <HomeLoadingSkeleton />
      ) : (
      <>
      {branches.length === 0 && canManageBranches && (
        <div className="rounded-md border border-border bg-card p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Recommended next step</p>
          <p className="mt-1 text-sm text-muted">
            Add your first branch so you can open the sales terminal and start tracking stock.
          </p>
          <Link
            href={`/org/${organizationId}/stores/new`}
            className="mt-4 inline-flex h-12 items-center justify-center rounded-md bg-brand-primary px-6 text-sm font-semibold text-white hover:opacity-90"
          >
            Add your first branch
          </Link>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-[var(--error)]/30 bg-[var(--error-container)] px-3 py-2 text-sm text-[var(--on-error-container)]">
          {error}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <Meter label="Branches" current={bizCur} max={bizMax} />
        <Meter label="Staff seats" current={staffCur} max={staffMax} />
        <Meter label="Products" current={prodCur} max={prodMax} />
      </section>

      {canBilling && (
        <p className="text-sm text-foreground">
          Manage plan on{" "}
          <Link
            href={`/org/${organizationId}/billing`}
            className="font-semibold text-[var(--success)] hover:underline"
          >
            Billing
          </Link>
          .
        </p>
      )}

      {/* Quick glance across branches */}
      {!loading && branches.length > 0 && (
        <section className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Sales (7d · all branches)
            </p>
            <p className="mt-1 text-xl font-semibold tabular text-foreground">
              {formatKes(
                Object.values(statsById).reduce(
                  (a, s) => a + (s?.grossSales || 0),
                  0,
                ),
              )}
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Open credit
            </p>
            <p className="mt-1 text-xl font-semibold tabular text-brand-secondary">
              {formatKes(
                Object.values(statsById).reduce(
                  (a, s) => a + (s?.openCredit || 0),
                  0,
                ),
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {Object.values(statsById).reduce(
                (a, s) => a + (s?.openCreditSales || 0),
                0,
              )}{" "}
              open sale
              {Object.values(statsById).reduce(
                (a, s) => a + (s?.openCreditSales || 0),
                0,
              ) === 1
                ? ""
                : "s"}
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Orders (7d)
            </p>
            <p className="mt-1 text-xl font-semibold tabular text-foreground">
              {Object.values(statsById).reduce((a, s) => a + (s?.orders || 0), 0)}
            </p>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Branches</h2>
          <Link
            href={`/org/${organizationId}/stores`}
            className="text-xs font-semibold text-brand-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {loading && branches.length === 0 ? (
          <p className="text-sm text-muted">Loading branches…</p>
        ) : branches.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-8 text-center">
            <Building2 className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-2 text-sm font-medium text-muted">No branches yet</p>
            {canManageBranches && (
              <Link
                href={`/org/${organizationId}/stores/new`}
                className="mt-4 inline-flex h-12 items-center justify-center rounded-md bg-brand-primary px-6 text-sm font-semibold text-white hover:opacity-90"
              >
                Create your first branch
              </Link>
            )}
          </div>
        ) : (
          <ul className="flex w-full flex-col gap-3">
            {branches.map((b) => {
              const st = statsById[b.id];
              const href = `/org/${organizationId}/${b.id}/overview`;
              return (
                <li key={b.id} className="w-full">
                  <Link
                    href={href}
                    className="block w-full rounded-md border border-border bg-card p-4 transition-colors hover:border-brand-primary/25 hover:bg-register/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-foreground">
                          {b.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          <span
                            className={
                              b.active === false
                                ? "text-muted"
                                : "text-[var(--success)]"
                            }
                          >
                            {b.active === false ? "Inactive" : "Active"}
                          </span>
                          {" · "}
                          Tax {b.tax_rate != null ? `${b.tax_rate}%` : "—"}
                          {b.address ? ` · ${b.address}` : ""}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand-primary/10 px-3 py-1.5 text-xs font-semibold text-brand-primary">
                        Open
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-5">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                          Sales (7d)
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-sm font-semibold tabular text-foreground">
                          <TrendingUp className="h-3.5 w-3.5 text-[var(--success)]" />
                          {statsLoading && !st
                            ? "…"
                            : formatKes(st?.grossSales ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                          Orders
                        </p>
                        <p className="mt-0.5 text-sm font-semibold tabular text-foreground">
                          {statsLoading && !st ? "…" : (st?.orders ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                          Products
                        </p>
                        <p className="mt-0.5 text-sm font-semibold tabular text-foreground">
                          {statsLoading && !st ? "…" : (st?.products ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                          Staff
                        </p>
                        <p className="mt-0.5 text-sm font-semibold tabular text-foreground">
                          {statsLoading && !st ? "…" : (st?.staff ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted">
                          Open credit
                        </p>
                        <p className="mt-0.5 text-sm font-semibold tabular text-brand-secondary">
                          {statsLoading && !st
                            ? "…"
                            : formatKes(st?.openCredit ?? 0)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="grid gap-2 sm:grid-cols-2">
        <Link
          href={`/org/${organizationId}/staff`}
          className="flex items-center gap-3 rounded-md border border-border bg-card p-4 hover:bg-register dark:border-border dark:bg-card dark:hover:bg-register/80"
        >
          <Users className="h-5 w-5 text-foreground" />
          <div>
            <p className="text-sm font-semibold">Team</p>
            <p className="text-xs text-foreground">Invite and assign branches</p>
          </div>
        </Link>
        <Link
          href={`/org/${organizationId}/stores`}
          className="flex items-center gap-3 rounded-md border border-border bg-card p-4 hover:bg-register dark:border-border dark:bg-card dark:hover:bg-register/80"
        >
          <Package className="h-5 w-5 text-foreground" />
          <div>
            <p className="text-sm font-semibold">Branch directory</p>
            <p className="text-xs text-foreground">All locations and create</p>
          </div>
        </Link>
      </section>
      </>
      )}
    </div>
  );
}