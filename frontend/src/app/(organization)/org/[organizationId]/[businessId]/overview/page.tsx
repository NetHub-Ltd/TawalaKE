// "use client";

// import React, { useMemo, useState } from "react";
// import Link from "next/link";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import { useSalesAnalytics } from "@/features/analytics/hooks/useSalesAnalytics";
// import type { AnalyticsRange } from "@/features/analytics/types";
// import { formatKES } from "@/features/analytics/lib/mapAnalytics";
// import {
//   Zap,
//   Users,
//   ShoppingBag,
//   TrendingUp,
//   BarChart3,
//   Layers,
//   ArrowRight,
//   CalendarDays,
//   Loader2,
// } from "lucide-react";

// const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
//   { value: "today", label: "Today" },
//   { value: "yesterday", label: "Yesterday" },
//   { value: "3d", label: "3 days" },
//   { value: "7d", label: "7 days" },
//   { value: "month", label: "Month" },
// ];

// export default function OverviewPage() {
//   const { businessId, businessName, organizationId } = useBusinessContext();
//   const [range, setRange] = useState<AnalyticsRange>("7d");

//   const normalizedBusinessId = Array.isArray(businessId)
//     ? businessId[0]
//     : businessId || "";
//   const normalizedOrgId = Array.isArray(organizationId)
//     ? organizationId[0]
//     : organizationId || "";

//   const {
//     isLoading,
//     isError,
//     error,
//     isFetching,
//     current,
//     revenueChange,
//     ordersChange,
//     aovChange,
//     weekSeries,
//     refetch,
//   } = useSalesAnalytics(normalizedBusinessId, range);

//   const analyticsSummary = useMemo(() => {
//     const fmtChange = (n: number) =>
//       `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

//     return [
//       {
//         title:
//           range === "today"
//             ? "Today's Revenue"
//             : range === "yesterday"
//               ? "Yesterday's Revenue"
//               : "Revenue",
//         value: formatKES(current.revenue),
//         change: fmtChange(revenueChange),
//         isPositive: revenueChange >= 0,
//         color:
//           "text-brand-accent bg-brand-accent/10 border-brand-accent/20",
//         icon: TrendingUp,
//       },
//       {
//         title: "Orders Processed",
//         value: `${current.orders.toLocaleString()} Transaction${current.orders === 1 ? "" : "s"}`,
//         change: fmtChange(ordersChange),
//         isPositive: ordersChange >= 0,
//         color:
//           "text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20",
//         icon: ShoppingBag,
//       },
//       {
//         title: "Average Spend",
//         value: formatKES(current.aov),
//         change: fmtChange(aovChange),
//         isPositive: aovChange >= 0,
//         color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
//         icon: BarChart3,
//       },
//     ];
//   }, [current, revenueChange, ordersChange, aovChange, range]);

//   const quickActions = useMemo(
//     () => [
//       {
//         title: "Make a Quick Sale",
//         description:
//           "Launch the register to process transactions and check out items.",
//         href: `/org/${normalizedOrgId}/${normalizedBusinessId}/terminal`,
//         icon: Zap,
//         badge: "Open Till",
//         badgeStyle:
//           "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
//       },
//       {
//         title: "Manage Store Staff",
//         description:
//           "Add team members, check working hours, and update access permissions.",
//         href: `/org/${normalizedOrgId}/${normalizedBusinessId}/staff`,
//         icon: Users,
//         badge: "Team",
//         badgeStyle: "bg-surface text-muted border-border/40",
//       },
//       {
//         title: "View Sales History",
//         description:
//           "Look through past transactions, review payments, and process receipts.",
//         href: `/org/${normalizedOrgId}/${normalizedBusinessId}/sale-history`,
//         icon: Layers,
//         badge: "Records",
//         badgeStyle:
//           "bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20",
//       },
//     ],
//     [normalizedOrgId, normalizedBusinessId]
//   );

//   // SVG path from weekSeries (0..360 x, 0..120 y inverted)
//   const { graphPoints, areaPoints } = useMemo(() => {
//     const max = Math.max(...weekSeries.map((p) => p.revenue), 1);
//     const n = weekSeries.length || 1;
//     const pts = weekSeries.map((p, i) => {
//       const x = n === 1 ? 180 : (i / (n - 1)) * 360;
//       const y = 110 - (p.revenue / max) * 100;
//       return `${x},${y}`;
//     });
//     const line = pts.join(" ");
//     return {
//       graphPoints: line || "0,110 360,110",
//       areaPoints: `0,120 ${line} 360,120`,
//     };
//   }, [weekSeries]);

