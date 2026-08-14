
// import { Metadata } from "next";
// import Link from "next/link";
// import { Button } from "@/lib/components/ui/Button";
// import { 
//   ArrowRight, 
//   CheckCircle2, 
//   Package,
//   Activity,
//   Smile,
//   Zap,
//   Users,
//   Store,
//   ShieldCheck,
//   TrendingUp,
//   HelpCircle
// } from "lucide-react";

// export const metadata: Metadata = {
//   title: "Tawala Platform | Track Profit & Stop Business Theft",
//   description: "Ditch messy notebooks. Tawala helps Kenyan shops track counter sales, eliminate stock guesswork, and see daily net profits clearly.",
//   alternates: {
//     canonical: "https://tawala.io",
//   },
// };

// export default function LandingPage() {
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "SoftwareApplication",
//     "name": "Tawala Platform",
//     "applicationCategory": "BusinessApplication",
//     "operatingSystem": "Windows, macOS, Linux, Web",
//     "description": "A simple business management platform for Kenyan shop owners to track sales, manage inventory, and view daily net profits.",
//     "offers": {
//       "@type": "Offer",
//       "price": "0",
//       "priceCurrency": "KES",
//     },
//   };

//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />
      
//       {/* Primary Semantic Landmark */}
//       <main id="main-content" className="min-h-screen w-full bg-background text-foreground relative flex flex-col overflow-x-hidden selection:bg-brand-primary/20">

//         {/* =========================================================
//             SECTION 1: HERO SECTION (Value-Focused Result Framework)
//         ========================================================= */}
//         <section className="w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 ">
//           <div className="lg:col-span-5 flex flex-col space-y-6">
//             <div className="space-y-4">
//               <h1 className="text-h1 text-gradient tracking-tight leading-tight font-bold">
//                 Tawala Biashara Yako <br />
//                 <span className="text-brand-primary">Bila Stress.</span>
//               </h1>
//             </div>

//             <p className="text-muted text-base leading-relaxed max-w-xl">
//               Stop relying on messy exercise books and disappearing calculator history. Tawala gives retail shops, minimarts, pharmacies, and hardwares an easy way to stop stock leakages, hold counter staff accountable, and see real daily profits.
//             </p>

//             <div className="flex flex-col sm:flex-row gap-4 pt-2">
//               <Link href="/billing" className="w-full sm:w-auto">
//                 <Button variant="primary" size="lg" className="w-full sm:min-w-55 min-h-[44px]">
//                   Start Free 14-Day Trial
//                   <ArrowRight size={14} className="ml-1" aria-hidden="true" />
//                 </Button>
//               </Link>
//               <Link href="/features" className="w-full sm:w-auto">
//                 <Button variant="outline" size="lg" className="w-full min-h-[44px]">
//                   See How It Works
//                 </Button>
//               </Link>
//             </div>
//           </div>

//           {/* Interactive Mockup Component: Redesigned around Real Operational Results */}
//           <div className="lg:col-span-7 w-full flex items-center justify-center relative">
//             <div className="w-full max-w-2xl bg-card rounded-2xl border border-border/60 shadow-lift overflow-hidden flex flex-col">
              
//               {/* Browser/App Header */}
//               <div className="px-4 py-3 bg-surface border-b border-border/60 flex items-center justify-between shrink-0">
//                 <div className="flex items-center gap-1.5">
//                   <div className="h-2.5 w-2.5 rounded-full bg-brand-primary/40" />
//                   <div className="h-2.5 w-2.5 rounded-full bg-brand-secondary/40" />
//                   <div className="h-2.5 w-2.5 rounded-full bg-brand-accent/40" />
//                 </div>
//                 <div className="px-3 py-0.5 bg-background border border-border/60 rounded-lg text-[11px] text-muted font-mono flex items-center gap-1.5 w-56 justify-center shadow-inner">
//                   <ShieldCheck size={10} className="text-brand-accent shrink-0" /> my.tawala.shop
//                 </div>
//                 <div className="w-6" />
//               </div>

