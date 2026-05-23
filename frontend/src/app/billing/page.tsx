// import { Metadata } from "next";
// import Link from "next/link";
// import { 
//   CheckCircle2, 
//   HelpCircle, 
//   Store, 
//   Network, 
//   Building2, 
//   Lock 
// } from "lucide-react";

// export const metadata: Metadata = {
//   title: "Simple, Transparent Subscription Plans | Tawala Business OS",
//   description:
//     "Choose a plan built for your biashara scale. From single retail shops to multi-branch supermarkets, Tawala keeps your business operations under control.",
//   alternates: {
//     canonical: "/billing",
//   },
// };

// export default function BillingPage() {
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "WebPage",
//     name: "Tawala Platform Subscription Plans",
//     description: "Pricing and subscription tiers tailored around the real scale and operational workflows of Kenyan SMEs.",
//     publisher: {
//       "@type": "Organization",
//       name: "Tawala Technology",
//     }
//   };

//   const tiers = [
//     {
//       name: "Single Biashara",
//       icon: <Store size={20} className="text-secondary" />,
//       description: "Perfect for single retail shops, kiosks, and early-stage small storefronts looking to move away from notebooks.",
//       features: [
//         "1 Fixed Cashier / Attendant Node",
//         "Core Sales & Notebook-Free Bookkeeping",
//         "Basic Inventory Tracking",
//         "End-of-Day PDF Sales Reports",
//         "Offline-First Store Security Mode",
//       ],
//       isPopular: false,
//       badge: "Single Shop",
//     },
//     {
//       name: "Business Growth OS",
//       icon: <Network size={20} className="text-primary" />,
//       description: "Our sweet spot. Engineered for expanding retail stores, minimarts, hardwares, and pharmacies needing deep accountability.",
//       features: [
//         "Unlimited Staff & Cashier Nodes",
//         "Advanced Stock & Automatic Expiry Controls",
//         "Real-Time Profit & Expense Analytics",
//         "Multi-Branch Cloud Synchronization Ready",
//         "Supplier Matrix & Invoice Auditing",
//         "Priority System Support Access",
//       ],
//       isPopular: true,
//       badge: "Highly Recommended",
//     },
//     {
//       name: "Enterprise Network",
//       icon: <Building2 size={20} className="text-secondary" />,
//       description: "Tailored specifically for complex high-volume operations like malls, large supermarkets, and major wholesale hubs.",
//       features: [
//         "Everything in Business Growth Plan",
//         "Unlimited Multi-Branch & Warehouse Sync",
//         "Centralized Corporate Supply Chains",
//         "Dedicated Database Instance Layer",
//         "Custom Workflow Audit Streams",
//         "24/7 Phone Deployment Support Line",
//       ],
//       isPopular: false,
//       badge: "Malls & Supermarkets",
//     },
//   ];

//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />

//       {/* Screen-bounded container adhering strictly to the macro workspace rules */}
//       <main className="h-screen w-full bg-background overflow-hidden relative flex flex-col p-6 lg:p-10 selection:bg-primary/30">
        
//         {/* Ambient Brand Glow Matrix Layer */}
//         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />
//         <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/5 blur-[80px] rounded-full pointer-events-none" aria-hidden="true" />

//         {/* TOP BRAND NAVIGATION HEADER */}
//         <header className="w-full flex items-center justify-between pb-6 border-b border-border shrink-0 z-10">
//           <div className="flex flex-col">
//             <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary">Deployment Matrix</span>
//             <h1 className="text-xl font-black text-foreground tracking-tight uppercase">Structure-as-a-Service Plans</h1>
//           </div>
//           <div>
//             <Link 
//               href="/" 
//               className="text-xs font-bold text-secondary hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary p-2 rounded-lg"
//             >
//               &larr; Return Home
//             </Link>
//           </div>
//         </header>

//         {/* CORE CONVERSION PLATFORM ZONE */}
//         <div id="main-content" className="flex-1 w-full flex flex-col justify-center min-h-0 py-6 z-10">
          
