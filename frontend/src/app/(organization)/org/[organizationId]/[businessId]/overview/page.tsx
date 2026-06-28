// "use client";

// import React, { useMemo } from "react";
// import Link from "next/link";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";
// import { 
//   Zap, 
//   Users, 
//   ShoppingBag, 
//   TrendingUp, 
//   BarChart3, 
//   Activity,
//   Layers,
//   ArrowRight,
//   CalendarDays
// } from "lucide-react";

// export default function OverviewPage() {
//   const { businessId, businessName, organizationId } = useBusinessContext();

//   const normalizedBusinessId = Array.isArray(businessId) ? businessId[0] : businessId || "";
//   const normalizedOrgId = Array.isArray(organizationId) ? organizationId[0] : organizationId || "";
//   const safeBusinessName = businessName || "Store Dashboard";

//   // Human-friendly performance statistics
//   const analyticsSummary = useMemo(() => [
//     {
//       title: "Today's Gross Revenue",
//       value: "KES 142,850.00",
//       change: "+12.4%",
//       isPositive: true,
//       color: "text-brand-accent bg-brand-accent/10 border-brand-accent/20",
//       icon: TrendingUp,
//     },
//     {
//       title: "Orders Processed",
//       value: "84 Transactions",
//       change: "+8.2%",
//       isPositive: true,
//       color: "text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20",
//       icon: ShoppingBag,
//     },
//     {
//       title: "Average Spend per Customer",
//       value: "KES 1,700.60",
//       change: "-1.5%",
//       isPositive: false,
//       color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
//       icon: BarChart3,
//     },
//   ], []);

//   // Simplified link navigation pathways
//   const quickActions = useMemo(() => [
//     {
//       title: "Make a Quick Sale",
//       description: "Launch the register window to process transactions and check out items immediately.",
//       href: `/org/${normalizedOrgId}/${normalizedBusinessId}/terminal`,
//       icon: Zap,
//       badge: "Open Till",
//       badgeStyle: "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
//     },
//     {
//       title: "Manage Store Staff",
//       description: "Add team members, check working hours, and update access permissions.",
//       href: `/org/${normalizedOrgId}/${normalizedBusinessId}/staff`,
//       icon: Users,
//       badge: "Team",
//       badgeStyle: "bg-surface text-muted border-border/40"
//     },
//     {
//       title: "View Sales History",
//       description: "Look through past transactions, review payment methods, and process receipts.",
//       href: `/org/${normalizedOrgId}/${normalizedBusinessId}/sales`,
//       icon: Layers,
//       badge: "Records",
//       badgeStyle: "bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20"
//     }
//   ], [normalizedOrgId, normalizedBusinessId]);

//   // Pure SVG Mock Data Points for Weekly Sales Insights Graph
//   // Coordinates mapped for an elegant, responsive area line chart path
//   const graphPoints = "0,90 40,75 80,82 120,45 160,55 200,25 240,30 280,10 320,15 360,5";
//   const areaPoints = `0,120 ${graphPoints} 360,120`;

//   return (
//     <div className="w-full h-full flex flex-col min-h-0 space-y-6 p-1 overflow-y-auto no-scrollbar font-sans antialiased text-foreground select-none">
      
//       {/* SECTION 1: HEADER */}
//       <header className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-border/40 shrink-0">
//         <div>
//           <div className="flex items-center gap-2">
//             <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
//             <span className="text-[10px] font-bold tracking-wider uppercase text-brand-primary font-mono">
//               Live System Online
//             </span>
//           </div>
//           <h1 className="text-xl font-black uppercase tracking-tight text-foreground mt-0.5">
//             {safeBusinessName} Overview
//           </h1>
//           <p className="text-xs text-muted font-medium mt-0.5">
//             Business ID: <span className="font-mono bg-surface border border-border/40 px-1.5 py-0.5 rounded text-[10px] text-foreground">{normalizedBusinessId || "Unassigned"}</span>
//           </p>
//         </div>

//         <div className="flex items-center gap-3 bg-card border border-border/40 px-4 h-11 rounded-2xl shadow-xs shrink-0 self-start sm:self-auto">
//           <Activity size={14} className="text-brand-accent" />
//           <div className="flex flex-col text-left">
//             <span className="text-[9px] font-black uppercase text-muted tracking-wider leading-none">Connection</span>
//             <span className="text-[11px] font-medium text-foreground">Synchronized</span>
//           </div>
//         </div>
//       </header>

