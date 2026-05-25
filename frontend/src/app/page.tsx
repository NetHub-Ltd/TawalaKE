// // app/page.tsx
// import { Metadata } from "next";
// import Link from "next/link";
// import Header from "@/lib/components/Header"; // Kept completely intact as requested
// import Button from "@/lib/components/ui/Button"; // Kept completely intact as requested
// import { 
//   ArrowRight, 
//   Sparkles, 
//   CheckCircle2, 
//   TrendingUp, 
//   ShieldCheck, 
//   Package,
//   Activity,
//   Smile,
//   Heart
// } from "lucide-react";

// export const metadata: Metadata = {
//   title: "Tawala Platform | From Hustle to Structure",
//   description:
//     "Ditch the messy notebooks and hidden storefront leakages. Tawala transforms retail confusion into a calm, organized digital partner built around Kenyan biashara workflows.",
//   alternates: {
//     canonical: "/",
//   },
// };

// export default function LandingPage() {
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "SoftwareApplication",
//     name: "Tawala Platform",
//     applicationCategory: "BusinessApplication",
//     operatingSystem: "Windows, macOS, Linux, Web",
//     description:
//       "A calm, intuitive business partner for Kenyan shop owners to track counter sales, eliminate stock guesswork, and see daily net profits.",
//     offers: {
//       "@type": "Offer",
//       price: "0",
//       priceCurrency: "KES",
//     },
//   };

//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />

//       {/* Screen-bounded container: Absolutely zero vertical or horizontal scrolling with an ultra-soft, friendly ambient environment */}
//       <main className="h-screen w-full bg-[#fafbfc] text-[#2d3142] overflow-hidden relative flex flex-col p-4 lg:p-8 selection:bg-primary/20">
        
//         {/* Soft, charming ambient marketing glows to reduce contrast fatigue and set a visual rhythm */}
//         <div className="absolute top-[-5%] right-[-5%] w-[450px] h-[450px] bg-[#f0f3ff] rounded-full blur-[100px] pointer-events-none animate-pulse duration-[8s]" aria-hidden="true" />
//         <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] bg-[#fff0f2] rounded-full blur-[90px] pointer-events-none animate-pulse duration-[6s]" aria-hidden="true" />

//         {/* HOMEPAGE DEDICATED SERVER HEADER */}
//         <Header />

//         {/* CORE APPLICATION ZONE */}
//         <div id="main-content" className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center min-h-0 py-4 outline-none relative z-10">
          
//           {/* LEFT COMPONENT: HUMAN-CENTRIC CONVERSION ENGINE */}
//           <section className="lg:col-span-6 flex flex-col space-y-6 lg:space-y-8 justify-center min-h-0" aria-labelledby="hero-heading">
            
//             <div className="space-y-4">
//               {/* Playful greeting pill to instantly establish local connection */}
//               <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-3.5 py-1 rounded-full w-fit">
//                 <Sparkles size={13} className="text-primary animate-spin duration-1000" aria-hidden="true" />
//                 <span className="text-[10px] font-black uppercase tracking-wider text-primary">
//                   Built For Your Biashara
//                 </span>
//               </div>

//               <h1 id="hero-heading" className="text-3xl xl:text-[3.5rem] tracking-tight leading-[1.12] text-[#1e2229] font-black">
//                 Tawala Biashara Yako <br />
//                 <span className="text-primary bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text">
//                   Bila Stress.
//                 </span>
//               </h1>
//             </div>

//             <p className="text-[#5c6479] text-xs xl:text-base font-medium leading-relaxed max-w-xl">
//               Running a physical shop shouldn&apos;t mean staying up late calculating matching carbon-copy totals in an exercise notebook. Tawala gives you absolute control over your cash, stock levels, and staff shifts right from your pocket phone.
//             </p>

//             {/* Playful, value-driven outcome cards instead of sterile technical modules */}
//             <div className="grid grid-cols-2 gap-4 max-w-lg bg-white border border-slate-100 p-4 rounded-[1.5rem] shadow-soft relative overflow-hidden">
//               <div className="space-y-1.5 relative z-10">
//                 <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-wider">
//                   <div className="p-1 bg-blue-50 rounded-lg"><Package size={14} aria-hidden="true" /></div> 
//                   Shelves Balanced
//                 </div>
//                 <p className="text-[11px] font-medium text-[#7d859a] leading-relaxed">Know exactly what is running low without manual counting.</p>
//               </div>
//               <div className="space-y-1.5 relative z-10">
//                 <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
//                   <div className="p-1 bg-emerald-50 rounded-lg"><TrendingUp size={14} aria-hidden="true" /></div> 
//                   Clear Profit Lines
//                 </div>
//                 <p className="text-[11px] font-medium text-[#7d859a] leading-relaxed">See true operational net profit margins instantly every evening.</p>
//               </div>
//             </div>