//   if (isLoading) {
//     return (
//       <div className="w-full h-full flex items-center justify-center gap-2 text-muted">
//         <Loader2 size={18} className="animate-spin" />
//         <span className="text-sm">Loading analytics…</span>
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
//         <p className="text-sm font-medium text-foreground">
//           Couldn’t load analytics
//         </p>
//         <p className="text-xs text-muted max-w-sm">
//           {error instanceof Error ? error.message : "Something went wrong"}
//         </p>
//         <button
//           onClick={() => refetch()}
//           className="h-9 px-4 rounded-xl bg-brand-primary text-white text-sm font-medium"
//         >
//           Try again
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full h-full flex flex-col min-h-0 space-y-6 p-4 overflow-y-auto no-scrollbar font-sans antialiased text-foreground select-none">
//       {/* Range pills */}
//       <div className="flex flex-wrap items-center gap-2 shrink-0">
//         {RANGE_OPTIONS.map((opt) => (
//           <button
//             key={opt.value}
//             type="button"
//             onClick={() => setRange(opt.value)}
//             className={`h-8 px-3 rounded-full text-xs font-medium transition ${
//               range === opt.value
//                 ? "bg-brand-primary text-white"
//                 : "bg-card border border-border/50 text-muted hover:text-foreground"
//             }`}
//           >
//             {opt.label}
//           </button>
//         ))}
//         {isFetching && (
//           <Loader2 size={14} className="animate-spin text-muted ml-1" />
//         )}
//       </div>

//       {/* KPIs */}
//       <section className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
//         {analyticsSummary.map((metric, i) => {
//           const IconComponent = metric.icon;
//           return (
//             <div
//               key={i}
//               className="p-5 bg-card border border-border/40 rounded-[1.5rem] shadow-xs flex items-center justify-between"
//             >
//               <div className="space-y-1">
//                 <span className="text-[10px] font-bold uppercase text-muted tracking-wider block">
//                   {metric.title}
//                 </span>
//                 <div className="text-base font-black tracking-tight text-foreground font-mono">
//                   {metric.value}
//                 </div>
//                 <div className="flex items-center gap-1 text-[10px]">
//                   <span
//                     className={`font-mono font-bold px-1.5 py-0.5 rounded-md ${
//                       metric.isPositive
//                         ? "text-brand-accent bg-brand-accent/5"
//                         : "text-rose-500 bg-rose-500/5"
//                     }`}
//                   >
//                     {metric.change}
//                   </span>
//                   <span className="text-muted/60 font-medium">
//                     vs prior period
//                   </span>
//                 </div>
//               </div>
//               <div
//                 className={`h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0 ${metric.color}`}
//               >
//                 <IconComponent size={18} />
//               </div>
//             </div>
//           );
//         })}
//       </section>

//       {/* Actions + chart */}
//       <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0 w-full">
//         <nav
//           className="lg:col-span-3 flex flex-col space-y-3 min-h-0"
//           aria-label="Quick Actions"
//         >
//           <div className="px-1 shrink-0">
//             <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">
//               Quick Actions
//             </h2>
//           </div>
//           <div className="flex-1 space-y-3">
//             {quickActions.map((action, i) => {
//               const ActionIcon = action.icon;
//               return (
//                 <Link
//                   key={i}
//                   href={action.href}
//                   className="card-layered p-5 flex items-start justify-between group cursor-pointer border-border/40 block text-left"
//                 >
//                   <div className="flex items-start gap-4 min-w-0">
//                     <div className="h-10 w-10 rounded-xl bg-surface border border-border/40 flex items-center justify-center shrink-0 text-muted group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all">
//                       <ActionIcon size={16} />
//                     </div>
//                     <div className="space-y-0.5 min-w-0">
//                       <div className="flex items-center gap-2 flex-wrap">
//                         <h3 className="text-xs font-bold uppercase text-foreground tracking-tight group-hover:text-brand-primary transition-colors my-0">
//                           {action.title}
//                         </h3>
//                         <span
//                           className={`inline-block px-2 py-0.5 text-[8px] font-bold tracking-wider uppercase border rounded-md font-mono ${action.badgeStyle}`}
//                         >
//                           {action.badge}
//                         </span>
//                       </div>
//                       <p className="text-[11px] text-muted leading-relaxed font-medium line-clamp-2">
//                         {action.description}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="h-7 w-7 rounded-lg bg-surface border border-border/40 flex items-center justify-center shrink-0 text-muted/60 opacity-0 group-hover:opacity-100 group-hover:text-brand-primary transition-all">
//                     <ArrowRight size={12} />
//                   </div>
//                 </Link>
//               );
//             })}
//           </div>
//         </nav>