//       {/* SECTION 2: METRICS BOXES */}
//       <section className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
//         {analyticsSummary.map((metric, i) => {
//           const IconComponent = metric.icon;
//           return (
//             <div 
//               key={i} 
//               className="p-5 bg-card border border-border/40 rounded-[1.5rem] shadow-xs flex items-center justify-between group hover:border-brand-primary/20 transition-all duration-300"
//             >
//               <div className="space-y-1">
//                 <span className="text-[10px] font-bold uppercase text-muted tracking-wider block">{metric.title}</span>
//                 <div className="text-base font-black tracking-tight text-foreground font-mono">{metric.value}</div>
//                 <div className="flex items-center gap-1 text-[10px]">
//                   <span className={`font-mono font-bold px-1.5 py-0.25 rounded-md ${metric.isPositive ? "text-brand-accent bg-brand-accent/5" : "text-rose-500 bg-rose-500/5"}`}>
//                     {metric.change}
//                   </span>
//                   <span className="text-muted/60 font-medium">from last week</span>
//                 </div>
//               </div>

//               <div className={`h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0 ${metric.color}`}>
//                 <IconComponent size={18} />
//               </div>
//             </div>
//           );
//         })}
//       </section>

//       {/* SECTION 3: WORKSPACE SUB-GRID */}
//       <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0 w-full">
        
//         {/* QUICK ACTION NAVIGATION BUTTONS (Left 3 Columns) */}
//         <nav className="lg:col-span-3 flex flex-col space-y-3 min-h-0" aria-label="Quick Actions">
//           <div className="px-1 shrink-0">
//             <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">Quick Actions</h2>
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
//                     <div className="h-10 w-10 rounded-xl bg-surface border border-border/40 flex items-center justify-center shrink-0 text-muted group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all duration-300">
//                       <ActionIcon size={16} />
//                     </div>
//                     <div className="space-y-0.5 min-w-0">
//                       <div className="flex items-center gap-2 flex-wrap">
//                         <h3 className="text-xs font-bold uppercase text-foreground tracking-tight group-hover:text-brand-primary transition-colors my-0">
//                           {action.title}
//                         </h3>
//                         <span className={`inline-block px-2 py-0.25 text-[8px] font-bold tracking-wider uppercase border rounded-md font-mono ${action.badgeStyle}`}>
//                           {action.badge}
//                         </span>
//                       </div>
//                       <p className="text-[11px] text-muted leading-relaxed font-medium line-clamp-2">
//                         {action.description}
//                       </p>
//                     </div>
//                   </div>

//                   <div className="h-7 w-7 rounded-lg bg-surface border border-border/40 flex items-center justify-center shrink-0 text-muted/60 opacity-0 group-hover:opacity-100 group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
//                     <ArrowRight size={12} />
//                   </div>
//                 </Link>
//               );
//             })}
//           </div>
//         </nav>

//         {/* NATIVE SVG BUSINESS INSIGHTS GRAPH (Right 2 Columns) */}
//         <section className="lg:col-span-2 flex flex-col space-y-3 min-h-0">
//           <div className="px-1 shrink-0">
//             <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">Weekly Revenue Trends</h2>
//           </div>

//           <div className="flex-1 bg-card border border-border/40 rounded-[2rem] p-5 flex flex-col justify-between min-h-0 shadow-xs relative overflow-hidden">
//             <div className="space-y-1.5 z-10 relative">
//               <div className="flex items-center gap-1.5 text-xs font-mono text-brand-primary font-bold">
//                 <CalendarDays size={14} className="text-brand-accent" />
//                 <span>Sales Velocity Insight</span>
//               </div>
//               <p className="text-[11px] text-muted leading-relaxed font-medium">
//                 Store activity peaks daily between <span className="text-foreground font-bold">2:00 PM and 5:00 PM</span>. Transaction patterns show an upward momentum over the last 48 hours.
//               </p>
//             </div>

//             {/* Responsive Pure SVG Vector Chart */}
//             <div className="w-full h-32 my-4 relative flex items-end">
//               <svg 
//                 viewBox="0 0 360 120" 
//                 className="w-full h-full overflow-visible"
//                 preserveAspectRatio="none"
//               >
//                 <defs>
//                   <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="0%" stopColor="var(--brand-accent, #10b981)" stopOpacity="0.25" />
//                     <stop offset="100%" stopColor="var(--brand-accent, #10b981)" stopOpacity="0.00" />
//                   </linearGradient>
//                 </defs>
//                 {/* Horizontal Grid Guides */}
//                 <line x1="0" y1="30" x2="360" y2="30" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
//                 <line x1="0" y1="75" x2="360" y2="75" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
                