//               {/* Mockup Dashboard Content */}
//               <div className="p-6 flex flex-col space-y-4 bg-gradient-to-br from-brand-primary/[0.01] to-transparent">
//                 <div className="grid grid-cols-3 gap-3">
//                   <div className="p-3 bg-surface border border-border/40 rounded-xl">
//                     <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">Cashier Desk</span>
//                     <span className="text-xs font-bold text-foreground block truncate mt-0.5">Staff PIN Active</span>
//                   </div>
//                   <div className="p-3 bg-surface border border-border/40 rounded-xl">
//                     <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">Stock Health</span>
//                     <span className="text-xs font-bold text-brand-secondary block truncate mt-0.5">Zero Guesswork</span>
//                   </div>
//                   <div className="p-3 bg-surface border border-border/40 rounded-xl">
//                     <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">Drawer Safety</span>
//                     <span className="text-xs font-bold text-brand-accent flex items-center gap-1 mt-0.5 truncate">
//                       <TrendingUp size={12} /> Cash Balanced
//                     </span>
//                   </div>
//                 </div>

//                 <div className="border border-dashed border-border/80 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2 bg-surface/20">
//                   <div className="h-10 w-10 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center border border-brand-accent/20 shadow-inner">
//                     <Smile size={18} />
//                   </div>
//                   <div>
//                     <h3 className="text-sm font-bold text-foreground">Your Financial Control Center</h3>
//                     <p className="text-xs text-muted max-w-xs mt-1 leading-normal">
//                       No missing pages from sales books, no hidden pricing errors, and zero calculator headaches.
//                     </p>
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   <div className="p-3 bg-background border border-border/60 rounded-xl flex items-center justify-between text-xs font-bold text-foreground shadow-sm">
//                     <div className="flex items-center gap-2 truncate">
//                       <CheckCircle2 size={14} className="text-brand-accent shrink-0" />
//                       <span className="truncate">Low Stock Warning: 3 fast-moving items need restocking</span>
//                     </div>
//                     <span className="text-[9px] bg-brand-secondary/10 text-brand-secondary font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Alert</span>
//                   </div>

//                   <div className="p-4 bg-foreground text-background rounded-xl flex items-center justify-between bg-gradient-to-r from-foreground to-slate-900 shadow-lift">
//                     <div className="space-y-1">
//                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Net Profit Calculated (Today)</p>
//                       <p className="text-lg font-bold font-mono tracking-tight text-white leading-none pt-1">KES 14,820.00</p>
//                     </div>
//                     <Link href="#pricing">
//                       <Button variant="secondary" size="sm" className="min-h-[32px]">
//                         See Plans
//                       </Button>
//                     </Link>
//                   </div>
//                 </div>
//               </div>

//             </div>
//           </div>
//         </section>

//         {/* =========================================================
//             SECTION 2: CORE BENEFITS MATRIX (Value & Outcome First)
//         ========================================================= */}
//         <section id="features" className="w-full bg-surface/50 border-y border-border/50 py-20 relative z-10">
//           <div className="max-w-7xl mx-auto px-6 lg:px-8">
//             <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
//               <h2 className="text-h2 font-bold tracking-tight text-foreground">
//                 From Manual Hustle to Organized Profit
//               </h2>
//               <p className="text-muted text-sm sm:text-base">
//                 Running a biashara in Kenya demands complete visibility. We eliminate the operational leakages so you keep more money in your pocket.
//               </p>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//               <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm space-y-4">
//                 <div className="h-10 w-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
//                   <Zap size={20} />
//                 </div>
//                 <h3 className="text-lg font-bold text-foreground">Fast Counter Sales</h3>
//                 <p className="text-xs text-muted leading-relaxed">
//                   Record counter trades instantly. Perfectly adapted to track Cash, M-Pesa statements, and Customer Credit sales without slowing down your line.
//                 </p>
//               </div>

//               <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm space-y-4">
//                 <div className="h-10 w-10 bg-brand-secondary/10 rounded-xl flex items-center justify-center text-brand-secondary">
//                   <Package size={20} />
//                 </div>
//                 <h3 className="text-lg font-bold text-foreground">Stop Stock Leakages</h3>
//                 <p className="text-xs text-muted leading-relaxed">
//                   Real-time item deduction counts. Get immediate dashboard metrics for low-performing counts and warning flags before fast-moving products run out unexpectedly.
//                 </p>
//               </div>

