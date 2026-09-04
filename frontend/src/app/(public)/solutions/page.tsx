// import { Metadata } from "next";
// import Link from "next/link";
// import {
//   Store,
//   Pill,
//   Wrench,
//   Truck,
//   ArrowRight,
//   CheckCircle2,
//   ShieldCheck,
//   TrendingUp,
//   Sparkles,
//   Zap,
//   BarChart3,
//   Clock,
//   ChevronRight,
//   AlertTriangle,
// } from "lucide-react";

// export const metadata: Metadata = {
//   title: "Tawala Solutions | Industry-Specific POS & Business Systems",
//   description: "Manage retail shops, pharmacies, hardware stores, and wholesale distributors with Tawala. Stop stock leakages and track daily profits in real-time.",
//   alternates: {
//     canonical: "https://tawala.io/solutions",
//   },
// };

// interface IndustryPitch {
//   id: string;
//   slug: string;
//   title: string;
//   subtitle: string;
//   badge: string;
//   icon: React.ElementType;
//   primaryMetric: { value: string; label: string };
//   painPoint: string;
//   solution: string;
//   keyFeatures: string[];
//   ctaText: string;
// }

// const INDUSTRIES: IndustryPitch[] = [
//   {
//     id: "retail",
//     slug: "retail",
//     title: "Retail & Minimarts",
//     subtitle: "Stop stock leaks at the register and automate till reconciliation.",
//     badge: "High Transaction Volume",
//     icon: Store,
//     primaryMetric: { value: "-98%", label: "Unaccounted Inventory Loss" },
//     painPoint: "Unchecked cashier voids, unrecorded cash sales, and manual exercise book tracking.",
//     solution: "Tawala ties every barcode scan directly to staff PIN logs and instantly reconciles M-Pesa Buy Goods & till balances.",
//     keyFeatures: [
//       "Sub-second barcode checkout on mobile, tablet, or PC",
//       "Cashier PIN locks with detailed shift handover logs",
//       "Real-time M-Pesa transaction matching (Zero manual entries)",
//       "Automated low-stock and rapid-depletion alerts",
//     ],
//     ctaText: "Explore Retail Systems",
//   },
//   {
//     id: "pharmacy",
//     slug: "pharmacy",
//     title: "Pharmacies & Chemists",
//     subtitle: "Protect margins with FEFO expiry tracking and batch control.",
//     badge: "Strict Compliance",
//     icon: Pill,
//     primaryMetric: { value: "100%", label: "Batch Expiry Visibility" },
//     painPoint: "Expired drug write-offs, supplier price inflation, and non-compliant prescription records.",
//     solution: "Tawala enforces First-Expired-First-Out (FEFO) dispensing and maintains accurate batch histories across all drug lines.",
//     keyFeatures: [
//       "Automated batch expiry warnings (90/60/30-day alerts)",
//       "Supplier cost fluctuation alerts to safeguard profit margins",
//       "Prescription logbook & controlled drug audit trail",
//       "Fractional unit sales (e.g., selling per strip or per tablet)",
//     ],
//     ctaText: "Explore Pharmacy Systems",
//   },
//   {
//     id: "hardware",
//     slug: "hardware",
//     title: "Hardware & Construction",
//     subtitle: "Manage bulk unit conversions, partial deliveries, and customer ledgers.",
//     badge: "Complex Ledger Control",
//     icon: Wrench,
//     primaryMetric: { value: "100%", label: "Credit Ledger Accuracy" },
//     painPoint: "Selling items in variable units (meters, bags, tons) and uncollected customer credit.",
//     solution: "Tawala seamlessly handles multi-unit inventory breakdowns and tracks customer credit limits with SMS delivery receipts.",
//     keyFeatures: [
//       "Dynamic unit conversions (e.g., Box → Bags → Kilograms)",
//       "Customer credit ledger limits with automated settlement terms",
//       "Partial dispatch tracking & site delivery receipt printing",
//       "Supplier purchase order generation & cost tracking",
//     ],
//     ctaText: "Explore Hardware Systems",
//   },
//   {
//     id: "wholesale",
//     slug: "wholesale",
//     title: "Wholesale & Distribution",
//     subtitle: "Synchronize multi-warehouse stock and empower sales reps.",
//     badge: "Multi-Store Enterprise",
//     icon: Truck,
//     primaryMetric: { value: "Real-Time", label: "Multi-Branch Stock Sync" },
//     painPoint: "Double-selling stock across warehouses and delayed field sales reporting.",
//     solution: "Tawala provides a unified multi-tenant command center for real-time inventory visibility across branches and mobile reps.",
//     keyFeatures: [
//       "Centralized multi-warehouse inventory transfer logs",
//       "Field rep mobile order booking with offline sync",
//       "Tiered wholesale pricing based on customer purchasing volume",
//       "High-volume M-Pesa & bank transfer reconciliation facade",
//     ],
//     ctaText: "Explore Distribution Systems",
//   },
// ];

