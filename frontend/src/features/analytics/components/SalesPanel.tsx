"use client";

import React, { useMemo, useState } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import { MetricLineChart, MultiSeriesTrendChart } from "./charts/SimpleCharts";
import { formatKES, formatPct, pctChange } from "@/features/analytics/lib/format";
import type {
  DashboardPayload,
  HourlyPayload,
} from "@/features/analytics/hooks/useDashboardData";
import type { AnalyticsRange } from "@/features/analytics/lib/fetchReport";

type ChartMetric = "all" | "orders" | "revenue" | "profit" | "discounts";

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

type MoneyCell = {
  label: string;
  value: number;
  note?: string;
  emphasize?: boolean;
};

function MoneyBlock({
  title,
  subtitle,
  rows,
  emptyNote,
}: {
  title: string;
  subtitle?: string;
  rows: MoneyCell[];
  emptyNote?: string;
}) {
  return (
    <div className="rounded-md border border-border/50 bg-card px-4 py-3 shadow-card">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted">{title}</p>
        {subtitle ? (
          <p className="text-xs text-muted">{subtitle}</p>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{emptyNote || "No amounts in this window"}</p>
      ) : (
        <div className="flex flex-wrap items-start gap-x-8 gap-y-3 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex min-w-[7rem] flex-col gap-0.5">
              <span className="text-xs text-muted">{row.label}</span>
              <span
                className={clsx(
                  "font-mono text-sm font-semibold tabular-nums",
                  row.emphasize ? "text-foreground" : "text-foreground"
                )}
              >
                {formatKES(row.value)}
              </span>
              {row.note ? (
                <span className="text-xs text-muted">{row.note}</span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
  const [metric, setMetric] = useState<ChartMetric>("all");
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
  const creditIssued = s?.credit_issued_period ?? 0;
  const creditCollected = s?.credit_collected_period ?? 0;
  const openCreditCount = s?.open_credit_sales ?? 0;
  const profitProvisional =
    Boolean(s?.profit_is_provisional) || missingCosts > 0;

  const expensesTotal = s?.expenses_total ?? 0;
  const expensesCount = s?.expenses_count ?? 0;
  const profitAfterExpenses = s?.profit_after_expenses;
  const expensesAvailable = s?.expenses_available;

  const chartDeltaPct = (() => {
    if (metric === "all" || metric === "revenue") return pctChange(rev, prevRev);
    if (metric === "orders") return pctChange(orders, prevOrders);
    if (metric === "profit") return pctChange(gp, prevGp);
    const disc = s?.total_discounts_granted ?? 0;
    const prevDisc = p?.total_discounts_granted ?? 0;
    return pctChange(disc, prevDisc);
  })();

  /** Suppress noisy % on near-zero baselines (e.g. first sale of the day). */
  const quietDelta = (cur: number, prev: number) => {
    if (prev <= 0 && cur <= 0) return null;
    if (prev <= 0 && cur > 0) return { label: "vs prior period", tone: "muted" as const };
    const c = pctChange(cur, prev);
    if (!Number.isFinite(c)) return null;
    if (Math.abs(c) < 0.5) return null; // under 0.5% not worth the noise
    return {
      label: formatPct(c),
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
            : metric === "revenue" || metric === "all"
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
          : metric === "revenue" || metric === "all"
            ? Number(pt.net_revenue_collected ?? pt.gross_sales_volume ?? 0)
            : metric === "profit"
              ? Number(pt.gross_profit ?? 0)
              : Number(pt.total_discounts_granted ?? 0);
      return { label, value };
    });
  }, [hourlyGrain, hourly?.series, dashboard?.series, metric]);

  const multiSeriesPoints = useMemo(() => {
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
        return {
          label,
          revenue: Number(pt.net_revenue ?? 0),
          profit: Number(pt.gross_profit ?? 0),
          discounts: Number(pt.total_discounts_granted ?? 0),
          orders: Number(pt.orders ?? 0),
        };
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
      return {
        label,
        revenue: Number(pt.net_revenue_collected ?? pt.gross_sales_volume ?? 0),
        profit: Number(pt.gross_profit ?? 0),
        discounts: Number(pt.total_discounts_granted ?? 0),
        orders: Number(pt.total_completed_orders_count ?? 0),
      };
    });
  }, [hourlyGrain, hourly?.series, dashboard?.series]);

  /** Period-scoped tender only — never mix with all-time open credit. */
  const settledRows = useMemo(() => {
    const rows: MoneyCell[] = [];
    if (cash > 0) rows.push({ label: "Cash", value: cash });
    if (mpesa > 0) rows.push({ label: "M-Pesa", value: mpesa });
    if (card > 0) rows.push({ label: "Card", value: card });
    if (other > 0) rows.push({ label: "Other", value: other });
    if (rows.length === 0 && rev > 0) {
      rows.push({
        label: "Collected mix",
        value: 0,
        note: "No cash / M-Pesa / card lines in rollup for this window",
      });
    }
    return rows;
  }, [cash, mpesa, card, other, rev]);

  /** Period credit activity + live outstanding (all open balances). */
  const creditRows = useMemo(() => {
    const rows: MoneyCell[] = [
      {
        label: "Issued",
        value: creditIssued,
        note: "In this period",
      },
      {
        label: "Collected",
        value: creditCollected,
        note: "In this period",
      },
      {
        label: "Outstanding",
        value: credit,
        emphasize: credit > 0,
        note:
          credit > 0
            ? openCreditCount > 0
              ? `Live · ${openCreditCount} open sale${openCreditCount === 1 ? "" : "s"} · all open balances`
              : "Live · all open balances"
            : "None open",
      },
    ];
    return rows;
  }, [creditIssued, creditCollected, credit, openCreditCount]);

  if (loading && !dashboard) {
    return <PanelSkeleton />;
  }

  const revDelta = quietDelta(rev, prevRev);
  const netAfter =
    profitAfterExpenses !== undefined && profitAfterExpenses !== null
      ? profitAfterExpenses
      : gp - expensesTotal;
  const marginPct = rev > 0 ? Math.round((gp / rev) * 100) : null;
  const grossLabel = profitProvisional ? "Gross (est.)" : "Gross profit";

  return (
    <div className="flex min-h-0 flex-col gap-2.5">
      {/* Primary pulse — one landing number */}
      <section
        className="shrink-0 rounded-lg border border-border/40 bg-card px-3 py-3 shadow-card sm:px-4"
        aria-labelledby="overview-hero-label"
      >
        <p
          id="overview-hero-label"
          className="text-xs font-medium uppercase tracking-wide text-muted"
        >
          Net revenue
        </p>
        <p className="mt-0.5 font-mono text-2xl font-semibold tracking-tight text-foreground tabular-nums sm:text-3xl">
          {formatKES(rev)}
        </p>
        {revDelta ? (
          <p
            className={clsx(
              "mt-1.5 text-sm",
              revDelta.tone === "good" && "text-brand-accent",
              revDelta.tone === "bad" && "text-[color:var(--error)]",
              revDelta.tone === "muted" && "text-muted",
            )}
          >
            {revDelta.label}
            {revDelta.tone !== "muted" ? " vs prior period" : ""}
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-muted">Completed sales this period</p>
        )}

        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-border/40 pt-2.5 text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted">Orders</dt>
            <dd className="font-mono font-semibold tabular-nums text-foreground">
              {orders.toLocaleString()}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted">Avg ticket</dt>
            <dd className="font-mono font-semibold tabular-nums text-foreground">
              {formatKES(aov)}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted">{grossLabel}</dt>
            <dd className="font-mono font-semibold tabular-nums text-foreground">
              {formatKES(gp)}
              {marginPct != null && !profitProvisional ? (
                <span className="ml-1 text-xs font-normal text-muted">
                  · {marginPct}%
                </span>
              ) : null}
            </dd>
          </div>
        </dl>

        {expensesAvailable === true ? (
          <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2 rounded-md bg-background/80 px-2.5 py-1.5">
            <div className="text-sm">
              <span className="text-muted">After expenses</span>
              <span
                className={clsx(
                  "ml-2 font-mono text-base font-semibold tabular-nums",
                  netAfter < 0
                    ? "text-[color:var(--error)]"
                    : "text-foreground",
                )}
              >
                {formatKES(netAfter)}
              </span>
            </div>
            <p className="text-xs text-muted">
              Expenses {formatKES(expensesTotal)}
              {expensesCount > 0 ? ` · ${expensesCount}` : ""}
            </p>
          </div>
        ) : expensesAvailable === false ? (
          <p className="mt-3 text-xs text-muted" role="note">
            Shop expenses not in this window yet — figure above is sales margin
            only.
          </p>
        ) : null}
      </section>

      <CashCreditSection
        settledRows={settledRows}
        creditRows={creditRows}
        outstanding={credit}
      />

      <div className="min-h-0 flex-1 rounded-md border border-border/50 bg-card p-3 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted">
            Trend
            <span className="ml-2 font-normal normal-case text-muted">
              {hourlyGrain ? "by hour" : "by day"}
            </span>
          </p>
          <div
            role="tablist"
            aria-label="Chart view"
            className="inline-flex gap-1 rounded-full border border-border/60 bg-background p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={metric === "all"}
              onClick={() => setMetric("all")}
              className={clsx(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                metric === "all"
                  ? "bg-brand-primary text-white"
                  : "text-muted hover:text-foreground"
              )}
            >
              All
            </button>
            {METRIC_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={metric === tab.id}
                onClick={() => setMetric(tab.id)}
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
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
        <div className="mt-2 w-full max-w-full overflow-hidden">
          {metric === "all" ? (
            <MultiSeriesTrendChart
              points={multiSeriesPoints}
              height={140}
              emptyLabel="No completed sales in this period"
              moneyFormatter={(n) => formatKES(n)}
            />
          ) : (
            <div className="min-h-[140px]">
              <MetricLineChart
                points={chartPoints}
                height={140}
                emptyLabel="No completed sales in this period"
                deltaPct={chartDeltaPct}
                valueFormatter={
                  metric === "orders"
                    ? (n) => n.toLocaleString()
                    : (n) => formatKES(n)
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CashCreditSection({
  settledRows,
  creditRows,
  outstanding,
}: {
  settledRows: MoneyCell[];
  creditRows: MoneyCell[];
  outstanding: number;
}) {
  const [open, setOpen] = useState(false);
  const summary =
    outstanding > 0
      ? `Outstanding credit ${formatKES(outstanding)}`
      : settledRows.length
        ? "Settled collections this period"
        : "Cash & credit";

  return (
    <div className="rounded-xl border border-border/40 bg-card shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 sm:px-4"
        aria-expanded={open}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Cash & credit
          </p>
          <p className="mt-0.5 text-sm text-foreground">{summary}</p>
        </div>
        <ChevronDown
          className={clsx(
            "h-4 w-4 shrink-0 text-muted transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="grid gap-3 border-t border-border/40 px-4 py-3 sm:px-5 lg:grid-cols-2">
          <MoneyBlock
            title="Settled this period"
            subtitle="In the selected window"
            rows={settledRows}
            emptyNote="No settled tender in this period"
          />
          <MoneyBlock
            title="Credit"
            subtitle="Outstanding is live across open balances"
            rows={creditRows}
          />
        </div>
      ) : null}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 animate-pulse">
      <div className="min-h-[120px] rounded-lg bg-border/40" />
      <div className="h-14 rounded-xl bg-border/40" />
      <div className="min-h-[140px] rounded-md bg-border/40" />
    </div>
  );
}
