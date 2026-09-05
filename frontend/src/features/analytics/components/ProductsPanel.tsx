"use client";

import React, { useMemo } from "react";
import { KpiCard, KpiRow } from "./KpiCard";
import { InsightsStrip } from "./InsightsStrip";
import { formatKES } from "@/features/analytics/lib/format";
import type {
  DashboardPayload,
  ProductsPayload,
  InsightsPayload,
} from "@/features/analytics/hooks/useDashboardData";

export function ProductsPanel({
  dashboard,
  products,
  insights,
  loading,
}: {
  dashboard?: DashboardPayload;
  products?: ProductsPayload;
  insights?: InsightsPayload;
  loading?: boolean;
}) {
  const items = products?.items || [];
  const missingCost = dashboard?.summary?.missing_cost_line_count ?? 0;
  const totalRev = items.reduce((a, i) => a + (i.revenue || 0), 0);
  const topShare = totalRev > 0 && items[0] ? ((items[0].revenue || 0) / totalRev) * 100 : 0;
  const lowMargin = items.filter((i) => (i.margin_pct ?? 100) < 15).length;

  const best = useMemo(
    () => [...items].sort((a, b) => (b.gross_profit || 0) - (a.gross_profit || 0)).slice(0, 8),
    [items]
  );
  const attention = useMemo(() => {
    const low = items
      .filter((i) => (i.margin_pct ?? 100) < 15 && (i.revenue || 0) > 0)
      .slice(0, 6);
    return low;
  }, [items]);

  if (loading && !products) {
    return <div className="h-64 animate-pulse rounded-xl bg-border/40" />;
  }

  return (
    <div className="space-y-5">
      <KpiRow>
        <KpiCard label="SKUs with sales" value={String(items.length)} hint="in period" />
        <KpiCard
          label="Top SKU share"
          value={`${topShare.toFixed(0)}%`}
          hint={topShare > 35 ? "concentration high" : "concentration ok"}
          tone={topShare > 35 ? "warn" : "default"}
        />
        <KpiCard
          label="Low-margin lines"
          value={String(lowMargin)}
          hint="margin under 15%"
          tone={lowMargin ? "warn" : "good"}
        />
        <KpiCard
          label="Missing cost"
          value={String(missingCost)}
          hint="lines without cost"
          tone={missingCost ? "warn" : "muted"}
        />
        <KpiCard
          label="Gross profit"
          value={formatKES(dashboard?.summary?.gross_profit)}
        />
        <KpiCard label="Product revenue" value={formatKES(totalRev)} />
      </KpiRow>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListCard title="Best by gross profit">
          {best.length === 0 && <EmptyRow />}
          {best.map((row) => (
            <div
              key={row.product_id}
              className="flex items-center justify-between gap-3 border-b border-border/40 py-2.5 text-sm last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.name || row.sku || "Product"}</p>
                <p className="text-xs text-muted">{row.sku}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-medium tabular-nums text-brand-primary">{formatKES(row.gross_profit)}</p>
                <p className="text-xs text-muted">{(row.margin_pct ?? 0).toFixed(0)}%</p>
              </div>
            </div>
          ))}
        </ListCard>
        <ListCard title="Needs attention">
          {attention.length === 0 && missingCost === 0 && <EmptyRow text="No margin issues in top sellers" />}
          {attention.map((row) => (
            <div
              key={row.product_id}
              className="border-b border-border/40 py-2.5 text-sm last:border-0"
            >
              <p className="font-medium text-foreground">{row.name || row.sku}</p>
              <p className="text-xs text-amber-600">
                Margin {(row.margin_pct ?? 0).toFixed(0)}% · {formatKES(row.revenue)} revenue
              </p>
            </div>
          ))}
          {missingCost > 0 && (
            <div className="py-2.5 text-sm">
              <p className="font-medium text-foreground">Unknown cost SKUs</p>
              <p className="text-xs text-amber-600">{missingCost} lines missing cost in rollups</p>
            </div>
          )}
        </ListCard>
      </div>

      <InsightsStrip insights={insights?.insights || []} />
    </div>
  );
}

function ListCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function EmptyRow({ text = "No product sales in this period" }: { text?: string }) {
  return <p className="py-6 text-center text-sm text-muted">{text}</p>;
}