// export default function SolutionsPage() {
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "ItemList",
//     "name": "Tawala Industry Business Management Solutions",
//     "description": "Multi-industry POS, inventory, and profit management solutions tailored for East African businesses.",
//     "itemListElement": INDUSTRIES.map((ind, idx) => ({
//       "@type": "ListItem",
//       "position": idx + 1,
//       "item": {
//         "@type": "Service",
//         "name": ind.title,
//         "description": ind.subtitle,
//         "provider": {
//           "@type": "Organization",
//           "name": "Tawala",
//         },
//         "url": `https://tawala.nethub.co.ke/solutions/${ind.slug}`,
//       },
//     })),
//   };

//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />

//       <main
//         id="main-content"
//         className="min-h-screen w-full bg-background text-foreground relative flex flex-col overflow-x-hidden selection:bg-brand-primary/20"
//       >
//         {/* =========================================================
//             SECTION 1: SOLUTIONS HERO & COMMERCIAL POSITIONING
//             ========================================================= */}
//         <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-20 relative z-10 text-center space-y-6">
//           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-mono font-bold mx-auto">
//             <Sparkles size={14} className="shrink-0" />
//             <span>Built for Kenyan Retailers, Pharmacists, & Wholesalers</span>
//           </div>

//           <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto">
//             Engineered for Your Industry. <br />
//             <span className="text-gradient">Tailored to Stop Leakage.</span>
//           </h1>

//           <p className="text-muted text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
//             One multi-tenant core engine. Dedicated workflows configured specifically for how your shop, pharmacy, hardware store, or distribution center actually operates.
//           </p>

//           {/* Quick Jump Buttons */}
//           <div className="pt-4 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
//             {INDUSTRIES.map((ind) => (
//               <a
//                 key={ind.id}
//                 href={`#${ind.id}`}
//                 className="px-4 py-2.5 rounded-xl bg-card hover:bg-surface border border-border/80 text-xs font-bold transition-all flex items-center gap-2 hover:border-brand-primary min-h-[44px]"
//               >
//                 <ind.icon size={15} className="text-brand-primary" />
//                 <span>{ind.title}</span>
//               </a>
//             ))}
//           </div>
//         </section>

//         {/* =========================================================
//             SECTION 2: INDUSTRY DEEP DIVE (COMMERCIAL PITCH CARDS)
//             ========================================================= */}
//         <section className="w-full py-12 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
//           {INDUSTRIES.map((ind, index) => {
//             const Icon = ind.icon;
//             const isEven = index % 2 === 0;

//             return (
//               <article
//                 key={ind.id}
//                 id={ind.id}
//                 className={`scroll-mt-28 bg-card rounded-3xl border border-border/80 shadow-xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
//                   !isEven ? "lg:bg-surface/40" : ""
//                 }`}
//               >
//                 {/* Text Content Column */}
//                 <div
//                   className={`space-y-6 lg:col-span-7 ${
//                     !isEven ? "lg:order-2" : "lg:order-1"
//                   }`}
//                 >
//                   <div className="flex flex-wrap items-center gap-3">
//                     <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
//                       <Icon size={20} />
//                     </div>
//                     <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-surface text-brand-secondary border border-border/50 uppercase">
//                       {ind.badge}
//                     </span>
//                   </div>

//                   <div>
//                     <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
//                       {ind.title}
//                     </h2>
//                     <p className="text-sm font-semibold text-brand-primary mt-1">
//                       {ind.subtitle}
//                     </p>
//                   </div>

