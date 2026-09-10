"use client";

import React, { useMemo, useState } from "react";
import { clsx } from "clsx";
import { KpiCard, KpiRow } from "./KpiCard";
import { MetricLineChart } from "./charts/SimpleCharts";
import { formatKES, formatPct, pctChange } from "@/features/analytics/lib/format";
import type {
  DashboardPayload,
  HourlyPayload,
} from "@/features/analytics/hooks/useDashboardData";
import type { AnalyticsRange } from "@/features/analytics/lib/fetchReport";

type ChartMetric = "orders" | "revenue" | "profit" | "discounts";

const METRIC_TABS: { id: ChartMetric; label: string }[] = [
  { id: "orders", label: "Orders" },
  { id: "revenue", label: "Revenue" },
  { id: "profit", label: "Profit" },
  { id: "discounts", label: "Discounts" },
];

/** Single-day periods use hourly grain for the trend chart. */
function useHourlyGrain(period: AnalyticsRange) {
  return period === "today" || period === "yesterday" || period === "custom";
}

export function SalesPanel({
  dashboard,
  hourly,
  period,
  loading,
}: {
  dashboard?: DashboardPayload;
  hourly?: HourlyPayload;
  period: AnalyticsRange;
  loading?: boolean;
}) {
  const [metric, setMetric] = useState<ChartMetric>("revenue");
  const hourlyGrain = useHourlyGrain(period);

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
  const missingCosts = s?.missing_cost_line_count ?? 0;

  const cash = s?.cash_volume ?? 0;
  const mpesa = s?.mpesa_volume ?? 0;
  const card = s?.card_volume ?? 0;
  const other = s?.other_volume ?? 0;
  const credit = s?.credit_outstanding ?? 0;
  const profitProvisional =
    Boolean(s?.profit_is_provisional) || missingCosts > 0;

  const delta = (cur: number, prev: number) => {
    const c = pctChange(cur, prev);
    return {
      delta: formatPct(c),
      tone: (c >= 0 ? "good" : "bad") as "good" | "bad",
    };
  };

  const chartPoints = useMemo(() => {
    if (hourlyGrain) {
      return (hourly?.series || []).map((pt, i) => {
        const raw = pt.hour || String(i);
        let label = raw;
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) {
          label = d.toLocaleTimeString("en-KE", {
            hour: "2-digit",
            hour12: false,
          });
        }
        const value =
          metric === "orders"
            ? Number(pt.orders ?? 0)
            : metric === "revenue"
              ? Number(pt.net_revenue ?? 0)
              : metric === "profit"
                ? Number(pt.gross_profit ?? 0)
                : Number(pt.total_discounts_granted ?? 0);
        return { label, value };
      });
    }
    return (dashboard?.series || []).map((pt) => {
      const raw = pt.date || "";
      let label = raw;
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        label = d.toLocaleDateString("en-KE", {
          weekday: "short",
          day: "numeric",
        });
      } else if (raw.length >= 10) {
        label = raw.slice(5);
      }
      const value =
        metric === "orders"
          ? Number(pt.total_completed_orders_count ?? 0)
          : metric === "revenue"
            ? Number(pt.net_revenue_collected ?? pt.gross_sales_volume ?? 0)
            : metric === "profit"
              ? Number(pt.gross_profit ?? 0)
              : Number(pt.total_discounts_granted ?? 0);
      return { label, value };
    });
  }, [hourlyGrain, hourly?.series, dashboard?.series, metric]);

  // Settled mix + open credit (credit is outstanding all-time, not period)
  const settled = useMemo(() => {
    const rows: { label: string; value: number; warn?: boolean; note?: string }[] =
      [];
    if (cash > 0) rows.push({ label: "Cash", value: cash });
    if (mpesa > 0) rows.push({ label: "M-Pesa", value: mpesa });
    if (card > 0) rows.push({ label: "Card", value: card });
    if (other > 0) rows.push({ label: "Other", value: other });
    rows.push({
      label: "Open credit (outstanding)",
      value: credit,
      warn: credit > 0,
      note: credit > 0 ? "Not limited to this period" : "None open",
    });
    if (rows.length === 1 && rev > 0 && cash + mpesa + card + other === 0) {
      rows.unshift({
        label: "Collected mix",
        value: 0,
        note: "No cash/M-Pesa/card in rollup for this window",
      });
    }
    return rows;
  }, [cash, mpesa, card, other, credit, rev]);

  if (loading && !dashboard) {
    return <PanelSkeleton />;
  }

  const profitProps =
    profitProvisional
      ? {
          value: formatKES(gp),
          ...(gp !== 0 ? delta(gp, prevGp) : {}),
          hint:
            missingCosts > 0
              ? `Estimated · ${missingCosts} line${missingCosts === 1 ? "" : "s"} missing cost`
              : "Estimated (provisional)",
          tone: "warn" as const,
        }
      : rev > 0 && gp === 0
        ? {
            value: formatKES(0),
            hint: "No margin recorded",
            tone: "muted" as const,
          }
        : {
            value: formatKES(gp),
            ...delta(gp, prevGp),
            hint: rev > 0 ? `margin ${((gp / rev) * 100).toFixed(0)}%` : undefined,
          };

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
          label={profitProvisional ? "Gross profit (est.)" : "Gross profit"}
          {...profitProps}
        />
      </KpiRow>

      <div className="rounded-xl border border-border/50 bg-card px-4 py-3 shadow-card">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Settled &amp; open
        </p>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
          {settled.map((row) => (
            <div key={row.label} className="flex min-w-[7rem] flex-col gap-0.5">
              <span
                className={
                  row.warn ? "text-xs text-amber-600" : "text-xs text-muted"
                }
              >
                {row.label}
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatKES(row.value)}
              </span>
              {row.note && (
                <span className="text-[11px] text-muted">{row.note}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Trend
            <span className="ml-2 font-normal normal-case text-muted">
              {hourlyGrain ? "by hour" : "by day"}
            </span>
          </p>
          <div
            role="tablist"
            aria-label="Chart metric"
            className="inline-flex gap-1 rounded-full border border-border/60 bg-background p-0.5"
          >
            {METRIC_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={metric === tab.id}
                onClick={() => setMetric(tab.id)}
                className={clsx(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  metric === tab.id
                    ? "bg-brand-primary text-white"
                    : "text-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 min-h-[240px]">
          <MetricLineChart
            points={chartPoints}
            height={240}
            emptyLabel="No completed sales in this period"
          />
        </div>
      </div>
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
      <div className="min-h-[280px] rounded-xl bg-border/40" />
    </div>
  );
}