//           {/* Decoy Pricing Psychological Setup */}
//           <div className="text-center max-w-2xl mx-auto mb-8 shrink-0">
//             <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground leading-tight">
//               Invest in Structure. Stop Guessing.
//             </h2>
//             <p className="text-xs md:text-sm font-medium text-secondary mt-2 leading-relaxed">
//               No complex hidden enterprise jargon. Pick the subscription blueprint that accurately corresponds with your physical business scale.
//             </p>
//           </div>

//           {/* Three-Tier Pricing Matrix */}
//           <section 
//             className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl w-full mx-auto overflow-y-auto max-h-[calc(100vh-240px)] pr-2 no-scrollbar"
//             aria-label="Subscription tiers matrix"
//           >
//             {tiers.map((tier, index) => (
//               <div
//                 key={index}
//                 className={`bg-card rounded-2xl p-6 border flex flex-col justify-between relative transition-all shadow-soft group ${
//                   tier.isPopular 
//                     ? "border-primary ring-2 ring-primary/20 scale-[1.01] lg:scale-[1.03] z-20" 
//                     : "border-border hover:border-primary/20"
//                 }`}
//               >
//                 {/* Tier Floating Badge Element */}
//                 <div className="absolute top-4 right-4">
//                   <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
//                     tier.isPopular 
//                       ? "bg-primary text-white" 
//                       : "bg-background border border-border text-secondary"
//                   }`}>
//                     {tier.badge}
//                   </span>
//                 </div>

//                 <div className="space-y-5">
//                   {/* Tier Meta Information */}
//                   <div className="space-y-2">
//                     <div className="flex items-center gap-2">
//                       <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shadow-sm ${
//                         tier.isPopular ? "bg-primary/10 border-primary/20 text-primary" : "bg-background border-border text-secondary"
//                       }`}>
//                         {tier.icon}
//                       </div>
//                       <h3 className="text-base font-black uppercase text-foreground tracking-tight">{tier.name}</h3>
//                     </div>
//                     <p className="text-xs font-medium text-secondary leading-relaxed pt-1">
//                       {tier.description}
//                     </p>
//                   </div>

//                   {/* Explicit Value Anchor Line instead of hard monetary cost */}
//                   <div className="py-2 border-y border-dashed border-border flex items-center justify-between">
//                     <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Pricing Architecture</span>
//                     <span className="text-xs font-extrabold text-foreground tracking-tight">Tier Volume Anchored</span>
//                   </div>

//                   {/* Feature Lists */}
//                   <ul className="space-y-2.5" aria-label={`${tier.name} feature checklist`}>
//                     {tier.features.map((feat, fIdx) => (
//                       <li key={fIdx} className="flex items-start gap-2.5 text-xs font-semibold text-foreground leading-tight">
//                         <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
//                         <span>{feat}</span>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>

//                 {/* Conversion Trigger Layer: Intentionally Disabled Coming Soon Action Target */}
//                 <div className="pt-6">
//                   <button
//                     disabled
//                     aria-describedby={`desc-${index}`}
//                     className={`w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed transition-colors border ${
//                       tier.isPopular
//                         ? "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20"
//                         : "bg-background text-secondary border-border"
//                     }`}
//                   >
//                     <Lock size={12} aria-hidden="true" />
//                     <span>Deployment Coming Soon</span>
//                   </button>
//                   <p id={`desc-${index}`} className="sr-only">
//                     This selection tier is currently under operational layout and cannot be checked out yet.
//                   </p>
//                 </div>

//               </div>
//             ))}
//           </section>

//           {/* Micro Guarantee Accountability Footer */}
//           <div className="text-center mt-6 text-[11px] font-medium text-secondary flex items-center justify-center gap-1.5 shrink-0">
//             <HelpCircle size={12} className="text-primary" />
//             <span>Need localized infrastructure models? <Link href="#demo" className="text-foreground font-bold hover:underline underline-offset-2 outline-none focus-visible:text-primary">Contact Tawala Architecture Operations</Link>.</span>
//           </div>