//                   {/* Problem / Solution Callout */}
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
//                       <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase">
//                         <AlertTriangle size={14} />
//                         <span>The Revenue Leak</span>
//                       </div>
//                       <p className="text-xs text-muted leading-relaxed">
//                         {ind.painPoint}
//                       </p>
//                     </div>

//                     <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
//                       <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase">
//                         <ShieldCheck size={14} />
//                         <span>The Tawala Fix</span>
//                       </div>
//                       <p className="text-xs text-muted leading-relaxed">
//                         {ind.solution}
//                       </p>
//                     </div>
//                   </div>

//                   {/* Feature Checklist */}
//                   <div className="space-y-2 pt-2">
//                     <p className="text-xs font-mono font-bold uppercase text-muted tracking-wider">
//                       Tailored Industry Capabilities
//                     </p>
//                     <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//                       {ind.keyFeatures.map((feat, fIdx) => (
//                         <li
//                           key={fIdx}
//                           className="flex items-start gap-2 text-xs text-foreground font-medium"
//                         >
//                           <CheckCircle2
//                             size={15}
//                             className="text-brand-primary shrink-0 mt-0.5"
//                           />
//                           <span>{feat}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>

//                   {/* Action Link */}
//                   <div className="pt-2">
//                     <Link href={`/solutions/${ind.slug}`}>
//                       <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-primary hover:text-brand-secondary transition-colors cursor-pointer group min-h-[44px]">
//                         <span>{ind.ctaText}</span>
//                         <ChevronRight
//                           size={16}
//                           className="transition-transform group-hover:translate-x-1"
//                         />
//                       </span>
//                     </Link>
//                   </div>
//                 </div>

//                 {/* Metric Visual / Preview Hub Column */}
//                 <div
//                   className={`lg:col-span-5 w-full ${
//                     !isEven ? "lg:order-1" : "lg:order-2"
//                   }`}
//                 >
//                   <div className="bg-gradient-to-br from-foreground to-slate-900 rounded-2xl p-6 text-white space-y-6 shadow-2xl relative overflow-hidden border border-border/40">
//                     <div className="absolute top-0 right-0 p-8 bg-brand-primary/10 rounded-full blur-2xl pointer-events-none" />

//                     <div className="flex items-center justify-between border-b border-slate-800 pb-3">
//                       <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
//                         Proven Operational Impact
//                       </span>
//                       <Zap size={14} className="text-brand-secondary" />
//                     </div>

//                     <div className="space-y-1">
//                       <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-400">
//                         {ind.primaryMetric.value}
//                       </p>
//                       <p className="text-xs text-slate-300 font-medium">
//                         {ind.primaryMetric.label}
//                       </p>
//                     </div>

//                     <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
//                       <div className="flex items-center justify-between text-[11px]">
//                         <span className="text-slate-400 font-mono">
//                           Automation Status
//                         </span>
//                         <span className="text-emerald-400 font-bold">
//                           Active Sync
//                         </span>
//                       </div>
//                       <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
//                         <div className="bg-emerald-400 h-full w-full rounded-full animate-pulse" />
//                       </div>
//                     </div>

//                     <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
//                       <Clock size={12} className="text-brand-primary" />
//                       <span>Setup in under 5 minutes • Zero Hardware Needed</span>
//                     </div>
//                   </div>
//                 </div>
//               </article>
//             );
//           })}
//         </section>

//         {/* =========================================================
//             SECTION 3: COMPARISON MATRIX (REVENUE BLUEPRINT)
//             ========================================================= */}
//         <section className="w-full py-16 bg-surface/50 border-y border-border/60 relative z-10">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
//             <div className="text-center space-y-3 max-w-2xl mx-auto">
//               <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
//                 Why Tawala Outperforms Traditional POS Systems
//               </h2>
//               <p className="text-xs sm:text-sm text-muted">
//                 Built from the ground up for modern African multi-branch retail & distribution operations.
//               </p>
//             </div>

