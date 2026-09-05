"use client";

import React, { useMemo } from "react";
import { KpiCard, KpiRow } from "./KpiCard";
import { InsightsStrip } from "./InsightsStrip";
import { LineChart, BarChart } from "./charts/SimpleCharts";
import { formatKES, formatPct, pctChange } from "@/features/analytics/lib/format";
import type {
  DashboardPayload,
  HourlyPayload,
  InsightsPayload,
} from "@/features/analytics/hooks/useDashboardData";

export function SalesPanel({
  dashboard,
  hourly,
  insights,
  loading,
}: {
  dashboard?: DashboardPayload;
  hourly?: HourlyPayload;
  insights?: InsightsPayload;
  loading?: boolean;
}) {
  const s = dashboard?.summary;
  const p = dashboard?.previous_summary;

  const kpis = useMemo(() => {
    const rev = s?.net_revenue_collected ?? 0;
    const prevRev = p?.net_revenue_collected ?? 0;
    const cash = s?.cash_volume ?? 0;
    const prevCash = p?.cash_volume ?? 0;
    const gp = s?.gross_profit ?? 0;
    const prevGp = p?.gross_profit ?? 0;
    const orders = s?.total_completed_orders_count ?? 0;
    const prevOrders = p?.total_completed_orders_count ?? 0;
    const aov = s?.average_order_value ?? (orders ? rev / orders : 0);
    const credit = s?.credit_outstanding ?? 0;
    const expenses = s?.expenses_total;
    const hasExpenses = expenses !== undefined && expenses !== null;

    const d = (cur: number, prev: number) => {
      const c = pctChange(cur, prev);
      return {
        delta: formatPct(c),
        tone: (c >= 0 ? "good" : "bad") as "good" | "bad",
      };
    };

    return [
      {
        label: "Net revenue",
        value: formatKES(rev),
        ...d(rev, prevRev),
      },
      {
        label: "Cash collected",
        value: formatKES(cash),
        ...d(cash, prevCash),
      },
      {
        label: "Credit open",
        value: formatKES(credit),
        delta: credit > 0 ? "collect focus" : "clear",
        tone: (credit > 0 ? "warn" : "muted") as "warn" | "muted",
      },
      {
        label: "Gross profit",
        value: formatKES(gp),
        ...d(gp, prevGp),
        hint:
          rev > 0 ? `margin ${((gp / rev) * 100).toFixed(1)}%` : undefined,
      },
      {
        label: "Orders / AOV",
        value: `${orders.toLocaleString()} · ${formatKES(aov)}`,
        ...d(orders, prevOrders),
      },
      {
        label: "Expenses",
        value: hasExpenses ? formatKES(expenses as number) : "—",
        delta: hasExpenses
          ? `after exp. ${formatKES(s?.profit_after_expenses ?? gp - (expenses as number))}`
          : "Tracker when on plan",
        tone: "muted" as const,
      },
    ];
  }, [s, p]);

  const seriesPoints = useMemo(
    () =>
      (dashboard?.series || []).map((pt) => ({
        label: pt.date,
        value: Number(pt.net_revenue_collected ?? pt.gross_sales_volume ?? 0),
      })),
    [dashboard?.series]
  );

  const hourlyPoints = useMemo(
    () =>
      (hourly?.series || []).map((pt, i) => ({
        label: pt.hour || String(i),
        value: Number(pt.net_revenue ?? 0),
      })),
    [hourly?.series]
  );

  const mpesa = s?.mpesa_volume ?? 0;
  const cash = s?.cash_volume ?? 0;
  const mixTotal = cash + mpesa || 1;

  if (loading && !dashboard) {
    return <PanelSkeleton />;
  }

  return (
    <div className="space-y-5">
      <KpiRow>
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </KpiRow>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Daily net revenue
          </p>
          <div className="mt-3">
            <LineChart points={seriesPoints} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Hourly bars
          </p>
          <div className="mt-3">
            <BarChart points={hourlyPoints} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payment mix
          </p>
          <div className="mt-4 space-y-3">
            <MixRow label="Cash" value={cash} pct={(cash / mixTotal) * 100} />
            <MixRow label="M-Pesa" value={mpesa} pct={(mpesa / mixTotal) * 100} />
            <MixRow
              label="Credit open"
              value={s?.credit_outstanding ?? 0}
              pct={0}
              note="Not in collected mix"
            />
          </div>
        </div>
        <InsightsStrip insights={insights?.insights || []} />
      </div>
    </div>
  );
}

function MixRow({
  label,
  value,
  pct,
  note,
}: {
  label: string;
  value: number;
  pct: number;
  note?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium tabular-nums text-slate-900">{formatKES(value)}</span>
      </div>
      {note ? (
        <p className="mt-1 text-xs text-slate-400">{note}</p>
      ) : (
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      )}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-48 rounded-xl bg-slate-100" />
        <div className="h-48 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}