//             {/* Conversational Action Elements with soft curves */}
//             <div className="flex flex-col sm:flex-row gap-4 pt-1">
//               <Link
//                 href="/terminal"
//                 className="group flex h-14 min-w-[240px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-white shadow-md hover:bg-primary/95 hover:shadow-lg transition-all duration-200"
//               >
//                 Launch Your System Now
//                 <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden="true" />
//               </Link>
              
//               <Link
//                 href="/features"
//                 className="flex h-14 px-6 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
//               >
//                 See How It Simplifies Life
//               </Link>
//             </div>
//           </section>

//           {/* RIGHT COMPONENT: PLAYFUL CLIENT-DASHBOARD LANDSCAPE VIEW */}
//           <div className="lg:col-span-6 relative w-full h-full flex items-center justify-center min-h-0" aria-hidden="true">
//             <div className="w-full max-w-2xl bg-white rounded-[2rem] border border-slate-100 shadow-soft overflow-hidden flex flex-col h-[88%] max-h-[500px] transform hover:scale-[1.005] transition-transform duration-300">
              
//               {/* Soft Simulated Browser Tab Layer */}
//               <div className="px-5 py-3 bg-[#fafbfc] border-b border-slate-100 flex items-center justify-between shrink-0">
//                 <div className="flex items-center gap-1.5">
//                   <div className="h-2.5 w-2.5 rounded-full bg-rose-300/70" />
//                   <div className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
//                   <div className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
//                 </div>
//                 <div className="px-4 py-1 bg-white border border-slate-100 rounded-xl text-[10px] text-slate-400 font-medium tracking-tight flex items-center gap-1.5 w-60 justify-center shadow-inner">
//                   <ShieldCheck size={11} className="text-emerald-500 shrink-0" /> my.tawala.shop/live
//                 </div>
//                 <div className="w-8 flex justify-end">
//                   <Heart size={11} className="text-rose-400 fill-rose-400/20" />
//                 </div>
//               </div>

//               {/* Mock Dashboard Dynamic Live Workspace View */}
//               <div className="flex-1 p-6 flex flex-col justify-between min-h-0 bg-gradient-to-br from-primary/[0.01] via-transparent to-transparent">
                
//                 {/* Simplified Status Tiles */}
//                 <div className="grid grid-cols-3 gap-4">
//                   <div className="p-3 bg-[#fafbfc] border border-slate-50 rounded-xl space-y-1">
//                     <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Counter Status</span>
//                     <span className="text-xs font-black text-[#1e2229] block">Recording Active</span>
//                   </div>
//                   <div className="p-3 bg-[#fafbfc] border border-slate-50 rounded-xl space-y-1">
//                     <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Cashier Shifts</span>
//                     <span className="text-xs font-black text-[#1e2229] block">Balanced & Safe</span>
//                   </div>
//                   <div className="p-3 bg-[#fafbfc] border border-slate-50 rounded-xl space-y-1">
//                     <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Cloud Storage</span>
//                     <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
//                       <Activity size={12} className="animate-pulse" /> Synced Fully
//                     </span>
//                   </div>
//                 </div>

//                 {/* Central Canvas Graphic Emphasizing Freedom/Control */}
//                 <div className="my-auto border border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2.5 bg-[#fdfeff]/40 py-6">
//                   <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shadow-sm animate-bounce duration-[4s]">
//                     <Smile size={18} />
//                   </div>
//                   <div className="space-y-0.5">
//                     <h3 className="text-xs font-extrabold text-[#1e2229]">Your Business Data, Perfectly Safe</h3>
//                     <p className="text-[11px] text-[#7d859a] font-medium max-w-xs leading-normal">No physical logs to destroy, no calculator error surprises. Just clarity.</p>
//                   </div>
//                 </div>

//                 {/* Bottom Audit Streams Container */}
//                 <div className="space-y-3 shrink-0">
//                   <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 shadow-soft">
//                     <div className="flex items-center gap-2">
//                       <CheckCircle2 size={13} className="text-primary" />
//                       <span>Stock Sync Audit: No records lost today</span>
//                     </div>
//                     <span className="text-[9px] bg-emerald-50 text-emerald-600 font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Secure</span>
//                   </div>