//             {/* Comparison Table */}
//             <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-lg">
//               <table className="w-full text-left border-collapse min-w-[640px]">
//                 <thead>
//                   <tr className="border-b border-border/60 bg-surface/80 text-[11px] font-mono uppercase tracking-wider text-muted">
//                     <th className="p-4 font-bold">Key Operational Capability</th>
//                     <th className="p-4 font-bold text-center">Manual / Exercise Books</th>
//                     <th className="p-4 font-bold text-center">Legacy Offline Desktop POS</th>
//                     <th className="p-4 font-bold text-center text-brand-primary bg-brand-primary/5">
//                       Tawala System
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-border/40 text-xs">
//                   <tr>
//                     <td className="p-4 font-bold text-foreground">Stock Theft Prevention</td>
//                     <td className="p-4 text-center text-rose-500 font-bold">None (High Risk)</td>
//                     <td className="p-4 text-center text-muted">Partial (Easy to bypass)</td>
//                     <td className="p-4 text-center font-bold text-emerald-500 bg-brand-primary/5">
//                       100% (PIN & Till Audit)
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="p-4 font-bold text-foreground">M-Pesa Auto-Reconciliation</td>
//                     <td className="p-4 text-center text-rose-500 font-bold">Manual SMS Copying</td>
//                     <td className="p-4 text-center text-rose-500 font-bold">Manual Entry</td>
//                     <td className="p-4 text-center font-bold text-emerald-500 bg-brand-primary/5">
//                       Instant Automated Matching
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="p-4 font-bold text-foreground">Remote Owner Visibility</td>
//                     <td className="p-4 text-center text-rose-500 font-bold">Only when present</td>
//                     <td className="p-4 text-center text-muted">End of day phone calls</td>
//                     <td className="p-4 text-center font-bold text-emerald-500 bg-brand-primary/5">
//                       24/7 Real-Time Phone Dashboard
//                     </td>
//                   </tr>
//                   <tr>
//                     <td className="p-4 font-bold text-foreground">Hardware Requirements</td>
//                     <td className="p-4 text-center text-muted">Paper books</td>
//                     <td className="p-4 text-center text-rose-500 font-bold">Expensive Servers/Computers</td>
//                     <td className="p-4 text-center font-bold text-emerald-500 bg-brand-primary/5">
//                       Any Existing Phone, Tablet, or PC
//                     </td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </section>

//         {/* =========================================================
//             SECTION 4: HIGH-CONVERSION CTA FOOTER STRIP
//             ========================================================= */}
//         <section className="w-full py-20 relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="bg-gradient-to-br from-card via-card to-brand-primary/10 rounded-3xl border border-brand-primary/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
//             <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
//               Transform Your Business Operations Today
//             </h2>
//             <p className="text-muted text-sm max-w-xl mx-auto">
//               Test Tawala in your shop for 14 days completely free. Start tracking profits and stopping stock loss in under 5 minutes.
//             </p>

//             <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
//               <Link
//                 href="/org"
//                 className="w-full sm:w-auto min-h-[48px] px-8 rounded-xl font-black uppercase text-xs tracking-wider bg-linear-to-r from-brand-primary to-brand-secondary text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-glow transition-all"
//               >
//                 <span>Start 14-Day Free Trial</span>
//                 <ArrowRight size={16} />
//               </Link>
//             </div>
//           </div>
//         </section>

//         {/* Localized Footer */}
//         <footer className="w-full border-t border-border/60 bg-surface/30 py-10 relative z-10">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
//             <p className="text-xs font-bold text-foreground">
//               Tawala • Multi-Tenant Business Platform
//             </p>
//             <p className="text-xs text-muted tabular-nums">
//               &copy; {new Date().getFullYear()} Tawala. All rights reserved.
//             </p>
//           </div>
//         </footer>
//       </main>
//     </>
//   );
// }