//         <section className="lg:col-span-2 flex flex-col space-y-3 min-h-0">
//           <div className="px-1 shrink-0">
//             <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">
//               Weekly Revenue Trends
//             </h2>
//           </div>

//           <div className="flex-1 bg-card border border-border/40 rounded-[2rem] p-5 flex flex-col justify-between min-h-0 shadow-xs relative overflow-hidden">
//             <div className="space-y-1.5 z-10 relative">
//               <div className="flex items-center gap-1.5 text-xs font-mono text-brand-primary font-bold">
//                 <CalendarDays size={14} className="text-brand-accent" />
//                 <span>Last 7 days</span>
//               </div>
//               <p className="text-[11px] text-muted leading-relaxed font-medium">
//                 {current.orders === 0
//                   ? "No completed sales in this period yet."
//                   : `KES ${current.revenue.toLocaleString()} across ${current.orders} order${current.orders === 1 ? "" : "s"} in the selected range.`}
//               </p>
//             </div>

//             <div className="w-full h-32 my-4 relative flex items-end">
//               <svg
//                 viewBox="0 0 360 120"
//                 className="w-full h-full overflow-visible"
//                 preserveAspectRatio="none"
//               >
//                 <defs>
//                   <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
//                     <stop
//                       offset="0%"
//                       stopColor="var(--brand-accent, #10b981)"
//                       stopOpacity="0.25"
//                     />
//                     <stop
//                       offset="100%"
//                       stopColor="var(--brand-accent, #10b981)"
//                       stopOpacity="0"
//                     />
//                   </linearGradient>
//                 </defs>
//                 <line
//                   x1="0"
//                   y1="30"
//                   x2="360"
//                   y2="30"
//                   stroke="var(--border)"
//                   strokeWidth="0.5"
//                   strokeDasharray="4 4"
//                   opacity="0.3"
//                 />
//                 <line
//                   x1="0"
//                   y1="75"
//                   x2="360"
//                   y2="75"
//                   stroke="var(--border)"
//                   strokeWidth="0.5"
//                   strokeDasharray="4 4"
//                   opacity="0.3"
//                 />
//                 <polygon points={areaPoints} fill="url(#chartGradient)" />
//                 <polyline
//                   fill="none"
//                   stroke="var(--brand-accent, #10b981)"
//                   strokeWidth="2"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   points={graphPoints}
//                 />
//               </svg>
//             </div>

//             <div className="pt-3 border-t border-border/40 shrink-0 flex items-center justify-between text-[9px] text-muted font-mono font-bold">
//               {weekSeries.map((d) => (
//                 <span key={d.date}>{d.label}</span>
//               ))}
//             </div>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }

"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { useSalesAnalytics } from "@/features/analytics/hooks/useSalesAnalytics";
import type { AnalyticsRange } from "@/features/analytics/types";
import { formatKES } from "@/features/analytics/lib/mapAnalytics";
import {
  Zap,
  Users,
  Layers,
  ArrowRight,
  CalendarDays,
  Loader2,
  TrendingUp,
  ShoppingBag,
  Receipt,
  Percent,
  RotateCcw,
  Wallet,
} from "lucide-react";

const RANGE_OPTIONS: { value: AnalyticsRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "3d", label: "3 days" },
  { value: "7d", label: "7 days" },
  { value: "month", label: "Month" },
];

