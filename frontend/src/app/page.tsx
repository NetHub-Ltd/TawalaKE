// import { Metadata } from "next";
// import Link from "next/link";
// import {
//   ArrowRight,
//   Cpu,
//   Database,
//   Zap,
//   ShieldCheck,
//   BarChart3,
// } from "lucide-react";

// export const metadata: Metadata = {
//   title: "OmniPOS | Smart Commerce Infrastructure",
//   description:
//     "Scale your retail operation with OmniPOS. 0.2s transaction speeds and real-time multi-store synchronization.",
// };

// export default function LandingPage() {
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "SoftwareApplication",
//     name: "OmniPOS",
//     applicationCategory: "BusinessApplication",
//     operatingSystem: "Web, iOS, Android",
//     offers: {
//       "@type": "Offer",
//       price: "0",
//       priceCurrency: "USD",
//     },
//   };

//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />

//       <section
//         className="relative overflow-hidden px-6 pt-24 pb-32 lg:pt-40"
//         aria-labelledby="hero-title"
//       >
//         {/* Ambient background using theme ring token */}
//         <div
//           className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-[var(--ring)] blur-[120px] rounded-full pointer-events-none"
//           aria-hidden="true"
//         />

//         <div className="container mx-auto max-w-7xl">
//           <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
//             {/* Left: Transactional Value Prop */}
//             <div className="flex flex-col space-y-10 text-center lg:text-left">
//               <header className="inline-flex items-center gap-2 self-center lg:self-start bg-primary/10 border border-primary/20 px-4 py-2 rounded-full">
//                 <Cpu size={16} className="text-primary" />
//                 <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
//                   Engine v2.4 Live
//                 </span>
//               </header>

//               <div className="space-y-6">
//                 <h1 id="hero-title" className="h1 lg:text-3xl">
//                   The POS Engine <br />
//                   <span className="text-primary">Built for Scale.</span>
//                 </h1>
//                 <p className="max-w-xl text-base text-secondary font-medium leading-relaxed mx-auto lg:mx-0">
//                   Unify your entire commerce operation. From high-volume retail
//                   to complex distribution—OmniPOS delivers{" "}
//                   <strong>sub-second transaction speeds</strong> across every
//                   terminal.
//                 </p>
//               </div>

//               {/* Fitts's Law: Large, Accessible CTAs */}
//               <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
//                 <Link
//                   href="/terminal"
//                   className="btn group flex h-14 min-w-[220px] items-center justify-center gap-3 rounded-xl bg-primary px-8 text-base font-bold text-white shadow-soft hover:brightness-110"
//                 >
//                   Launch Terminal
//                   <ArrowRight
//                     size={20}
//                     className="group-hover:translate-x-1 transition-transform"
//                   />
//                 </Link>
//                 <Link
//                   href="#demo"
//                   className="btn flex h-14 min-w-[200px] items-center justify-center gap-3 rounded-xl border border-border bg-card px-8 text-base font-bold hover:bg-slate-50 dark:hover:bg-slate-900"
//                 >
//                   Request Demo
//                 </Link>
//               </div>

//               {/* Trust/Feature Indicators */}
//               <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-6">
//                 <TrustBadge icon={<Zap />} text="0.2s Speed" />
//                 <TrustBadge icon={<Database />} text="Real-time Sync" />
//                 <TrustBadge icon={<ShieldCheck />} text="PCI Compliant" />
//               </div>
//             </div>

//             {/* Right: Abstract Terminal Visual */}
//             <div className="relative group perspective-1000 hidden lg:block">
//               <div className="relative aspect-[4/3] bg-card rounded-[2rem] border-8 border-brand-navy shadow-2xl overflow-hidden shadow-soft">
//                 <div className="p-8 h-full flex flex-col bg-gradient-to-br from-primary/5 to-transparent">
//                   <div className="flex justify-between items-center mb-10">
//                     <div className="h-4 w-32 bg-secondary/20 rounded-full" />
//                     <div className="h-10 w-24 bg-primary/20 rounded-xl border border-primary/30" />
//                   </div>
//                   <div className="pos-grid">
//                     {[...Array(10)].map((_, i) => (
//                       <div
//                         key={i}
//                         className="aspect-square bg-secondary/10 rounded-xl border border-border"
//                       />
//                     ))}
//                   </div>
//                   <div className="mt-auto h-20 bg-card border border-border rounded-2xl shadow-sm flex items-center px-6 justify-between">
//                     <div className="h-4 w-24 bg-primary/40 rounded-full" />
//                     <div className="h-10 w-32 bg-primary rounded-lg" />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//     </>
//   );
// }