import { Metadata } from "next";
import Link from "next/link";
import {
  Store,
  Pill,
  Wrench,
  Truck,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Zap,
  Clock,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

/* =========================================================
   TECHNICAL SEO: METADATA ENGINE & CANONICAL LINKING
   ========================================================= */
export const metadata: Metadata = {
  title: "Solutions | Industry-Specific POS & Business Systems",
  description:
    "Manage retail shops, pharmacies, hardware stores, and wholesale distributors with Tawala. Stop stock leakages and track daily profits in real-time.",
  alternates: {
    canonical: "/solutions",
  },
  openGraph: {
    title: "Tawala Solutions | Industry-Specific POS & Business Systems",
    description:
      "Manage retail shops, pharmacies, hardware stores, and wholesale distributors with Tawala. Stop stock leakages and track daily profits in real-time.",
    url: "https://tawala.nethub.co.ke/solutions",
    type: "website",
  },
};

interface IndustryPitch {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  primaryMetric: { value: string; label: string };
  painPoint: string;
  solution: string;
  keyFeatures: string[];
  ctaText: string;
}

const INDUSTRIES: IndustryPitch[] = [
  {
    id: "retail",
    slug: "retail",
    title: "Retail & Minimarts",
    subtitle: "Stop stock leaks at the register and automate till reconciliation.",
    badge: "High Transaction Volume",
    icon: Store,
    primaryMetric: { value: "-98%", label: "Unaccounted Inventory Loss" },
    painPoint:
      "Unchecked cashier voids, unrecorded cash sales, and manual exercise book tracking.",
    solution:
      "Tawala ties every barcode scan directly to staff PIN logs and instantly reconciles M-Pesa Buy Goods & till balances.",
    keyFeatures: [
      "Sub-second barcode checkout on mobile, tablet, or PC",
      "Cashier PIN locks with detailed shift handover logs",
      "Real-time M-Pesa transaction matching (Zero manual entries)",
      "Automated low-stock and rapid-depletion alerts",
    ],
    ctaText: "Explore Retail Systems",
  },
  {
    id: "pharmacy",
    slug: "pharmacy",
    title: "Pharmacies & Chemists",
    subtitle: "Protect margins with FEFO expiry tracking and batch control.",
    badge: "Strict Compliance",
    icon: Pill,
    primaryMetric: { value: "100%", label: "Batch Expiry Visibility" },
    painPoint:
      "Expired drug write-offs, supplier price inflation, and non-compliant prescription records.",
    solution:
      "Tawala enforces First-Expired-First-Out (FEFO) dispensing and maintains accurate batch histories across all drug lines.",
    keyFeatures: [
      "Automated batch expiry warnings (90/60/30-day alerts)",
      "Supplier cost fluctuation alerts to safeguard profit margins",
      "Prescription logbook & controlled drug audit trail",
      "Fractional unit sales (e.g., selling per strip or per tablet)",
    ],
    ctaText: "Explore Pharmacy Systems",
  },
  {
    id: "hardware",
    slug: "hardware",
    title: "Hardware & Construction",
    subtitle:
      "Manage bulk unit conversions, partial deliveries, and customer ledgers.",
    badge: "Complex Ledger Control",
    icon: Wrench,
    primaryMetric: { value: "100%", label: "Credit Ledger Accuracy" },
    painPoint:
      "Selling items in variable units (meters, bags, tons) and uncollected customer credit.",
    solution:
      "Tawala seamlessly handles multi-unit inventory breakdowns and tracks customer credit limits with SMS delivery receipts.",
    keyFeatures: [
      "Dynamic unit conversions (e.g., Box → Bags → Kilograms)",
      "Customer credit ledger limits with automated settlement terms",
      "Partial dispatch tracking & site delivery receipt printing",
      "Supplier purchase order generation & cost tracking",
    ],
    ctaText: "Explore Hardware Systems",
  },
  {
    id: "wholesale",
    slug: "wholesale",
    title: "Wholesale & Distribution",
    subtitle: "Synchronize multi-warehouse stock and empower sales reps.",
    badge: "Multi-Store Enterprise",
    icon: Truck,
    primaryMetric: { value: "Real-Time", label: "Multi-Branch Stock Sync" },
    painPoint:
      "Double-selling stock across warehouses and delayed field sales reporting.",
    solution:
      "Tawala provides a unified multi-tenant command center for real-time inventory visibility across branches and mobile reps.",
    keyFeatures: [
      "Centralized multi-warehouse inventory transfer logs",
      "Field rep mobile order booking with offline sync",
      "Tiered wholesale pricing based on customer purchasing volume",
      "High-volume M-Pesa & bank transfer reconciliation facade",
    ],
    ctaText: "Explore Distribution Systems",
  },
];

/* =========================================================
   REACT SERVER COMPONENT (RSC) - ZERO CLIENT JS OVERHEAD
   ========================================================= */
export default function SolutionsPage() {
  /* Structured Data Generation for Search Engine Indexing (ItemList & Service Schema) */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Tawala Industry Business Management Solutions",
    description:
      "Multi-industry POS, inventory, and profit management solutions tailored for East African businesses.",
    itemListElement: INDUSTRIES.map((ind, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      item: {
        "@type": "Service",
        name: ind.title,
        description: ind.subtitle,
        provider: {
          "@type": "Organization",
          name: "Tawala",
        },
        url: `https://tawala.nethub.co.ke/solutions/${ind.slug}`,
      },
    })),
  };

  return (
    <>
      {/* Search Engine Structured Data Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://tawala.nethub.co.ke",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Solutions",
                item: "https://tawala.nethub.co.ke/solutions",
              },
            ],
          }),
        }}
      />

      <main
        id="main-content"
        className="min-h-screen w-full bg-background text-foreground relative flex flex-col overflow-x-hidden selection:bg-brand-primary/20"
      >
        {/* =========================================================
            SECTION 1: SOLUTIONS HERO & COMMERCIAL POSITIONING
            ========================================================= */}
        <section
          aria-label="Industry Solutions Overview"
          className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-20 md:pb-20 relative z-10 text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-mono font-bold mx-auto">
            <Sparkles size={14} className="shrink-0" />
            <span>Built for East African Retailers, Pharmacists, & Wholesalers</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Engineered for Your Industry. <br />
            <span className="text-gradient">Tailored to Stop Leakage.</span>
          </h1>

          <p className="text-muted text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            One multi-tenant core engine. Dedicated workflows configured specifically for how your shop, pharmacy, hardware store, or distribution center actually operates.
          </p>

          {/* Quick Jump Buttons (Fitts's Law Optimized Touch Targets) */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            {INDUSTRIES.map((ind) => {
              const Icon = ind.icon;
              return (
                <a
                  key={ind.id}
                  href={`#${ind.id}`}
                  className="px-4 py-2.5 rounded-xl bg-card hover:bg-surface border border-border/80 text-xs font-bold transition-all flex items-center gap-2 hover:border-brand-primary min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <Icon size={15} className="text-brand-primary" />
                  <span>{ind.title}</span>
                </a>
              );
            })}
          </div>
        </section>

        {/* =========================================================
            SECTION 2: INDUSTRY DEEP DIVE (COMMERCIAL PITCH CARDS)
            ========================================================= */}
        <section
          aria-label="Detailed Industry Capability Cards"
          className="w-full py-12 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16"
        >
          {INDUSTRIES.map((ind, index) => {
            const Icon = ind.icon;
            const isEven = index % 2 === 0;

            return (
              <article
                key={ind.id}
                id={ind.id}
                className={`scroll-mt-28 bg-card rounded-3xl border border-border/80 shadow-xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
                  !isEven ? "lg:bg-surface/40" : ""
                }`}
              >
                {/* Text Content Column */}
                <div
                  className={`space-y-6 lg:col-span-7 ${
                    !isEven ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                      <Icon size={20} />
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-surface text-brand-secondary border border-border/50 uppercase">
                      {ind.badge}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                      {ind.title}
                    </h2>
                    <p className="text-sm font-semibold text-brand-primary mt-1">
                      {ind.subtitle}
                    </p>
                  </div>

                  {/* Problem / Solution Callout Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase">
                        <AlertTriangle size={14} />
                        <span>The Revenue Leak</span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        {ind.painPoint}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase">
                        <ShieldCheck size={14} />
                        <span>The Tawala Fix</span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        {ind.solution}
                      </p>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-mono font-bold uppercase text-muted tracking-wider">
                      Tailored Industry Capabilities
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ind.keyFeatures.map((feat, fIdx) => (
                        <li
                          key={fIdx}
                          className="flex items-start gap-2 text-xs text-foreground font-medium"
                        >
                          <CheckCircle2
                            size={15}
                            className="text-brand-primary shrink-0 mt-0.5"
                          />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Link */}
                  <div className="pt-2">
                    <Link
                      href={`/solutions/${ind.slug}`}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-primary hover:text-brand-secondary transition-colors group min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-md"
                    >
                      <span>{ind.ctaText}</span>
                      <ChevronRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                </div>

                {/* Metric Visual / Preview Hub Column */}
                <div
                  className={`lg:col-span-5 w-full ${
                    !isEven ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <div className="bg-gradient-to-br from-foreground to-slate-900 rounded-2xl p-6 text-white space-y-6 shadow-2xl relative overflow-hidden border border-border/40">
                    <div className="absolute top-0 right-0 p-8 bg-brand-primary/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                        Proven Operational Impact
                      </span>
                      <Zap size={14} className="text-brand-secondary" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-400">
                        {ind.primaryMetric.value}
                      </p>
                      <p className="text-xs text-slate-300 font-medium">
                        {ind.primaryMetric.label}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-mono">
                          Automation Status
                        </span>
                        <span className="text-emerald-400 font-bold">
                          Active Sync
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full w-full rounded-full animate-pulse" />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <Clock size={12} className="text-brand-primary" />
                      <span>Setup in under 5 minutes • Zero Hardware Needed</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {/* =========================================================
            SECTION 3: COMPARISON MATRIX (REVENUE BLUEPRINT)
            ========================================================= */}
        <section
          aria-label="Competitive Advantage Matrix"
          className="w-full py-16 bg-surface/50 border-y border-border/60 relative z-10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                Why Tawala Outperforms Traditional POS Systems
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Built from the ground up for modern African multi-branch retail & distribution operations.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-lg">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-border/60 bg-surface/80 text-[11px] font-mono uppercase tracking-wider text-muted">
                    <th scope="col" className="p-4 font-bold">
                      Key Operational Capability
                    </th>
                    <th scope="col" className="p-4 font-bold text-center">
                      Manual / Exercise Books
                    </th>
                    <th scope="col" className="p-4 font-bold text-center">
                      Legacy Offline Desktop POS
                    </th>
                    <th
                      scope="col"
                      className="p-4 font-bold text-center text-brand-primary bg-brand-primary/5"
                    >
                      Tawala System
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-xs">
                  <tr>
                    <td className="p-4 font-bold text-foreground">
                      Stock Theft Prevention
                    </td>
                    <td className="p-4 text-center text-rose-500 font-bold">
                      None (High Risk)
                    </td>
                    <td className="p-4 text-center text-muted">
                      Partial (Easy to bypass)
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-500 bg-brand-primary/5">
                      100% (PIN & Till Audit)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-foreground">
                      M-Pesa Auto-Reconciliation
                    </td>
                    <td className="p-4 text-center text-rose-500 font-bold">
                      Manual SMS Copying
                    </td>
                    <td className="p-4 text-center text-rose-500 font-bold">
                      Manual Entry
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-500 bg-brand-primary/5">
                      Instant Automated Matching
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-foreground">
                      Remote Owner Visibility
                    </td>
                    <td className="p-4 text-center text-rose-500 font-bold">
                      Only when present
                    </td>
                    <td className="p-4 text-center text-muted">
                      End of day phone calls
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-500 bg-brand-primary/5">
                      24/7 Real-Time Phone Dashboard
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-foreground">
                      Hardware Requirements
                    </td>
                    <td className="p-4 text-center text-muted">Paper books</td>
                    <td className="p-4 text-center text-rose-500 font-bold">
                      Expensive Servers/Computers
                    </td>
                    <td className="p-4 text-center font-bold text-emerald-500 bg-brand-primary/5">
                      Any Existing Phone, Tablet, or PC
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 4: HIGH-CONVERSION CTA FOOTER STRIP
            ========================================================= */}
        <section
          aria-label="Call to Action"
          className="w-full py-20 relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="bg-gradient-to-br from-card via-card to-brand-primary/10 rounded-3xl border border-brand-primary/30 p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Transform Your Business Operations Today
            </h2>
            <p className="text-muted text-sm max-w-xl mx-auto">
              Test Tawala in your shop for 14 days completely free. Start tracking profits and stopping stock loss in under 5 minutes.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/org"
                className="w-full sm:w-auto min-h-[48px] px-8 rounded-xl font-black uppercase text-xs tracking-wider bg-gradient-to-r from-brand-primary to-brand-secondary text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-glow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Localized Footer Landmark */}
        <footer className="w-full border-t border-border/60 bg-surface/30 py-10 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-foreground">
              Tawala • Multi-Tenant Business Platform
            </p>
            <p className="text-xs text-muted tabular-nums">
              &copy; {new Date().getFullYear()} Tawala. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}