function ChangePill({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
        positive
          ? "text-brand-accent bg-brand-accent/5"
          : "text-rose-500 bg-rose-500/5"
      }`}
    >
      {positive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

export default function OverviewPage() {
  const { businessId, organizationId } = useBusinessContext();
  const [range, setRange] = useState<AnalyticsRange>("7d");

  const normalizedBusinessId = Array.isArray(businessId)
    ? businessId[0]
    : businessId || "";
  const normalizedOrgId = Array.isArray(organizationId)
    ? organizationId[0]
    : organizationId || "";

  const {
    isLoading,
    isError,
    error,
    isFetching,
    current,
    previous,
    revenueChange,
    ordersChange,
    aovChange,
    weekSeries,
    refetch,
  } = useSalesAnalytics(normalizedBusinessId, range);

  const discountRate =
    current.gross > 0 ? (current.discounts / current.gross) * 100 : 0;
  const refundRate =
    current.revenue > 0 ? (current.refunds / current.revenue) * 100 : 0;
  const netAfterRefunds = current.revenue - current.refunds;

  const metrics = useMemo(
    () => [
      {
        label: "Net revenue",
        value: formatKES(current.revenue),
        hint: "Collected total",
        change: revenueChange,
        icon: TrendingUp,
        accent: "text-brand-accent bg-brand-accent/10 border-brand-accent/20",
      },
      {
        label: "Gross sales",
        value: formatKES(current.gross),
        hint: "Before discounts",
        change: percentFrom(current.gross, previous.gross),
        icon: Wallet,
        accent:
          "text-brand-primary bg-brand-primary/10 border-brand-primary/20",
      },
      {
        label: "Orders",
        value: current.orders.toLocaleString(),
        hint: "Completed sales",
        change: ordersChange,
        icon: ShoppingBag,
        accent:
          "text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20",
      },
      {
        label: "Avg. ticket",
        value: formatKES(current.aov),
        hint: "Revenue ÷ orders",
        change: aovChange,
        icon: Receipt,
        accent: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      },
      {
        label: "Tax collected",
        value: formatKES(current.tax),
        hint: "VAT / tax total",
        change: percentFrom(current.tax, previous.tax),
        icon: Receipt,
        accent: "text-muted bg-muted/10 border-border/40",
      },
      {
        label: "Discounts",
        value: formatKES(current.discounts),
        hint:
          current.gross > 0
            ? `${discountRate.toFixed(1)}% of gross`
            : "No gross sales",
        change: percentFrom(current.discounts, previous.discounts),
        icon: Percent,
        accent: "text-amber-600 bg-amber-500/10 border-amber-500/20",
      },
      {
        label: "Refunds",
        value: formatKES(current.refunds),
        hint:
          current.revenue > 0
            ? `${refundRate.toFixed(1)}% of revenue`
            : "No revenue",
        change: percentFrom(current.refunds, previous.refunds),
        icon: RotateCcw,
        accent: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      },
      {
        label: "Net after refunds",
        value: formatKES(netAfterRefunds),
        hint: "Revenue − refunds",
        change: percentFrom(
          netAfterRefunds,
          previous.revenue - previous.refunds
        ),
        icon: TrendingUp,
        accent: "text-brand-accent bg-brand-accent/10 border-brand-accent/20",
      },
    ],
    [
      current,
      previous,
      revenueChange,
      ordersChange,
      aovChange,
      discountRate,
      refundRate,
      netAfterRefunds,
    ]
  );

  const quickActions = useMemo(
    () => [
      {
        title: "Quick sale",
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
      <div className="w-full h-full flex items-center justify-center gap-2 text-muted">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Loading analytics…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          Couldn’t load analytics
        </p>
        <p className="text-xs text-muted max-w-sm">
          {error instanceof Error ? error.message : "Something went wrong"}
        </p>
        <button
          onClick={() => refetch()}
          className="h-9 px-4 rounded-xl bg-brand-primary text-white text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 gap-5 p-4 overflow-y-auto no-scrollbar text-foreground">
      {/* Range + compact actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRange(opt.value)}
              className={`h-8 px-3 rounded-full text-xs font-medium transition ${
                range === opt.value
                  ? "bg-brand-primary text-white"
                  : "bg-card border border-border/50 text-muted hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
          {isFetching && (
            <Loader2 size={14} className="animate-spin text-muted" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="h-8 px-3 rounded-full bg-card border border-border/50 text-xs font-medium text-muted hover:text-foreground hover:border-brand-primary/30 flex items-center gap-1.5 transition"
              >
                <Icon size={14} />
                {action.title}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Full metric grid — every payload field + derived */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="p-4 bg-card border border-border/40 rounded-2xl flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium text-muted">{m.label}</p>
                  <p className="text-sm font-semibold text-foreground font-mono mt-1 tabular-nums">
                    {m.value}
                  </p>
                </div>
                <div
                  className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${m.accent}`}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-muted/80 truncate">{m.hint}</p>
                <ChangePill value={m.change} />
              </div>
            </div>
          );
        })}
      </section>

      {/* Chart */}
      <section className="flex-1 min-h-[240px] bg-card border border-border/40 rounded-[1.5rem] p-5 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-brand-primary">
              <CalendarDays size={14} className="text-brand-accent" />
              Last 7 days revenue
            </div>
            <p className="text-[11px] text-muted mt-1">
              {weekSeries.every((d) => d.revenue === 0)
                ? "No completed sales in the last 7 days."
                : `${formatKES(
                    weekSeries.reduce((s, d) => s + d.revenue, 0)
                  )} total · ${weekSeries.reduce((s, d) => s + (d.revenue > 0 ? 1 : 0), 0)} active days`}
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-[140px] relative">
          <svg
            viewBox="0 0 360 120"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--brand-accent, #10b981)"
                  stopOpacity="0.25"
                />
                <stop
                  offset="100%"
                  stopColor="var(--brand-accent, #10b981)"
                  stopOpacity="0"
                />
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
            <span key={d.date} className="text-center">
              {d.label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function percentFrom(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}