//               <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm space-y-4">
//                 <div className="h-10 w-10 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent">
//                   <Users size={20} />
//                 </div>
//                 <h3 className="text-lg font-bold text-foreground">Total Staff Accountability</h3>
//                 <p className="text-xs text-muted leading-relaxed">
//                   Stop cash disappearing from the drawer. Enforce instant 4-digit PIN access on shared phones or desktop monitors so every sales record is linked to the right employee.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* =========================================================
//             SECTION 3: THREE-TIER PRICING ARCHITECTURE (Strict Spec Gating)
//         ========================================================= */}
//         <section id="pricing" className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative z-10">
//           <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
//             <h2 className="text-h2 font-bold tracking-tight text-foreground">
//               Simple Pricing. No Hidden Rules.
//             </h2>
//             <p className="text-muted text-sm sm:text-base">
//               All configurations start with a full 14-day trial of our standard Ndovu tier features.
//             </p>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
//             {/* Basic Plan */}
//             <div className="bg-card p-8 rounded-2xl border border-border/60 shadow-sm flex flex-col justify-between min-h-[480px]">
//               <div className="space-y-6">
//                 <div>
//                   <h3 className="text-lg font-bold text-foreground">Basic Plan</h3>
//                   <p className="text-xs text-muted mt-1">Single shop starters transitioning from paper records.</p>
//                 </div>
//                 <div className="pt-2">
//                   <span className="text-3xl font-bold font-mono text-foreground">KSh 1,490</span>
//                   <span className="text-xs text-muted font-medium"> / month</span>
//                 </div>
//                 <div className="border-t border-border/60 pt-6 space-y-3">
//                   <div className="flex items-center gap-2.5 text-xs text-muted">
//                     <CheckCircle2 size={14} className="text-brand-primary shrink-0" /> 1 Shop Location Max
//                   </div>
//                   <div className="flex items-center gap-2.5 text-xs text-muted">
//                     <CheckCircle2 size={14} className="text-brand-primary shrink-0" /> Up to 3 Staff Accounts
//                   </div>
//                   <div className="flex items-center gap-2.5 text-xs text-muted">
//                     <CheckCircle2 size={14} className="text-brand-primary shrink-0" /> 300 Products Catalog Capacity
//                   </div>
//                   <div className="flex items-center gap-2.5 text-xs text-muted">
//                     <CheckCircle2 size={14} className="text-brand-primary shrink-0" /> Daily Sales Summary Reports
//                   </div>
//                 </div>
//               </div>
//               <Link href="/org" className="pt-8 block">
//                 <Button variant="outline" size="md" className="w-full min-h-[40px]">Select Basic</Button>
//               </Link>
//             </div>

//             {/* Ndovu Plan (Featured) */}
//             <div className="bg-card p-8 rounded-2xl border-2 border-brand-primary shadow-lift relative flex flex-col justify-between min-h-[520px] lg:-translate-y-4">
//               <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
//                 Recommended
//               </div>
//               <div className="space-y-6">
//                 <div>
//                   <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
//                     <Store size={18} className="text-brand-primary" /> Ndovu Plan
//                   </h3>
//                   <p className="text-xs text-muted mt-1">Growing businesses managing multiple branches.</p>
//                 </div>
//                 <div className="pt-2">
//                   <span className="text-4xl font-bold font-mono text-foreground">KSh 3,990</span>
//                   <span className="text-xs text-muted font-medium"> / month</span>
//                 </div>
//                 <div className="border-t border-brand-primary/20 pt-6 space-y-3">
//                   <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
//                     <CheckCircle2 size={14} className="text-brand-accent shrink-0" /> Up to 5 Branch Operations
//                   </div>
//                   <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
//                     <CheckCircle2 size={14} className="text-brand-accent shrink-0" /> Unlimited Counter Staff Accounts
//                   </div>
//                   <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
//                     <CheckCircle2 size={14} className="text-brand-accent shrink-0" /> 5,000 Products Capacity
//                   </div>
//                   <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
//                     <CheckCircle2 size={14} className="text-brand-accent shrink-0" /> Full Inventory with Low Stock Alerts
//                   </div>
//                   <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
//                     <CheckCircle2 size={14} className="text-brand-accent shrink-0" /> Complete Profit & Loss Insight
//                   </div>
//                 </div>
//               </div>
//               <Link href="/org" className="pt-8 block">
//                 <Button variant="primary" size="lg" className="w-full min-h-[44px]">Get Started Now</Button>
//               </Link>
//             </div>

