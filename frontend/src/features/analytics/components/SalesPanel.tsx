"use client";

import React, { useMemo } from "react";
import { KpiCard, KpiRow } from "./KpiCard";
import { BarChart, DualTrendChart } from "./charts/SimpleCharts";
import { formatKES, formatPct, pctChange } from "@/features/analytics/lib/format";
import type {
  DashboardPayload,
  HourlyPayload,
} from "@/features/analytics/hooks/useDashboardData";

/**
 * Sales tab — 15-second pulse:
 * How much came in? Cash vs credit? Busy? Ticket? Profit? When?
 */
export function SalesPanel({
  dashboard,
  hourly,
  loading,
}: {
  dashboard?: DashboardPayload;
  hourly?: HourlyPayload;
  loading?: boolean;
}) {
  const s = dashboard?.summary;
  const p = dashboard?.previous_summary;

  const rev = s?.net_revenue_collected ?? 0;
  const prevRev = p?.net_revenue_collected ?? 0;
  const orders = s?.total_completed_orders_count ?? 0;
  const prevOrders = p?.total_completed_orders_count ?? 0;
  const aov = s?.average_order_value ?? (orders ? rev / orders : 0);
  const prevAov =
    p?.average_order_value ??
    (prevOrders ? (p?.net_revenue_collected ?? 0) / prevOrders : 0);
  const gp = s?.gross_profit ?? 0;
  const prevGp = p?.gross_profit ?? 0;
  const costsMissing = rev > 0 && gp === 0;

  const cash = s?.cash_volume ?? 0;
  const mpesa = s?.mpesa_volume ?? 0;
  const credit = s?.credit_outstanding ?? 0;

  const delta = (cur: number, prev: number) => {
    const c = pctChange(cur, prev);
    return {
      delta: formatPct(c),
      tone: (c >= 0 ? "good" : "bad") as "good" | "bad",
    };
  };

  const dualPoints = useMemo(() => {
    return (dashboard?.series || []).map((pt) => {
      const raw = pt.date || "";
      let label = raw;
      // Prefer short weekday / day label
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        label = d.toLocaleDateString("en-KE", {
          weekday: "short",
          day: "numeric",
        });
      } else if (raw.length >= 10) {
        label = raw.slice(5); // MM-DD
      }
      return {
        label,
        revenue: Number(pt.net_revenue_collected ?? pt.gross_sales_volume ?? 0),
        orders: Number(pt.total_completed_orders_count ?? 0),
      };
    });
  }, [dashboard?.series]);

  const hourlyPoints = useMemo(
    () =>
      (hourly?.series || []).map((pt, i) => {
        const raw = pt.hour || String(i);
        let label = raw;
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) {
          label = d.toLocaleTimeString("en-KE", {
            hour: "2-digit",
            hour12: false,
          });
        }
        return { label, value: Number(pt.net_revenue ?? 0) };
      }),
    [hourly?.series]
  );

  if (loading && !dashboard) {
    return <PanelSkeleton />;
  }

  return (
    <div className="space-y-4">
      <KpiRow className="lg:grid-cols-4">
        <KpiCard
          label="Net revenue"
          value={formatKES(rev)}
          {...delta(rev, prevRev)}
          emphasis
        />
        <KpiCard
          label="Orders"
          value={orders.toLocaleString()}
          {...delta(orders, prevOrders)}
        />
        <KpiCard
          label="Avg ticket"
          value={formatKES(aov)}
          {...delta(aov, prevAov)}
        />
        <KpiCard
          label="Gross profit"
          value={costsMissing ? "—" : formatKES(gp)}
          {...(costsMissing
            ? {
                hint: "Add product costs to track margin",
                tone: "muted" as const,
              }
            : {
                ...delta(gp, prevGp),
                hint:
                  rev > 0
                    ? `margin ${((gp / rev) * 100).toFixed(0)}%`
                    : undefined,
              })}
        />
      </KpiRow>

      {/* Always show cash paid; credits when open */}
      <div className="rounded-xl border border-border/50 bg-card px-4 py-3 shadow-card">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Settled &amp; open
        </p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
          <MixStat label="Cash paid" value={cash} />
          <MixStat label="M-Pesa" value={mpesa} />
          <MixStat
            label="Credit open"
            value={credit}
            warn={credit > 0}
            note={credit <= 0 ? "None open" : undefined}
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Sales &amp; revenue
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            Bars = sales count · Line = revenue
          </p>
          <div className="mt-3 min-h-[200px]">
            <DualTrendChart points={dualPoints} height={200} />
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-4 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Hourly revenue
          </p>
          <div className="mt-3 min-h-[200px]">
            <BarChart points={hourlyPoints} height={200} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MixStat({
  label,
  value,
  warn,
  note,
}: {
  label: string;
  value: number;
  warn?: boolean;
  note?: string;
}) {
  return (
    <div className="flex min-w-[7rem] flex-col gap-0.5">
      <span className={warn ? "text-xs text-amber-600" : "text-xs text-muted"}>
        {label}
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
        {formatKES(value)}
      </span>
      {note && <span className="text-[11px] text-muted">{note}</span>}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-h-[88px] rounded-xl bg-border/40" />
        ))}
      </div>
      <div className="h-16 rounded-xl bg-border/40" />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="min-h-[240px] rounded-xl bg-border/40" />
        <div className="min-h-[240px] rounded-xl bg-border/40" />
      </div>
    </div>
  );
}