//         </div>

//       </main>
//     </>
//   );
// }
import { Metadata } from "next";
import Link from "next/link";
import { 
  CheckCircle2, 
  Store, 
  TrendingUp, 
  Building2, 
  Lock,
  Sparkles,
  HelpCircle,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

export const metadata: Metadata = {
  title: "Simple Plans Built for Your Biashara Scale | Tawala",
  description:
    "No confusing software talk or hidden pricing surprises. Explore our three tailored options built around the real size of your Kenyan business.",
  alternates: {
    canonical: "/billing",
  },
};

export default function BillingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Tawala Platform Plans Breakdown",
    description: "Simple, easy-to-understand plans crafted to match single shops, growing retail brands, and multi-branch networks in Kenya.",
    publisher: {
      "@type": "Organization",
      name: "Tawala Technology",
    }
  };

  const tiers = [
    {
      name: "Single Biashara",
      icon: <Store size={22} className="text-blue-500" />,
      tagline: "Ditch the exercise books",
      description: "Crafted specifically for single retail shops, small kiosks, duka storefronts, and early-stage entrepreneurs ready to clean up their operations and track everyday sales effortlessly.",
      features: [
        "Record daily counter sales in seconds",
        "Move completely away from missing physical logs",
        "Basic stock count tracking to know what's on shelves",
        "Simple end-of-day summary reports sent to your phone",
        "Works smoothly offline even when local networks drop",
      ],
      isPopular: false,
      badge: "Single Shop Base",
      bgClass: "from-blue-50/30",
      accentColor: "blue",
    },
    {
      name: "Business Growth",
      icon: <TrendingUp size={22} className="text-primary" />,
      tagline: "Our Sweet Spot for Expanding Brands",
      description: "Engineered for busy retail hubs, mini-marts, hardwares, and pharmacies looking for tight, automated staff accountability and complete protection over daily margins.",
      features: [
        "Add unlimited counter cashiers and attendants",
        "Live stock countdowns with automatic low-supply alerts",
        "Smart alerts to clear out items before they expire",
        "True daily net profit tracking minus store expenses",
        "Link multiple physical branch store data streams together",
        "Priority access to our local support team whenever needed",
      ],
      isPopular: true,
      badge: "Highly Recommended Option",
      bgClass: "from-primary/[0.03]",
      accentColor: "primary",
    },
    {
      name: "Enterprise Network",
      icon: <Building2 size={22} className="text-purple-500" />,
      tagline: "Heavy-duty retail infrastructure",
      description: "Tailored directly for complex, high-volume operational ecosystems like regional supermarkets, wholesale depots, and sprawling shopping malls requiring large distribution.",
      features: [
        "Includes everything found inside our Growth Plan",
        "Synchronize massive central warehouse distribution streams",
        "Track corporate supplier invoices and purchases automatically",
        "Dedicated database architecture for absolute speed stability",
        "Deep audit logs to track exact user permissions back in time",
        "Direct 24/7 priority phone line for onboarding help",
      ],
      isPopular: false,
      badge: "Malls & Supermarkets",
      bgClass: "from-purple-50/30",
      accentColor: "purple",
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Relaxed marketing background palette with smooth scroll behavior */}
      <main id="main-content" className="min-h-screen w-full bg-[#fafbfc] text-[#2d3142] relative overflow-x-hidden selection:bg-primary/20 scroll-smooth">
        
        {/* Playful background blobs creating a soft, friendly mood */}
        <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-[#f0f5ff] rounded-full blur-[130px] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-[#fff0f2] rounded-full blur-[110px] pointer-events-none" aria-hidden="true" />

        {/* --- HERO SECTION --- */}
        <section className="max-w-4xl mx-auto text-center pt-24 pb-16 px-6 relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full">
            <Sparkles size={14} className="text-primary animate-pulse" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Simple, Honest Choices
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#1e2229] leading-[1.15]">
            Plans Built for Your Scale. <br />
            <span className="text-primary bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text">
              No Hidden Surprises.
            </span>
          </h1>

          <p className="text-[#5c6479] text-base md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            We don&apos;t believe in hitting you with complex corporate enterprise pricing games. Choose the plan that mirrors your physical storefront layout.
          </p>
        </section>

        {/* --- THREE TIER MARKETING MATRIX --- */}
        <section className="max-w-6xl mx-auto px-6 pb-24 relative z-10" aria-label="Available subscription choices">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {tiers.map((tier, index) => (
              <div
                key={index}
                className={`bg-white rounded-[2rem] border p-6 md:p-8 flex flex-col justify-between relative transition-all duration-300 shadow-soft group bg-gradient-to-br via-transparent to-transparent ${
                  tier.isPopular 
                    ? "border-primary ring-4 ring-primary/5 lg:scale-[1.04] z-20" 
                    : "border-slate-100 hover:border-primary/20 hover:shadow-md"
                } ${tier.bgClass}`}
              >
                {/* Floating Category Badge */}
                <div className="absolute top-5 right-5">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                    tier.isPopular 
                      ? "bg-primary text-white" 
                      : "bg-[#f1f3f7] text-[#5c6479]"
                  }`}>
                    {tier.badge}
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Category Header Card info */}
                  <div className="space-y-3">
                    <div className={`h-11 w-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                      {tier.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-[#1e2229] uppercase tracking-tight">{tier.name}</h3>
                      <p className="text-[11px] font-bold text-primary uppercase tracking-wide mt-0.5">{tier.tagline}</p>
                    </div>
                    <p className="text-[#5c6479] text-xs font-medium leading-relaxed pt-1">
                      {tier.description}
                    </p>
                  </div>

                  {/* Soft Visual Separator Line */}
                  <div className="border-t border-dashed border-slate-100" aria-hidden="true" />

                  {/* Features Checklist */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">What you get to achieve:</p>
                    <ul className="space-y-3" aria-label={`${tier.name} checklist`}>
                      {tier.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs font-semibold text-[#3a3f50] leading-snug">
                          <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Coming Soon Conversion Block Element */}
                <div className="pt-8 mt-auto">
                  <button
                    disabled
                    aria-describedby={`desc-${index}`}
                    className={`w-full h-14 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed transition-all duration-200 border ${
                      tier.isPopular
                        ? "bg-primary text-white shadow-sm border-transparent opacity-85"
                        : "bg-[#fafbfc] text-[#7d859a] border-slate-200/80"
                    }`}
                  >
                    <Lock size={13} aria-hidden="true" />
                    <span>Deployment Coming Soon</span>
                  </button>
                  <p id={`desc-${index}`} className="text-center text-[10px] font-medium text-slate-400 mt-2.5">
                    This operational blueprint is currently locked for early access deployment.
                  </p>
                </div>

              </div>
            ))}
          </div>
        </section>

        {/* --- REASSURANCE TRUST SECTION --- */}
        <section className="bg-white border-t border-slate-100 py-16 px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <ShieldCheck size={20} />
            </div>
            <h4 className="text-lg font-bold text-[#1e2229]">Unsure which plan matches your shop setup?</h4>
            <p className="text-xs md:text-sm font-medium text-[#5c6479] max-w-md mx-auto leading-relaxed">
              Don&apos;t stress about making the wrong call. Most expanding business owners safely start with our <span className="text-primary font-bold">Business Growth Plan</span> to get full staff tracking running immediately.
            </p>
            <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
              <HelpCircle size={13} className="text-primary" />
              <span>Need special multi-warehouse setups? <Link href="/features" className="text-slate-700 font-bold hover:underline">See Feature Details</Link> or <Link href="/" className="text-slate-700 font-bold hover:underline">Return Home</Link>.</span>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}