//             {/* Enterprise Plan */}
//             <div className="bg-card p-8 rounded-2xl border border-border/60 shadow-sm flex flex-col justify-between min-h-[480px]">
//               <div className="space-y-6">
//                 <div>
//                   <h3 className="text-lg font-bold text-foreground">Enterprise Plan</h3>
//                   <p className="text-xs text-muted mt-1">Wholesalers, large teams, and complex operations.</p>
//                 </div>
//                 <div className="pt-2">
//                   <span className="text-3xl font-bold font-mono text-foreground">KSh 9,990+</span>
//                   <span className="text-xs text-muted font-medium"> / month</span>
//                 </div>
//                 <div className="border-t border-border/60 pt-6 space-y-3">
//                   <div className="flex items-center gap-2.5 text-xs text-muted">
//                     <CheckCircle2 size={14} className="text-brand-secondary shrink-0" /> Unlimited Shops & Locations
//                   </div>
//                   <div className="flex items-center gap-2.5 text-xs text-muted">
//                     <CheckCircle2 size={14} className="text-brand-secondary shrink-0" /> Supplier Management & Purchase Orders
//                   </div>
//                   <div className="flex items-center gap-2.5 text-xs text-muted">
//                     <CheckCircle2 size={14} className="text-brand-secondary shrink-0" /> Advanced Operations Perms & Audit Trails
//                   </div>
//                   <div className="flex items-center gap-2.5 text-xs text-muted">
//                     <CheckCircle2 size={14} className="text-brand-secondary shrink-0" /> Dedicated Local Onboarding Support
//                   </div>
//                 </div>
//               </div>
//               <Link href="mailto:support@tawala.io" className="pt-8 block">
//                 <Button variant="outline" size="md" className="w-full min-h-[40px]">Contact Sales</Button>
//               </Link>
//             </div>

//           </div>
//         </section>

