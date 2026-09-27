"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/lib/components/ui";
import { formatKES } from "@/features/analytics/lib/format";

type SaleRow = {
  id: string;
  total_amount?: number;
  total?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

/**
 * Cashier-scoped overview: own sales only (SALES_READ_OWN).
 * Full branch analytics remain behind REPORTS_READ.
 */
export function MyShiftOverview({
  organizationId,
  businessId,
}: {
  organizationId: string;
  businessId: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["my-shift-sales", businessId, today],
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: "1",
        page_size: "50",
        single_date: today,
      });
      const res = await fetch(
        `/api/v1/business/sales/${businessId}?${sp.toString()}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string; message?: string })?.message ||
            (body as { error?: string })?.error ||
            `Could not load sales (${res.status})`
        );
      }
      return res.json();
    },
  });

  const items: SaleRow[] = useMemo(() => {
    const payload = data?.data ?? data;
    const list = payload?.items ?? payload ?? [];
    return Array.isArray(list) ? list : [];
  }, [data]);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, s) => sum + Number(s.total_amount ?? s.total ?? 0),
        0
      ),
    [items]
  );

  const historyHref = `/org/${organizationId}/${businessId}/sale-history`;
  const terminalHref = `/org/${organizationId}/${businessId}/terminal`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <header className="space-y-1">
        <h1 className="text-h3 text-foreground">My shift</h1>
        <p className="text-sm text-muted">
          Your sales for today. Branch-wide reports are available to managers and
          owners.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Today&apos;s total
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {isLoading ? "…" : formatKES(total)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Sales count
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {isLoading ? "…" : items.length}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={terminalHref}
          className="rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Open terminal
        </Link>
        <Link
          href={historyHref}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:bg-register hover:text-foreground"
        >
          Full history
        </Link>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:bg-register"
          disabled={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {isError ? (
        <p className="text-sm text-[var(--error)]" role="alert">
          {(error as Error)?.message || "Failed to load"}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Today&apos;s sales
          </h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted">
            <Spinner /> Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted">
            <p className="font-medium text-foreground">No sales yet today</p>
            <p className="mt-1">Complete a sale on the terminal to see it here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/org/${organizationId}/${businessId}/sale-history/${s.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-register"
                >
                  <span className="text-muted">
                    {(s.created_at || s.updated_at || "")
                      .toString()
                      .slice(11, 16) || "—"}
                    {s.status ? ` · ${s.status}` : ""}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-foreground">
                    {formatKES(Number(s.total_amount ?? s.total ?? 0))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