// function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
//   return (
//     <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card/50">
//       <span className="text-primary scale-75">{icon}</span>
//       <span className="text-xs font-bold text-secondary uppercase tracking-tight">
//         {text}
//       </span>
//     </div>
//   );
// }

import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cpu, Database, Zap, ShieldCheck } from "lucide-react";

/**
 * @Scribe_Audit
 * Metadata: Optimized for conversion and technical SEO.
 * Theme: Strictly using --primary, --secondary, and --border tokens.
 */

export const metadata: Metadata = {
  title: "OmniPOS | Smart Commerce Infrastructure",
  description:
    "Scale your retail operation with OmniPOS. 0.2s transaction speeds and real-time multi-store synchronization.",
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OmniPOS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section
        className="relative overflow-hidden px-6 pt-24 pb-32 lg:pt-40 bg-background"
        aria-labelledby="hero-title"
      >
        {/* Ambient background using theme ring token - Performance: Layer promotion via blur */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-[var(--ring)] blur-[120px] rounded-full pointer-events-none will-change-transform"
          aria-hidden="true"
        />

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Left: Transactional Value Prop */}
            <div className="flex flex-col space-y-10 text-center lg:text-left">
              <header className="inline-flex items-center gap-2 self-center lg:self-start bg-primary/10 border border-primary/20 px-4 py-2 rounded-full">
                <Cpu size={14} className="text-primary" aria-hidden="true" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  Engine v2.4 Live
                </span>
              </header>

              <div className="space-y-6">
                <h1 id="hero-title" className="h1 lg:text-[4rem] leading-[1]">
                  The POS Engine <br />
                  <span className="text-primary">Built for Scale.</span>
                </h1>
                <p className="max-w-xl text-base md:text-lg text-secondary font-medium leading-relaxed mx-auto lg:mx-0">
                  Unify your entire commerce operation. From high-volume retail
                  to complex distribution—OmniPOS delivers{" "}
                  <strong className="text-foreground">
                    sub-second transaction speeds
                  </strong>{" "}
                  across every terminal.
                </p>
              </div>

              {/* Fitts's Law: Large, Accessible CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/terminal"
                  className="btn group flex h-16 min-w-[240px] items-center justify-center gap-3 rounded-2xl bg-primary px-8 text-base font-black text-white shadow-soft hover:scale-[1.02] transition-all"
                >
                  Launch Terminal
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
                <Link
                  href="#demo"
                  className="btn flex h-16 min-w-[200px] items-center justify-center gap-3 rounded-2xl border border-border bg-card px-8 text-base font-bold text-foreground hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  Request Demo
                </Link>
              </div>

              {/* Trust/Feature Indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-6">
                <TrustBadge icon={<Zap size={16} />} text="0.2s Speed" />
                <TrustBadge
                  icon={<Database size={16} />}
                  text="Real-time Sync"
                />
                <TrustBadge
                  icon={<ShieldCheck size={16} />}
                  text="PCI Compliant"
                />
              </div>
            </div>

            {/* Right: Abstract Terminal Visual - Utilizing pos-grid utility */}
            <div className="relative hidden lg:block">
              <div className="relative aspect-[4/3] bg-card rounded-[2.5rem] border-[12px] border-foreground shadow-2xl overflow-hidden shadow-soft">
                <div className="p-8 h-full flex flex-col bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="flex justify-between items-center mb-8">
                    <div className="h-3 w-32 bg-secondary/20 rounded-full" />
                    <div className="h-8 w-24 bg-primary/20 rounded-lg border border-primary/30" />
                  </div>

                  {/* Visual implementation of your pos-grid utility */}
                  <div className="grid grid-cols-5 gap-3">
                    {[...Array(15)].map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-secondary/5 rounded-xl border border-border/50 animate-pulse"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>

                  <div className="mt-auto h-20 glass rounded-2xl flex items-center px-6 justify-between">
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-primary/30 rounded-full" />
                      <div className="h-2 w-16 bg-secondary/20 rounded-full" />
                    </div>
                    <div className="h-10 w-32 bg-primary rounded-xl shadow-lg shadow-primary/20" />
                  </div>
                </div>
              </div>

              {/* Decorative "Float" effect elements */}
              <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-primary/10 blur-3xl rounded-full" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
      <span className="text-primary" aria-hidden="true">
        {icon}
      </span>
      <span className="text-[10px] font-black text-secondary uppercase tracking-widest">
        {text}
      </span>
    </div>
  );
}