//         {/* =========================================================
//             SECTION 4: LOCAL TRUST FOOTER
//         ========================================================= */}
//         <footer className="w-full border-t border-border/60 bg-surface/30 py-12 relative z-10">
//           <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
//             <div className="space-y-1 text-center sm:text-left">
//               <p className="text-sm font-bold text-foreground">Tawala Platform</p>
//               <p className="text-xs text-muted">Tawala biashara yako. Take control of your business.</p>
//             </div>
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
import { Button } from "@/lib/components/ui/Button";
import {
  ArrowRight,
  CheckCircle2,
  Package,
  Zap,
  Users,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  Smartphone,
  ChevronRight,
  Building2,
  Lock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tawala | Stop Shop Leakages & Track Daily Profits",
  description: "Eliminate stock leakages, hold staff accountable, and see real daily net profits in real-time. Built specifically for retail shops, minimarts, and pharmacies.",
  alternates: {
    canonical: "https://tawala.io",
  },
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Tawala Platform",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, Android, iOS, Windows",
    "description": "Enterprise business management platform for retail shop owners to stop stock leakages, manage inventory, and view daily net profits.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KES",
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Primary Semantic Landmark */}
      <main
        id="main-content"
        className="min-h-screen w-full bg-background text-foreground relative flex flex-col overflow-x-hidden selection:bg-brand-primary/20"
      >
        {/* =========================================================
            SECTION 1: HIGH-CONVERSION HERO SECTION 
            ========================================================= */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 md:pt-16 md:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* LEFT COLUMN: PUNCHY CONVERSION-DRIVEN VALUE PROP */}
          <div className="lg:col-span-6 flex flex-col space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-mono font-bold w-fit">
              <Sparkles size={14} className="shrink-0" />
              <span>Zero Hardware Required • Works on Any Phone or PC</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.15] font-black text-foreground">
                Tawala Biashara Yako <br />
                <span className="text-gradient">Bila Stress na Leakage.</span>
              </h1>
            </div>

            <p className="text-muted text-sm sm:text-base leading-relaxed max-w-xl">
              Stop relying on easily lost exercise books and unverified cash counters. Tawala gives retail shop owners complete control—track counter sales, block stock theft, and instantly calculate your true daily net profit.
            </p>

            {/* DIRECT CALL-TO-ACTION CLUSTER */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/org" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:min-w-[220px] min-h-[48px] font-black uppercase text-xs tracking-wider bg-linear-to-r from-brand-primary to-brand-secondary text-white border-none shadow-lg hover:shadow-glow transition-all duration-300 rounded-xl flex items-center justify-center gap-2"
                >
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </Link>
              <Link href="#how-it-works" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-h-[48px] font-bold text-xs uppercase tracking-wider rounded-xl border-border/80 hover:bg-card"
                >
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* LOCALIZED TRUST BADGES */}
            <div className="pt-4 border-t border-border/40 grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium text-muted">No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium text-muted">5-Min Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium text-muted">M-Pesa Ready</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: FLUID BUSINESS CONTROL HUB (REPLACING POS TERMINAL) */}
          <div className="lg:col-span-6 w-full relative">
            {/* Background Glow Effect */}
            <div className="absolute -inset-1 bg-linear-to-r from-brand-primary/20 via-brand-secondary/20 to-brand-accent/20 rounded-3xl blur-2xl opacity-70 pointer-events-none" />

            <div className="relative bg-card/90 backdrop-blur-xl rounded-2xl border border-border/80 shadow-2xl p-5 sm:p-6 space-y-4">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">
                    Live Shop Command
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-surface text-muted border border-border/40">
                  Today's Ledger
                </span>
              </div>

              {/* Metric Card 1: Real-time Profit Calculation */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-foreground to-slate-900 text-white shadow-md flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Net Profit (After Expenses)
                  </p>
                  <p className="text-2xl font-black font-mono tracking-tight text-emerald-400 mt-1">
                    KES 18,450.00
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <TrendingUp size={20} />
                </div>
              </div>

              {/* Dynamic Alerts Strip */}
              <div className="space-y-2">
                {/* Stock Leak Warning */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Stock Audit Discrepancy Flagged
                      </p>
                      <p className="text-[10px] text-muted">
                        2 units Cooking Oil unaccounted for at Shift Handover.
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 uppercase">
                    Flagged
                  </span>
                </div>

                {/* Staff PIN Activity */}
                <div className="p-3 rounded-xl bg-surface border border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className="text-brand-primary shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Counter Staff Accountable
                      </p>
                      <p className="text-[10px] text-muted">
                        Staff PIN: #204 (John) • Till Balance Verified
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-500">
                    100% Match
                  </span>
                </div>
              </div>

              {/* Quick Action Trigger */}
              <div className="pt-2">
                <Link
                  href="/org"
                  className="w-full p-3 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/15 border border-brand-primary/20 flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-brand-primary" />
                    <span className="text-xs font-bold text-foreground">
                      Test Your Shop Metrics In 60 Seconds
                    </span>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-brand-primary transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>

            </div>
          </div>

        </section>

        {/* =========================================================
            SECTION 2: PROOF & IMPACT METRICS STRIP
            ========================================================= */}
        <section className="w-full border-y border-border/50 bg-surface/50 py-10 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black font-mono text-gradient">
                KES 0
              </p>
              <p className="text-xs text-muted font-medium">Unaccounted Stock Loss</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black font-mono text-foreground">
                100%
              </p>
              <p className="text-xs text-muted font-medium">M-Pesa Reconciliation</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black font-mono text-brand-secondary">
                &lt; 3 Secs
              </p>
              <p className="text-xs text-muted font-medium">Counter Sale Record</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black font-mono text-brand-accent">
                24 / 7
              </p>
              <p className="text-xs text-muted font-medium">Remote Owner Visibility</p>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 3: CORE VALUE & OPERATIONAL OUTCOMES
            ========================================================= */}
        <section
          id="how-it-works"
          className="w-full py-20 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Designed to Protect Every Shilling
            </h2>
            <p className="text-muted text-sm sm:text-base">
              No complex setups. Tawala transforms your daily operations into a simple, airtight system you can access from your phone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-11 w-11 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                  <Smartphone size={22} />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Lightning Fast Counter Sales
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Record trades in seconds using standard Android phones or laptops. Seamlessly categorizes Cash, M-Pesa Buy Goods, and Customer Store Credit.
                </p>
              </div>
              <div className="pt-2 border-t border-border/30 flex items-center gap-1.5 text-[11px] font-bold text-brand-primary">
                <CheckCircle2 size={13} />
                <span>Zero Counter Delays</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-11 w-11 bg-brand-secondary/10 rounded-xl flex items-center justify-center text-brand-secondary">
                  <Package size={22} />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Automatic Stock Leak Block
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Every sale immediately reduces inventory counts. Receive instant alerts when fast-moving stock gets low or when inventory numbers mismatch staff entries.
                </p>
              </div>
              <div className="pt-2 border-t border-border/30 flex items-center gap-1.5 text-[11px] font-bold text-brand-secondary">
                <CheckCircle2 size={13} />
                <span>Instant Expiry & Low Stock Alerts</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-11 w-11 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent">
                  <Users size={22} />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Staff PIN Accountability
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Enforce quick 4-digit PIN locks for shared phones at the counter. Every sale, discount, or canceled receipt is logged directly to the active employee.
                </p>
              </div>
              <div className="pt-2 border-t border-border/30 flex items-center gap-1.5 text-[11px] font-bold text-brand-accent">
                <CheckCircle2 size={13} />
                <span>Full Audit Trail</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 4: HIGH-CONVERSION TRIAL CTA (REPLACING PRICING PLANS)
            ========================================================= */}
        <section className="w-full py-20 bg-surface/50 border-t border-border/60 relative z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-card via-card to-brand-primary/5 rounded-3xl border border-brand-primary/30 p-8 sm:p-12 shadow-xl relative overflow-hidden text-center space-y-8">
              
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                  <Clock size={14} />
                  <span>Setup takes less than 5 minutes</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  Ready to Stop Losing Money in Your Shop?
                </h2>

                <p className="text-muted text-sm sm:text-base leading-relaxed">
                  Join hundreds of shop owners across Kenya who have transitioned from manual notebooks to total financial clarity.
                </p>
              </div>

              {/* CONVERSION FORM / DIRECT LEAD ACTION */}
              <div className="max-w-md mx-auto space-y-4">
                <Link href="/org" className="block w-full">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full h-14 font-black uppercase text-xs tracking-widest bg-linear-to-r from-brand-primary to-brand-secondary text-white border-none shadow-xl hover:shadow-glow transition-all duration-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Start 14-Day Free Trial Now</span>
                    <ArrowRight size={18} />
                  </Button>
                </Link>

                <p className="text-[11px] text-muted flex items-center justify-center gap-2">
                  <Lock size={12} className="text-brand-primary" />
                  <span>No credit card required. Full access to all features.</span>
                </p>
              </div>

              {/* GUARANTEE STRIP */}
              <div className="pt-6 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
                <div className="flex items-start gap-2.5">
                  <Building2 size={18} className="text-brand-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Multi-Branch Ready</p>
                    <p className="text-[11px] text-muted">Manage 1 or 10 shops from one login.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Smartphone size={18} className="text-brand-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Works On Any Device</p>
                    <p className="text-[11px] text-muted">Use existing smartphones, tablets, or PCs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-brand-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Local Support</p>
                    <p className="text-[11px] text-muted">Dedicated Kenyan onboarding assistance.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 5: LOCALIZED TRUST FOOTER
            ========================================================= */}
        <footer className="w-full border-t border-border/60 bg-surface/30 py-12 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-sm font-bold text-foreground">Tawala Platform</p>
              <p className="text-xs text-muted">
                Tawala biashara yako. Take total control of your business profits.
              </p>
            </div>
            <p className="text-xs text-muted tabular-nums">
              &copy; {new Date().getFullYear()} Tawala Enterprise. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}