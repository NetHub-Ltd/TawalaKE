"use client";

import React, { useMemo } from "react";
import { KpiCard, KpiRow } from "./KpiCard";
import { InsightsStrip } from "./InsightsStrip";
import { BarChart } from "./charts/SimpleCharts";
import { formatKES } from "@/features/analytics/lib/format";
import type {
  DashboardPayload,
  StaffPayload,
  InsightsPayload,
} from "@/features/analytics/hooks/useDashboardData";

export function StaffPanel({
  dashboard,
  staff,
  insights,
  loading,
}: {
  dashboard?: DashboardPayload;
  staff?: StaffPayload;
  insights?: InsightsPayload;
  loading?: boolean;
}) {
  const items = staff?.items ?? [];

  const { active, top, avgTicket, barPoints } = useMemo(() => {
    const activeRows = items.filter(
      (i) => (i.orders || 0) > 0 || (i.revenue || 0) > 0
    );
    const ticket =
      activeRows.length > 0
        ? activeRows.reduce((a, i) => a + (i.avg_ticket || 0), 0) /
          activeRows.length
        : 0;
    const bars = activeRows.slice(0, 12).map((i) => ({
      label: i.full_name || i.staff_id,
      value: Number(i.revenue || 0),
    }));
    return {
      active: activeRows,
      top: activeRows[0],
      avgTicket: ticket,
      barPoints: bars,
    };
  }, [items]);

  if (loading && !staff) {
    return <div className="h-64 animate-pulse rounded-xl bg-border/40" />;
  }

  return (
    <div className="space-y-5">
      <KpiRow>
        <KpiCard label="Active cashiers" value={String(active.length)} />
        <KpiCard
          label="Top seller"
          value={top ? formatKES(top.revenue) : "—"}
          hint={top?.full_name}
        />
        <KpiCard label="Avg ticket" value={formatKES(avgTicket)} />
        <KpiCard
          label="Gross profit"
          value={formatKES(dashboard?.summary?.gross_profit)}
        />
        <KpiCard
          label="Store orders"
          value={String(dashboard?.summary?.total_completed_orders_count ?? 0)}
        />
        <KpiCard
          label="Net revenue"
          value={formatKES(dashboard?.summary?.net_revenue_collected)}
        />
      </KpiRow>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm lg:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Staff leaderboard
          </p>
          <div className="mt-2">
            {active.length === 0 && (
              <p className="py-8 text-center text-sm text-muted">No staff sales in this period</p>
            )}
            {active.map((row) => (
              <div
                key={row.staff_id}
                className="flex items-center justify-between gap-3 border-b border-border/40 py-2.5 text-sm last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{row.full_name || "Staff"}</p>
                  <p className="text-xs text-muted">
                    {(row.orders || 0).toLocaleString()} orders · AOV {formatKES(row.avg_ticket)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium tabular-nums text-brand-primary">{formatKES(row.revenue)}</p>
                  <p className="text-xs text-muted">{(row.revenue_share_pct ?? 0).toFixed(0)}% share</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Revenue by cashier
          </p>
          <div className="mt-4">
            <BarChart points={barPoints} height={200} />
          </div>
        </div>
      </div>

      <InsightsStrip insights={insights?.insights || []} />
    </div>
  );
}
