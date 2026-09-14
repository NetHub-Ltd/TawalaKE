"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Entitlements = {
  plan_code: string;
  plan_name: string;
  active: boolean;
  trial: boolean;
  start_date: string | null;
  end_date: string | null;
  limits: Record<string, number | null>;
  features: Record<string, unknown>;
  usage: Record<string, number>;
};

/**
 * Org billing surface: current plan, usage vs limits, upgrade path.
 * Data from GET /api/v1/org/entitlements (BFF or direct).
 */
export default function BillingPage() {
  const params = useParams();
  const organizationId = params?.organizationId as string | undefined;
  const [data, setData] = useState<Entitlements | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/org/subscription", {
          credentials: "include",
        });
        // Prefer dedicated entitlements when available via org API proxy
        const entRes = await fetch("/api/v1/org/entitlements", {
          credentials: "include",
        }).catch(() => null);

        if (entRes && entRes.ok) {
          const body = await entRes.json();
          if (!cancelled) setData(body?.data ?? body);
        } else if (res.ok) {
          const body = await res.json();
          if (!cancelled) {
            setData({
              plan_code: body?.data?.plan_code ?? "—",
              plan_name: body?.data?.plan_name ?? "Current plan",
              active: Boolean(body?.data),
              trial: false,
              start_date: body?.data?.start_date ?? null,
              end_date: body?.data?.end_date ?? null,
              limits: {},
              features: {},
              usage: {},
            });
          }
        } else {
          if (!cancelled) setError("Could not load billing details.");
        }
      } catch {
        if (!cancelled) setError("Could not load billing details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const usageRows = data
    ? Object.entries(data.usage || {}).map(([key, current]) => {
        const max = data.limits?.[key];
        return { key, current, max: max ?? null };
      })
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Billing & plan</h1>
        <p className="mt-1 text-sm text-muted">
          Usage is enforced on the server. Upgrade when you hit a limit.
        </p>
      </header>

      {loading && <p className="text-sm text-muted">Loading plan…</p>}
      {error && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      )}

      {data && !loading && (
        <>
          <section className="rounded-md border border-border bg-card p-5 shadow-none">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Current plan
                </p>
                <p className="text-xl font-semibold">{data.plan_name}</p>
                <p className="text-sm text-muted">{data.plan_code}</p>
              </div>
              <div className="text-right text-sm">
                <span
                  className={
                    data.active
                      ? "rounded-full bg-[var(--success-soft)] px-2.5 py-0.5 text-[var(--success)]"
                      : "rounded-full bg-neutral-100 px-2.5 py-0.5 text-muted"
                  }
                >
                  {data.active ? (data.trial ? "Trial" : "Active") : "Inactive"}
                </span>
                {data.end_date && (
                  <p className="mt-1 text-muted">
                    Ends {new Date(data.end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </section>

          {usageRows.length > 0 && (
            <section className="rounded-md border border-border bg-card p-5 shadow-none">
              <h2 className="text-sm font-semibold text-foreground">Usage vs limits</h2>
              <ul className="mt-3 divide-y divide-border">
                {usageRows.map((row) => {
                  const atCap =
                    row.max != null && row.current >= row.max;
                  return (
                    <li
                      key={row.key}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <span className="font-medium text-neutral-700">
                        {row.key.replace(/^max_/, "").replace(/_/g, " ")}
                      </span>
                      <span
                        className={
                          atCap
                            ? "font-semibold text-amber-700"
                            : "text-muted"
                        }
                      >
                        {row.current}
                        {row.max != null ? ` / ${row.max}` : ""}
                        {atCap ? " — limit reached" : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-700">
            <p>
              Need more capacity or features? Upgrade from Basic → Ndovu → Enterprise.
              Plan changes take effect immediately for limits and feature flags.
            </p>
            <a
              href="/onboarding/plans"
              className="mt-3 inline-flex rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              View plans
            </a>
          </section>
        </>
      )}
    </div>
  );
}