//                 {/* Area under line fill */}
//                 <polygon points={areaPoints} fill="url(#chartGradient)" />
                
//                 {/* Crisp Vector Stroke path */}
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

//             {/* X-Axis Horizontal Timeline Labels */}
//             <div className="pt-3 border-t border-border/40 shrink-0 flex items-center justify-between text-[9px] text-muted font-mono font-bold select-none relative z-10">
//               <span>Mon</span>
//               <span>Tue</span>
//               <span>Wed</span>
//               <span>Thu</span>
//               <span>Fri</span>
//               <span>Sat</span>
//               <span>Sun</span>
//             </div>

//           </div>
//         </section>

//       </div>

//     </div>
//   );
// }

"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { 
  Zap, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  BarChart3, 
  Activity,
  Layers,
  ArrowRight,
  CalendarDays
} from "lucide-react";

export default function OverviewPage() {
  const { businessId, businessName, organizationId } = useBusinessContext();

  const normalizedBusinessId = Array.isArray(businessId) ? businessId[0] : businessId || "";
  const normalizedOrgId = Array.isArray(organizationId) ? organizationId[0] : organizationId || "";
  const safeBusinessName = businessName || "Store Dashboard";

  // Human-friendly performance statistics
  const analyticsSummary = useMemo(() => [
    {
      title: "Today's Gross Revenue",
      value: "KES 142,850.00",
      change: "+12.4%",
      isPositive: true,
      color: "text-brand-accent bg-brand-accent/10 border-brand-accent/20",
      icon: TrendingUp,
    },
    {
      title: "Orders Processed",
      value: "84 Transactions",
      change: "+8.2%",
      isPositive: true,
      color: "text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20",
      icon: ShoppingBag,
    },
    {
      title: "Average Spend per Customer",
      value: "KES 1,700.60",
      change: "-1.5%",
      isPositive: false,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      icon: BarChart3,
    },
  ], []);

  // Simplified link navigation pathways
  const quickActions = useMemo(() => [
    {
      title: "Make a Quick Sale",
      description: "Launch the register window to process transactions and check out items immediately.",
      href: `/org/${normalizedOrgId}/${normalizedBusinessId}/terminal`,
      icon: Zap,
      badge: "Open Till",
      badgeStyle: "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
    },
    {
      title: "Manage Store Staff",
      description: "Add team members, check working hours, and update access permissions.",
      href: `/org/${normalizedOrgId}/${normalizedBusinessId}/staff`,
      icon: Users,
      badge: "Team",
      badgeStyle: "bg-surface text-muted border-border/40"
    },
    {
      title: "View Sales History",
      description: "Look through past transactions, review payment methods, and process receipts.",
      href: `/org/${normalizedOrgId}/${normalizedBusinessId}/sales`,
      icon: Layers,
      badge: "Records",
      badgeStyle: "bg-brand-secondary/10 text-brand-secondary border-brand-secondary/20"
    }
  ], [normalizedOrgId, normalizedBusinessId]);

  // Pure SVG Mock Data Points for Weekly Sales Insights Graph
  // Coordinates mapped for an elegant, responsive area line chart path
  const graphPoints = "0,90 40,75 80,82 120,45 160,55 200,25 240,30 280,10 320,15 360,5";
  const areaPoints = `0,120 ${graphPoints} 360,120`;

  return (
    <div className="w-full h-full flex flex-col min-h-0 space-y-6 p-4 overflow-y-auto no-scrollbar font-sans antialiased text-foreground select-none">
      
      {/* SECTION 1: HEADER */}
      {/* <header className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-border/40 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-brand-primary font-mono">
              Live System Online
            </span>
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-foreground mt-0.5">
            {safeBusinessName} Overview
          </h1>
          <p className="text-xs text-muted font-medium mt-0.5">
            Business ID: <span className="font-mono bg-surface border border-border/40 px-1.5 py-0.5 rounded text-[10px] text-foreground">{normalizedBusinessId || "Unassigned"}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card border border-border/40 px-4 h-11 rounded-2xl shadow-xs shrink-0 self-start sm:self-auto">
          <Activity size={14} className="text-brand-accent" />
          <div className="flex flex-col text-left">
            <span className="text-[9px] font-black uppercase text-muted tracking-wider leading-none">Connection</span>
            <span className="text-[11px] font-medium text-foreground">Synchronized</span>
          </div>
        </div>
      </header> */}

      {/* SECTION 2: METRICS BOXES */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        {analyticsSummary.map((metric, i) => {
          const IconComponent = metric.icon;
          return (
            <div 
              key={i} 
              className="p-5 bg-card border border-border/40 rounded-[1.5rem] shadow-xs flex items-center justify-between group hover:border-brand-primary/20 transition-all duration-300"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted tracking-wider block">{metric.title}</span>
                <div className="text-base font-black tracking-tight text-foreground font-mono">{metric.value}</div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className={`font-mono font-bold px-1.5 py-0.25 rounded-md ${metric.isPositive ? "text-brand-accent bg-brand-accent/5" : "text-rose-500 bg-rose-500/5"}`}>
                    {metric.change}
                  </span>
                  <span className="text-muted/60 font-medium">from last week</span>
                </div>
              </div>

              <div className={`h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0 ${metric.color}`}>
                <IconComponent size={18} />
              </div>
            </div>
          );
        })}
      </section>

      {/* SECTION 3: WORKSPACE SUB-GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0 w-full">
        
        {/* QUICK ACTION NAVIGATION BUTTONS (Left 3 Columns) */}
        <nav className="lg:col-span-3 flex flex-col space-y-3 min-h-0" aria-label="Quick Actions">
          <div className="px-1 shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">Quick Actions</h2>
          </div>
          
          <div className="flex-1 space-y-3">
            {quickActions.map((action, i) => {
              const ActionIcon = action.icon;
              return (
                <Link 
                  key={i}
                  href={action.href}
                  className="card-layered p-5 flex items-start justify-between group cursor-pointer border-border/40 block text-left"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-surface border border-border/40 flex items-center justify-center shrink-0 text-muted group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all duration-300">
                      <ActionIcon size={16} />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-bold uppercase text-foreground tracking-tight group-hover:text-brand-primary transition-colors my-0">
                          {action.title}
                        </h3>
                        <span className={`inline-block px-2 py-0.25 text-[8px] font-bold tracking-wider uppercase border rounded-md font-mono ${action.badgeStyle}`}>
                          {action.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted leading-relaxed font-medium line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  <div className="h-7 w-7 rounded-lg bg-surface border border-border/40 flex items-center justify-center shrink-0 text-muted/60 opacity-0 group-hover:opacity-100 group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                    <ArrowRight size={12} />
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* NATIVE SVG BUSINESS INSIGHTS GRAPH (Right 2 Columns) */}
        <section className="lg:col-span-2 flex flex-col space-y-3 min-h-0">
          <div className="px-1 shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">Weekly Revenue Trends</h2>
          </div>

          <div className="flex-1 bg-card border border-border/40 rounded-[2rem] p-5 flex flex-col justify-between min-h-0 shadow-xs relative overflow-hidden">
            <div className="space-y-1.5 z-10 relative">
              <div className="flex items-center gap-1.5 text-xs font-mono text-brand-primary font-bold">
                <CalendarDays size={14} className="text-brand-accent" />
                <span>Sales Velocity Insight</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed font-medium">
                Store activity peaks daily between <span className="text-foreground font-bold">2:00 PM and 5:00 PM</span>. Transaction patterns show an upward momentum over the last 48 hours.
              </p>
            </div>

            {/* Responsive Pure SVG Vector Chart */}
            <div className="w-full h-32 my-4 relative flex items-end">
              <svg 
                viewBox="0 0 360 120" 
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-accent, #10b981)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--brand-accent, #10b981)" stopOpacity="0.00" />
                  </linearGradient>
                </defs>
                {/* Horizontal Grid Guides */}
                <line x1="0" y1="30" x2="360" y2="30" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
                <line x1="0" y1="75" x2="360" y2="75" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
                
                {/* Area under line fill */}
                <polygon points={areaPoints} fill="url(#chartGradient)" />
                
                {/* Crisp Vector Stroke path */}
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

            {/* X-Axis Horizontal Timeline Labels */}
            <div className="pt-3 border-t border-border/40 shrink-0 flex items-center justify-between text-[9px] text-muted font-mono font-bold select-none relative z-10">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

          </div>
        </section>

      </div>

    </div>
  );
}