"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Spinner } from "@/lib/components/ui";
import {
  clearPlatformSession,
  getPlatformAccessToken,
  listPlatformPlans,
  type PlatformPlan,
} from "@/lib/platform/auth";

/**
 * Read-only plan catalogue for platform operators (Phase B).
 */
export function PlatformPlansPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [activeOnly, setActiveOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listPlatformPlans({ active_only: activeOnly });
      setPlans(rows);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 401) {
        clearPlatformSession();
        router.replace("/platform/login");
        return;
      }
      if (status === 403) {
        setError("You do not have permission to read plans (platform:plans:read).");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, [router, activeOnly]);

  useEffect(() => {
    if (!getPlatformAccessToken()) {
      router.replace("/platform/login");
      return;
    }
    setReady(true);
    void load();
  }, [router, load]);

  if (!ready) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center gap-2 text-muted">
        <Spinner />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-h3 text-foreground">Plans</h1>
          <p className="text-sm text-muted">
            Subscription catalogue (read-only). Includes non-public plans used
            for operator and legacy assignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Active only
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => void load()}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </header>

      {error ? (
        <p
          className="rounded-md border border-[var(--error)]/40 bg-[var(--error)]/10 px-3 py-2 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading && plans.length === 0 ? (
        <div className="flex items-center gap-2 text-muted">
          <Spinner />
          <span className="text-sm">Loading plans…</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-lg border border-border/60 bg-card px-4 py-8 text-center text-sm text-muted">
          No plans found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-background/50 text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Monthly</th>
                  <th className="px-4 py-3 font-semibold">Trial</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Visibility</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.name}</div>
                      {p.description ? (
                        <div className="mt-0.5 line-clamp-2 text-xs text-muted">
                          {p.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {p.currency} {Number(p.price_monthly).toLocaleString("en-KE")}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{p.trial_days}d</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.is_active ? "success" : "neutral"}>
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={p.is_public ? "success" : "warning"}>
                        {p.is_public ? "Public" : "Internal"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
