"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import {
  useSalesAnalytics,
  formatKES,
  type AnalyticsRange,
} from "@/features/analytics/hooks/useSalesAnalytics";
import {
  Zap,
  Users,
  Layers,
  CalendarDays,
  Loader2,
  TrendingUp,
  ShoppingBag,
  BarChart3,
} from "lucide-react";

interface OverviewClientProps {
  organizationId: string;
  businessId: string;
}

const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "3d", label: "3 days" },
  { value: "7d", label: "7 days" },
  { value: "month", label: "Month" },
];

export function OverviewClient({ organizationId: propOrgId, businessId: propBusinessId }: OverviewClientProps) {
  const { businessId: ctxBusinessId, organizationId: ctxOrgId } = useBusinessContext();
  const [range, setRange] = useState<AnalyticsRange>("7d");

  const normalizedBusinessId = propBusinessId || (Array.isArray(ctxBusinessId) ? ctxBusinessId[0] : ctxBusinessId) || "";
  const normalizedOrgId = propOrgId || (Array.isArray(ctxOrgId) ? ctxOrgId[0] : ctxOrgId) || "";

  const {
    isLoading,
    isError,
    error,
    isFetching,
    current,
    revenueChange,
    ordersChange,
    aovChange,
    weekSeries,
    refetch,
  } = useSalesAnalytics(normalizedBusinessId, range);

  const primaryMetrics = useMemo(() => {
    const fmt = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

    return [
      {
        title: "Money in",
        value: formatKES(current.revenue),
        change: fmt(revenueChange),
        isPositive: revenueChange >= 0,
        icon: TrendingUp,
        color: "text-brand-accent bg-brand-accent/10 border-brand-accent/20",
      },
      {
        title: "Sales made",
        value: current.orders.toLocaleString(),
        change: fmt(ordersChange),
        isPositive: ordersChange >= 0,
        icon: ShoppingBag,
        color: "text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20",
      },
      {
        title: "Avg. per sale",
        value: formatKES(current.aov),
        change: fmt(aovChange),
        isPositive: aovChange >= 0,
        icon: BarChart3,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      },
    ];
  }, [current, revenueChange, ordersChange, aovChange]);

  const details = useMemo(
    () => [
      { label: "Before discounts", value: formatKES(current.gross) },
      { label: "Discounts given", value: formatKES(current.discounts) },
      { label: "Tax collected", value: formatKES(current.tax) },
      { label: "Refunds", value: formatKES(current.refunds) },
    ],
    [current]
  );

  const quickActions = useMemo(
    () => [
      {
        title: "New sale",
        href: `/org/${normalizedOrgId}/${normalizedBusinessId}/terminal`,
        icon: Zap,
      },
      {
        title: "Staff",
        href: `/org/${normalizedOrgId}/${normalizedBusinessId}/staff`,
        icon: Users,
      },
      {
        title: "History",
        href: `/org/${normalizedOrgId}/${normalizedBusinessId}/sale-history`,
        icon: Layers,
      },
    ],
    [normalizedOrgId, normalizedBusinessId]
  );

  const { graphPoints, areaPoints } = useMemo(() => {
    const max = Math.max(...weekSeries.map((p) => p.revenue), 1);
    const n = weekSeries.length || 1;
    const pts = weekSeries.map((p, i) => {
      const x = n === 1 ? 180 : (i / (n - 1)) * 360;
      const y = 110 - (p.revenue / max) * 100;
      return `${x},${y}`;
    });
    const line = pts.join(" ");
    return {
      graphPoints: line || "0,110 360,110",
      areaPoints: `0,120 ${line} 360,120`,
    };
  }, [weekSeries]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center gap-2 text-muted min-h-[300px]">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm font-medium">Loading overview…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center min-h-[300px]">
        <p className="text-sm font-medium text-foreground">Couldn’t load overview</p>
        <p className="text-xs text-muted max-w-sm">
          {error instanceof Error ? error.message : "Something went wrong"}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="h-10 px-5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:opacity-90 active:scale-95 transition"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 gap-5 p-4 overflow-y-auto no-scrollbar text-foreground">
      <h1 className="sr-only">Business Performance Overview</h1>

      {/* Range controls + shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Select Date Range">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRange(opt.value)}
              className={`h-9 px-3.5 rounded-full text-xs font-medium transition min-h-[36px] flex items-center justify-center ${
                range === opt.value
                  ? "bg-brand-primary text-white shadow-xs"
                  : "bg-card border border-border/50 text-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/50"
              }`}
            >
              {opt.label}
            </button>
          ))}
          {isFetching && <Loader2 size={14} className="animate-spin text-muted ml-1" />}
        </div>

        <div className="flex items-center gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="h-9 px-3.5 rounded-full bg-card border border-border/50 text-xs font-medium text-muted hover:text-foreground hover:border-brand-primary/40 flex items-center gap-1.5 transition min-h-[36px]"
              >
                <Icon size={14} />
                <span>{action.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3 Primary Metrics */}
      <section className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0" aria-label="Key Performance Indicators">
        {primaryMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className="p-3 sm:p-5 bg-card border border-border/40 rounded-2xl flex items-center justify-between gap-2 min-w-0"
            >
              <div className="space-y-0.5 sm:space-y-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-muted truncate">{m.title}</p>
                <p className="text-sm sm:text-lg font-semibold font-mono text-foreground tabular-nums truncate">
                  {m.value}
                </p>
                <p className="text-[10px] sm:text-[11px] text-muted truncate">
                  <span
                    className={
                      m.isPositive ? "text-brand-accent font-medium" : "text-rose-500 font-medium"
                    }
                  >
                    {m.change}
                  </span>{" "}
                  <span className="hidden sm:inline">vs last period</span>
                </p>
              </div>
              <div
                className={`h-8 w-8 sm:h-10 sm:w-10 rounded-xl border flex items-center justify-center shrink-0 ${m.color}`}
              >
                <Icon size={16} className="sm:hidden" />
                <Icon size={18} className="hidden sm:block" />
              </div>
            </div>
          );
        })}
      </section>

      {/* Detail strip */}
      <section
        className="shrink-0 rounded-2xl border border-border/40 bg-card/80 px-4 py-3"
        aria-label="Financial Breakdown"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {details.map((d) => (
            <div key={d.label}>
              <p className="text-[11px] text-muted">{d.label}</p>
              <p className="text-sm font-medium font-mono text-foreground tabular-nums mt-0.5">
                {d.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Analytics Chart */}
      <section className="flex-1 min-h-[220px] bg-card border border-border/40 rounded-2xl p-5 flex flex-col" aria-label="Sales Trend Chart">
        <div className="mb-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <CalendarDays size={15} className="text-brand-accent" />
            <span>Last 7 days</span>
          </div>
          <p className="text-xs text-muted mt-1">
            {weekSeries.every((d) => d.revenue === 0)
              ? "No sales in the last 7 days yet."
              : `${formatKES(
                  weekSeries.reduce((s, d) => s + d.revenue, 0)
                )} across the week`}
          </p>
        </div>

        <div className="flex-1 min-h-[120px]">
          <svg
            viewBox="0 0 360 120"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand-accent, #10b981)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--brand-accent, #10b981)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line
              x1="0"
              y1="30"
              x2="360"
              y2="30"
              stroke="var(--border)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              opacity="0.35"
            />
            <line
              x1="0"
              y1="75"
              x2="360"
              y2="75"
              stroke="var(--border)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              opacity="0.35"
            />
            <polygon points={areaPoints} fill="url(#chartGradient)" />
            <polyline
              fill="none"
              stroke="var(--brand-accent, #10b981)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={graphPoints}
            />
          </svg>
        </div>

        <div className="pt-3 border-t border-border/40 flex justify-between text-[10px] text-muted font-mono">
          {weekSeries.map((d) => (
            <span key={d.date}>{d.label}</span>
          ))}
        </div>
      </section>
    </div>
  );
}