//                   {/* Clean Pastel Revenue Box */}
//                   <div className="h-14 bg-slate-900 rounded-xl flex items-center px-4 justify-between bg-gradient-to-r from-[#1a1c23] to-[#242731]">
//                     <div className="space-y-0.5">
//                       <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider leading-none">Total Sales Tracked (Today)</p>
//                       <p className="text-base font-black text-white tabular-nums leading-none">KES 48,250.00</p>
//                     </div>
//                     <Link
//                       href="/billing"
//                       className="h-8 px-4 bg-primary text-white text-xs font-bold rounded-lg flex items-center justify-center shadow-sm hover:bg-primary/90 transition-colors"
//                     >
//                       View Plans
//                     </Link>
//                   </div>
//                 </div>

//               </div>
//             </div>
//           </div>

//         </div>

//       </main>
//     </>
//   );
// }

// app/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/lib/components/Header";
import { Button } from "@/lib/components/ui/Button";
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  ShieldCheck, 
  Package,
  Activity,
  Smile,
  Heart
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tawala Platform | From Hustle to Structure",
  description:
    "Ditch the messy notebooks and hidden storefront leakages. Tawala transforms retail confusion into a calm, organized digital partner built around Kenyan biashara workflows.",
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tawala Platform",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Windows, macOS, Linux, Web",
    description:
      "A calm, intuitive business partner for Kenyan shop owners to track counter sales, eliminate stock guesswork, and see daily net profits.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KES",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Screen-bounded viewport layout container relying natively on global base variables */}
      <main className="h-screen w-full bg-surface text-foreground overflow-hidden relative flex flex-col p-4 lg:p-8 selection:bg-brand-primary/20">
        
        {/* Hardware-accelerated ambient visual indicators tailored to brand parameters */}
        <div className="absolute top-[-5%] right-[-5%] w-[450px] h-[450px] bg-brand-secondary/5 rounded-full blur-[100px] pointer-events-none animate-pulse" aria-hidden="true" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] bg-brand-primary/5 rounded-full blur-[90px] pointer-events-none animate-pulse" aria-hidden="true" />

        {/* Unified Application Header Context */}
        <Header />

        {/* Core Screen Context Node Matrix */}
        <div id="main-content" className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center min-h-0 py-4 outline-none relative z-10">
          
          {/* Conversion Engine Column */}
          <section className="lg:col-span-6 flex flex-col space-y-6 lg:space-y-8 justify-center min-h-0" aria-labelledby="hero-heading">
            
            <div className="space-y-4">
              {/* Context Action Pill */}
              <div className="inline-flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 px-3.5 py-1 rounded-full w-fit">
                <Sparkles size={13} className="text-brand-primary animate-spin" aria-hidden="true" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary">
                  Built For Your Biashara
                </span>
              </div>

              <h1 id="hero-heading" className="text-gradient text-h2 animate-gradient font-black">
                Tawala Biashara Yako <br />
                <span className="text-gradient animate-gradient">
                  Bila Stress.
                </span>
              </h1>
            </div>

            <p className="text-muted text-base font-medium leading-relaxed max-w-xl">
              Running a physical shop shouldn&apos;t mean staying up late calculating matching carbon-copy totals in an exercise notebook. Tawala gives you absolute control over your cash, stock levels, and staff shifts right from your pocket phone.
            </p>

            {/* Micro Balanced Data Metrics Card Panel */}
            <div className="grid grid-cols-2 gap-4 max-w-lg bg-background border border-border/40 p-4 rounded-[1.5rem] shadow-lift relative overflow-hidden">
              <div className="space-y-1.5 relative z-10">
                <div className="flex items-center gap-2 text-brand-secondary font-bold text-xs uppercase tracking-wider">
                  <div className="p-1 bg-brand-secondary/10 rounded-lg">
                    <Package size={14} aria-hidden="true" />
                  </div> 
                  Shelves Balanced
                </div>
                <p className="text-xs font-medium text-muted leading-relaxed">
                  Know exactly what is running low without manual counting protocols.
                </p>
              </div>

              <div className="space-y-1.5 relative z-10">
                <div className="flex items-center gap-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <div className="p-1 bg-brand-accent/10 rounded-lg">
                    <TrendingUp size={14} aria-hidden="true" />
                  </div> 
                  Clear Profit Lines
                </div>
                <p className="text-xs font-medium text-muted leading-relaxed">
                  See true operational net profit margins instantly every evening.
                </p>
              </div>
            </div>

            {/* Button Layout Group utilizing refactored design token parameters */}
            <div className="flex flex-col sm:flex-row gap-4 pt-1">
              <Link href="/terminal" passHref legacyBehavior>
                <Button 
                  variant="primary" 
                  size="lg"
                  className="min-w-[240px] group gap-2 Normal-case font-bold"
                >
                  Launch Your System Now
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden="true" />
                </Button>
              </Link>
              
              <Link href="/features" passHref legacyBehavior>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="normal-case font-bold"
                >
                  See How It Simplifies Life
                </Button>
              </Link>
            </div>
          </section>

          {/* Graphical Mock System Dashboard Frame */}
          <div className="lg:col-span-6 relative w-full h-full flex items-center justify-center min-h-0" aria-hidden="true">
            <div className="w-full max-w-2xl bg-background rounded-[2rem] border border-border/40 shadow-lift overflow-hidden flex flex-col h-[88%] max-h-[500px] transform hover:scale-[1.005] transition-transform duration-500">
              
              {/* Virtualized Navigation/Tab Workspace Boundary Header */}
              <div className="px-5 py-3 bg-surface border-b border-border/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-primary/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-secondary/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-accent/40" />
                </div>
                <div className="px-4 py-1 bg-background border border-border/40 rounded-xl text-[10px] text-muted font-medium tracking-tight flex items-center gap-1.5 w-60 justify-center shadow-inner font-mono">
                  <ShieldCheck size={11} className="text-brand-accent shrink-0" /> my.tawala.shop/live
                </div>
                <div className="w-8 flex justify-end">
                  <Heart size={11} className="text-brand-primary/60 fill-brand-primary/10" />
                </div>
              </div>

              {/* Functional Dashboard Render Area */}
              <div className="flex-1 p-6 flex flex-col justify-between min-h-0 bg-gradient-to-br from-brand-primary/[0.02] via-transparent to-transparent">
                
                {/* Structural Grid Elements */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-surface border border-border/30 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-muted font-bold block">Counter Status</span>
                    <span className="text-xs font-bold text-foreground block">Recording Active</span>
                  </div>
                  <div className="p-3 bg-surface border border-border/30 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-muted font-bold block">Cashier Shifts</span>
                    <span className="text-xs font-bold text-foreground block">Balanced & Safe</span>
                  </div>
                  <div className="p-3 bg-surface border border-border/30 rounded-xl space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-muted font-bold block">Cloud Storage</span>
                    <span className="text-xs font-bold text-brand-accent flex items-center gap-1">
                      <Activity size={12} className="animate-pulse" /> Synced Fully
                    </span>
                  </div>
                </div>

                {/* Core Status Message Overlay Element */}
                <div className="my-auto border border-dashed border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2.5 bg-surface/30 py-6">
                  <div className="h-10 w-10 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center border border-brand-accent/20 shadow-inner">
                    <Smile size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-foreground">Your Business Data, Perfectly Safe</h3>
                    <p className="text-[11px] text-muted font-medium max-w-xs leading-normal">
                      No physical logs to destroy, no calculator error surprises. Just clarity.
                    </p>
                  </div>
                </div>

                {/* Lower Audit Feeds Layer */}
                <div className="space-y-3 shrink-0">
                  <div className="p-3 bg-background border border-border/40 rounded-xl flex items-center justify-between text-xs font-bold text-foreground shadow-lift">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-brand-accent" />
                      <span>Stock Sync Audit: No records lost today</span>
                    </div>
                    <span className="text-[9px] bg-brand-accent/10 text-brand-accent font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Secure</span>
                  </div>

                  {/* High Contrast Ledger Revenue Area */}
                  <div className="h-14 bg-foreground rounded-xl flex items-center px-4 justify-between bg-gradient-to-r from-foreground to-foreground/95">
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-muted uppercase font-bold tracking-wider leading-none">Total Sales Tracked (Today)</p>
                      <p className="text-base font-bold text-background font-mono tracking-tight leading-none">KES 48,250.00</p>
                    </div>
                    <Link href="/billing" passHref legacyBehavior>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        className="h-8 px-4 normal-case font-bold"
                      >
                        View Plans
                      </Button>
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}