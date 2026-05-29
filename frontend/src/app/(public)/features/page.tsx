// import { Metadata } from "next";
// import Link from "next/link";
// import { 
//   ShoppingBag, 
//   LayoutGrid, 
//   BarChart3, 
//   Users, 
//   GitBranch, 
//   FileText, 
//   ArrowRight, 
//   CheckCircle2, 
//   ShieldAlert 
// } from "lucide-react";

// export const metadata: Metadata = {
//   title: "Platform Features | Tawala Business OS",
//   description:
//     "Eliminate leakages and manual operations. Discover how Tawala automates sales tracking, stock control, real-time profits, and staff accountability for Kenyan SMEs.",
//   alternates: {
//     canonical: "/features",
//   },
// };

// export default function FeaturesPage() {
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "WebPage",
//     name: "Tawala Platform Features",
//     description: "Deep-dive into the automated business operating system capabilities tailored for Kenyan retail and SME workflows.",
//     publisher: {
//       "@type": "Organization",
//       name: "Tawala Technology",
//     }
//   };

//   // Structured capability matrix extracted straight from brand & marketing source files
//   const features = [
//     {
//       icon: <ShoppingBag size={24} className="text-primary" />,
//       title: "Sales Management",
//       problem: "Lost sales records, manual receipt calculation errors, and slow service.",
//       solution: "Record and track every single customer sale with speed and precise accuracy.",
//     },
//     {
//       icon: <LayoutGrid size={24} className="text-primary" />,
//       title: "Inventory & Stock Control",
//       problem: "Unexplained stock disappearances, bad tracking, and running out of fast movers.",
//       solution: "Know exactly what is currently inside your stores, what is running low, and what is selling out.",
//     },
//     {
//       icon: <BarChart3 size={24} className="text-primary" />,
//       title: "Real-Time Profit Analytics",
//       problem: "No clear visibility into actual profits versus operating expenses.",
//       solution: "Understand your margins, gross revenue, and financial health via instant, clean daily reporting.",
//     },
//     {
//       icon: <Users size={24} className="text-primary" />,
//       title: "Staff Accountability Nodes",
//       problem: "Employee accountability errors, cash register discrepancies, and trust deficits.",
//       solution: "Manage cashiers, attendants, and field workers with deterministic multi-user tracking.",
//     },
//     {
//       icon: <GitBranch size={24} className="text-primary" />,
//       title: "Multi-Branch Synchronization",
//       problem: "Inability to monitor separate physical shops without constantly traveling there.",
//       solution: "Run and audit multiple retail operations or store branches from a centralized dashboard matrix.",
//     },
//     {
//       icon: <FileText size={24} className="text-primary" />,
//       title: "Clean Reports & Ledgers",
//       problem: "Sifting through chaotic physical notebooks, calculators, or scattered WhatsApp logs.",
//       solution: "Make informed growth decisions using clear, automated ledger records tailored for local biashara workflows.",
//     },
//   ];

//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />

//       {/* Screen-bounded layout preserving complete consistency with the home interface */}
//       <main className="h-screen w-full bg-background overflow-hidden relative flex flex-col p-6 lg:p-10 selection:bg-primary/30">
        
//         {/* Decorative Glow Matrix */}
//         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />
//         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />

//         {/* PAGE SYSTEM HEADER */}
//         <header className="w-full flex items-center justify-between pb-6 border-b border-border shrink-0 z-10">
//           <div className="flex flex-col">
//             <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary">System Capabilities</span>
//             <h1 className="text-xl font-black text-foreground tracking-tight uppercase">Core Operations Matrix</h1>
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

//         {/* HUB FRAMEWORK ZONE */}
//         <div id="main-content" className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-0 py-6">
          
//           {/* LEFT PANELS: DYNAMIC COMPONENT SCROLLABLE FEATURES LOG */}
//           <section 
//             className="lg:col-span-7 h-full overflow-y-auto pr-2 space-y-4 max-h-[calc(100vh-160px)] no-scrollbar"
//             aria-label="Tawala platform capabilities list"
//           >
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {features.map((feat, index) => (
//                 <div 
//                   key={index} 
//                   className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between shadow-soft hover:border-primary/30 transition-all group"
//                 >
//                   <div className="space-y-3">
//                     <div className="h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
//                       {feat.icon}
//                     </div>
//                     <div>
//                       <h2 className="text-sm font-black uppercase text-foreground tracking-tight">{feat.title}</h2>
//                     </div>
                    
//                     {/* Problem Layer explicitly handling structural operational pain points */}
//                     <div className="flex items-start gap-1.5 bg-destructive/5 border border-destructive/10 p-2 rounded-xl">
//                       <ShieldAlert size={12} className="text-destructive shrink-0 mt-0.5" aria-hidden="true" />
//                       <p className="text-[10px] font-medium text-secondary-foreground/80 leading-tight">
//                         <span className="font-bold text-destructive">Leakage Point:</span> {feat.problem}
//                       </p>
//                     </div>

//                     {/* Solution Framework Layer */}
//                     <p className="text-secondary text-xs font-medium leading-relaxed">
//                       {feat.solution}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </section>

//           {/* RIGHT PANEL: ACTION DRIVEN VALUE PROPOSITION CARD */}
//           <section className="lg:col-span-5 h-full flex items-center justify-center min-h-0">
//             <div className="w-full max-w-md bg-foreground text-background dark:bg-card dark:text-foreground rounded-2xl border border-border p-6 sm:p-8 shadow-soft flex flex-col justify-between space-y-6">
              
//               <div className="space-y-4">
//                 <div className="inline-flex items-center gap-1.5 bg-primary px-3 py-1 rounded-lg text-white">
//                   <span className="text-[9px] font-black uppercase tracking-wider">Operational Goal</span>
//                 </div>
//                 <h3 className="text-2xl font-black uppercase tracking-tight leading-none">
//                   From Hustle <br />to Structure.
//                 </h3>
//                 <p className="text-[13px] font-medium text-muted dark:text-secondary leading-relaxed">
//                   Tawala isn&apos;t standard, overloaded software. We model real physical business frameworks into code. Run your retail storefront or branch networks with total clarity, absolute consistency, and confidence.
//                 </p>
//               </div>

//               <div className="space-y-3">
//                 <div className="flex items-center gap-3 text-xs font-bold">
//                   <CheckCircle2 size={16} className="text-primary shrink-0" />
//                   <span>Eliminate notebook bookkeeping reliance</span>
//                 </div>
//                 <div className="flex items-center gap-3 text-xs font-bold">
//                   <CheckCircle2 size={16} className="text-primary shrink-0" />
//                   <span>Works seamlessly for non-technical users</span>
//                 </div>
//                 <div className="flex items-center gap-3 text-xs font-bold">
//                   <CheckCircle2 size={16} className="text-primary shrink-0" />
//                   <span>Built around authentic local workflows</span>
//                 </div>
//               </div>

//               <div className="pt-2">
//                 <Link
//                   href="/terminal"
//                   className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-md hover:bg-primary/95 transition-all"
//                 >
//                   Deploy Operating System
//                   <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
//                 </Link>
//               </div>

//             </div>
//           </section>

//         </div>

//       </main>
//     </>
//   );
// }

// import { Metadata } from "next";
// import Link from "next/link";
// import { 
//   ShoppingBag, 
//   Package, 
//   TrendingUp, 
//   Users, 
//   MapPin, 
//   FileText, 
//   ArrowRight, 
//   CheckCircle2, 
//   HelpCircle,
//   Sparkles,
//   ArrowDown
// } from "lucide-react";

// export const metadata: Metadata = {
//   title: "Features Built for Your Biashara | Tawala",
//   description:
//     "Move your business from physical notebooks and tracking stress to clear structure. Discover how Tawala organizes your sales, stock, staff, and profits.",
//   alternates: {
//     canonical: "/features",
//   },
// };

// export default function FeaturesPage() {
//   const jsonLd = {
//     "@context": "https://schema.org",
//     "@type": "WebPage",
//     name: "Tawala Platform Features",
//     description: "Simple, beautiful, and reliable tools built for local retail shops, mini-marts, and growing business brands in Kenya.",
//     publisher: {
//       "@type": "Organization",
//       name: "Tawala Technology",
//     }
//   };

//   const marketingFeatures = [
//     {
//       icon: <ShoppingBag size={22} className="text-primary" />,
//       title: "Simple Sales Tracking",
//       subtitle: "Never ask 'where did today's cash go?'",
//       description: "Record sales instantly with or without barcode scanners. Your staff can process transactions quickly, and every single shilling is recorded right as it happens—eliminating evening balance headaches and calculator errors.",
//       benefit: "Saves up to 2 hours of manual ledger counting every evening."
//     },
//     {
//       icon: <Package size={22} className="text-primary" />,
//       title: "Stress-Free Stock Control",
//       subtitle: "Know exactly what is on your shelves.",
//       description: "Stop relying on memory or guessing your inventory. Tawala monitors your items in real-time, instantly alerts you when fast-moving stock is running low, and flags items before they expire so you protect your cash flow.",
//       benefit: "Completely prevents stock disappearances and missed sales."
//     },
//     {
//       icon: <TrendingUp size={22} className="text-primary" />,
//       title: "Clear, Real-Time Profit Analytics",
//       subtitle: "See your margins without spreadsheets.",
//       description: "Knowing your total sales isn't enough—you need to know your actual profit. Tawala subtracts costs automatically, tracking net profits and daily expenses so you can accurately see if your business is growing.",
//       benefit: "Gives you complete visibility over operational cash flow dashboards."
//     },
//     {
//       icon: <Users size={22} className="text-primary" />,
//       title: "Complete Staff Accountability",
//       subtitle: "Build trust with simple tracking boundaries.",
//       description: "Create distinct, secure accounts for your cashiers, store attendants, or delivery drivers. Monitor actions remotely, catch errors early, and easily verify cash drawer changes at any time without micromanaging.",
//       benefit: "Eliminates cash register discrepancies and manual errors entirely."
//     },
//     {
//       icon: <MapPin size={22} className="text-primary" />,
//       title: "Multi-Shop Management",
//       subtitle: "Be everywhere at once.",
//       description: "Run separate storefront locations, branches, or warehouses seamlessly from one phone or laptop. Check live stock levels, view multi-branch performance metrics, and spot layout issues instantly without commuting.",
//       benefit: "Audit multiple locations effortlessly from anywhere."
//     },
//     {
//       icon: <FileText size={22} className="text-primary" />,
//       title: "Beautiful, Automated Reports",
//       subtitle: "Ditch the missing notebooks.",
//       description: "Get clean, comprehensive reports sent automatically to your screen or exported as clean PDFs. Everything from tax summaries to top-selling items is generated automatically without chaotic physical ledger entries.",
//       benefit: "Replaces unorganized notebooks with clean digital data."
//     }
//   ];

//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
//       />

//       {/* Sleek, long-scrollable canvas styled with generous padding and smooth layouts */}
//       <main id="main-content" className="min-h-screen w-full bg-background relative flex flex-col p-6 lg:p-10 selection:bg-primary/30 scroll-smooth">
        
//         {/* Soft, non-intrusive ambient glow elements */}
//         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.03] blur-[130px] rounded-full pointer-events-none" aria-hidden="true" />
//         <div className="absolute top-[40%] left-0 w-[500px] h-[500px] bg-primary/[0.02] blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />

//         {/* Global Nav Integration */}

//         {/* SOFT MARKETING HERO SECTION */}
//         <section className="w-full max-w-4xl mx-auto text-center pt-16 pb-24 space-y-6 relative z-10">
//           <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full">
//             <Sparkles size={12} className="text-primary" aria-hidden="true" />
//             <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
//               Built For Modern Biashara
//             </span>
//           </div>

//           <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-foreground uppercase">
//             Everything you need <br />
//             <span className="text-primary bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text">
//               to run your business.
//             </span>
//           </h1>

//           <p className="text-secondary text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed">
//             Running a business is hard work, but tracking it shouldn&apos;t be. Tawala replaces messy manual workflows with a beautiful, calm dashboard layout that helps you make confident decisions.
//           </p>

//           <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
//             <Link
//               href="#explore"
//               className="group flex h-14 items-center justify-center gap-2 rounded-xl bg-card border border-border px-6 text-sm font-bold text-foreground hover:bg-background transition-all"
//             >
//               Explore Capabilities
//               <ArrowDown size={14} className="group-hover:translate-y-0.5 transition-transform" aria-hidden="true" />
//             </Link>
//             <Link
//               href="/billing"
//               className="flex h-14 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-md hover:bg-primary/95 transition-all"
//             >
//               See Pricing Options &rarr;
//             </Link>
//           </div>
//         </section>

//         {/* MARKETING ADVANTAGE MATRIX */}
//         <section id="explore" className="w-full max-w-6xl mx-auto py-12 border-t border-border/60 relative z-10 scroll-mt-6">
//           <div className="mb-12">
//             <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
//               Designed around your daily workflows
//             </h2>
//             <p className="text-xs font-semibold text-secondary tracking-wide uppercase mt-1">
//               Say goodbye to leakages, missing records, and tracking confusion
//             </p>
//           </div>

//           {/* Grid featuring soft design borders and clean spacing */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {marketingFeatures.map((feature, idx) => (
//               <div 
//                 key={idx}
//                 className="bg-card border border-border/80 p-6 rounded-2xl flex flex-col justify-between shadow-soft hover:border-primary/20 hover:shadow-md transition-all group duration-300"
//               >
//                 <div className="space-y-4">
//                   {/* Icon Block with high soft rounded style */}
//                   <div className="h-11 w-11 rounded-2xl bg-background border border-border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
//                     {feature.icon}
//                   </div>
                  
//                   <div className="space-y-1">
//                     <h3 className="text-base font-bold text-foreground tracking-tight">
//                       {feature.title}
//                     </h3>
//                     <p className="text-[11px] font-bold text-primary tracking-wide uppercase">
//                       {feature.subtitle}
//                     </p>
//                   </div>

//                   <p className="text-secondary text-xs font-medium leading-relaxed">
//                     {feature.description}
//                   </p>
//                 </div>

//                 {/* Soft Key Value Accent Line */}
//                 <div className="mt-6 pt-4 border-t border-dashed border-border/80 flex items-center gap-2 text-[11px] font-bold text-foreground">
//                   <CheckCircle2 size={13} className="text-primary shrink-0" aria-hidden="true" />
//                   <span>{feature.benefit}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </section>

//         {/* SLEEK CONVERSION BLOCK */}
//         <section className="w-full max-w-4xl mx-auto my-24 bg-card border border-border/80 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-soft">
//           <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.01] via-transparent to-transparent pointer-events-none" />
          
//           <div className="max-w-2xl mx-auto space-y-6 relative z-10">
//             <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-foreground">
//               Ready to take complete control of your biashara?
//             </h2>
//             <p className="text-sm font-medium text-secondary leading-relaxed">
//               Join growing business owners who trust Tawala to organize their operations, protect their margins, and handle accounting with ease.
//             </p>
            
//             <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
//               <Link
//                 href="/terminal"
//                 className="group flex h-14 w-full sm:w-auto min-w-[240px] items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-md hover:bg-primary/95 transition-all"
//               >
//                 Get Started with Tawala
//                 <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
//               </Link>
//             </div>

//             <p className="text-[11px] text-secondary font-medium flex items-center justify-center gap-1">
//               <HelpCircle size={12} className="text-primary" /> 
//               Have questions about multi-branch setups? <a href="#demo" className="text-foreground font-bold hover:underline outline-none">Speak to our support team</a>
//             </p>
//           </div>
//         </section>

//       </main>
//     </>
//   );
// }

import { Metadata } from "next";
import Link from "next/link";
import { 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Users, 
  MapPin, 
  FileText, 
  ArrowRight,
  Smile,
  XCircle,
  CheckCircle2,
  Sparkles,
  ArrowDown
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features Built for Your Biashara | Tawala",
  description:
    "Discover why Kenyan shop owners are ditching physical notebooks for Tawala. Explore our simple tools for sales tracking, stock control, and profit reporting.",
  alternates: {
    canonical: "/features",
  },
};

export default function FeaturesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Tawala Platform Features Breakdown",
    description: "A beautiful, easy-to-read breakdown of how Tawala simplifies daily business tracking for retail shops, minimarts, and growing brands.",
    publisher: {
      "@type": "Organization",
      name: "Tawala Technology",
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Soft, pastel-tinted light background with beautiful ambient marketing glows */}
      <main id="main-content" className="min-h-screen w-full bg-[#fafbfc] text-[#2d3142] relative overflow-x-hidden selection:bg-primary/20 scroll-smooth">
        
        {/* Playful background blobs creating a soft, friendly mood */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#f0f3ff] rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-[35%] left-[-15%] w-[500px] h-[500px] bg-[#fff3f5] rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-[10%] right-[-5%] w-[450px] h-[450px] bg-[#f5fff6] rounded-full blur-[110px] pointer-events-none" aria-hidden="true" />

        {/* --- HERO SECTION --- */}
        <section className="max-w-4xl mx-auto text-center pt-24 pb-20 px-6 relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full animate-fade-in">
            <Sparkles size={14} className="text-primary animate-pulse" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Made Simple For You
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#1e2229] leading-[1.15]">
            Say Goodbye To Notebook Stress. <br />
            <span className="text-primary bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text">
              Say Hello To Control.
            </span>
          </h1>

          <p className="text-[#5c6479] text-base md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            Running a shop is amazing, but trying to calculate everything in an exercise book at night is exhausting. Here is exactly how Tawala does the heavy lifting for your biashara.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <a
              href="#sales"
              className="group flex h-14 items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200/80 shadow-sm px-6 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
            >
              See How It Works
              <ArrowDown size={14} className="group-hover:translate-y-0.5 transition-transform duration-200" aria-hidden="true" />
            </a>
            <Link
              href="/billing"
              className="flex h-14 items-center justify-center rounded-2xl bg-primary px-8 text-sm font-bold text-white shadow-md hover:bg-primary/95 hover:shadow-lg transition-all duration-200"
            >
              Pick A Plan &rarr;
            </Link>
          </div>
        </section>


        {/* --- DYNAMIC MARKETING SECTIONS (LONG-SCROLL STORYTELLING) --- */}
        <div className="max-w-5xl mx-auto px-6 space-y-24 pb-28 relative z-10">
          
          {/* 1. SALES TRACKING */}
          <section id="sales" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center scroll-mt-12">
            <div className="lg:col-span-5 space-y-5">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center shadow-sm">
                <ShoppingBag size={24} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#1e2229]">Instant & Friendly Sales</h2>
              <p className="text-[#5c6479] text-sm md:text-base font-medium leading-relaxed">
                Whether you sell daily household goods, clothes, or hardware parts, recording a sale should take seconds. Your staff tap items on a screen or scan a barcode, and the sale is saved immediately.
              </p>
              
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold bg-[#fff2f3] text-rose-600 px-3 py-2 rounded-xl border border-rose-100">
                  <XCircle size={14} className="shrink-0" /> Old Way: Lost carbon copy receipts & calculator math errors.
                </div>
                <div className="flex items-center gap-2 text-xs font-bold bg-[#edfbf0] text-emerald-600 px-3 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={14} className="shrink-0" /> Tawala Way: Perfect calculations, clean digital ledger updates.
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-soft bg-gradient-to-br from-blue-50/20 via-transparent to-transparent flex flex-col justify-center min-h-[260px]">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider">What this means for you:</span>
                <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                  You don&apos;t need to look through messy paper logs to figure out who bought what. Even if you aren&apos;t physically at the shop, you see every transaction pop up on your dashboard instantly. You stay completely relaxed knowing no money goes missing.
                </p>
              </div>
            </div>
          </section>

          {/* 2. INVENTORY & STOCK */}
          <section id="stock" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center lg:flex-row-reverse">
            <div className="lg:col-span-5 lg:order-2 space-y-5">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center shadow-sm">
                <Package size={24} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#1e2229]">Stock Control Without Guessing</h2>
              <p className="text-[#5c6479] text-sm md:text-base font-medium leading-relaxed">
                Items vanishing from shelves mysteriously? Tawala knows where every item goes. When you sell an item, your inventory level drops automatically—giving you absolute clarity over exactly what is left.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold bg-[#fff2f3] text-rose-600 px-3 py-2 rounded-xl border border-rose-100">
                  <XCircle size={14} className="shrink-0" /> Old Way: Running out of fast movers without noticing.
                </div>
                <div className="flex items-center gap-2 text-xs font-bold bg-[#edfbf0] text-emerald-600 px-3 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={14} className="shrink-0" /> Tawala Way: Smart warnings when stock items run low.
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 lg:order-1 bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-soft bg-gradient-to-br from-amber-50/20 via-transparent to-transparent flex flex-col justify-center min-h-[260px]">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-md uppercase tracking-wider">What this means for you:</span>
                <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                  You stop losing sales because an item suddenly ran out. You also save capital by not overbuying slow stock items. Your shelves look beautifully balanced and organized, and your cash flow is protected.
                </p>
              </div>
            </div>
          </section>

          {/* 3. PROFIT REPORTING */}
          <section id="profit" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center shadow-sm">
                <TrendingUp size={24} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#1e2229]">True Daily Profits Revealed</h2>
              <p className="text-[#5c6479] text-sm md:text-base font-medium leading-relaxed">
                High sales revenue does not always mean good profits. Tawala tracks the acquisition cost of your goods, matches it with sales pricing, and subtracts daily shop expenses effortlessly.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold bg-[#fff2f3] text-rose-600 px-3 py-2 rounded-xl border border-rose-100">
                  <XCircle size={14} className="shrink-0" /> Old Way: Guessing how much money you can actually take home.
                </div>
                <div className="flex items-center gap-2 text-xs font-bold bg-[#edfbf0] text-emerald-600 px-3 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={14} className="shrink-0" /> Tawala Way: Clear net margins displayed on your phone.
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-soft bg-gradient-to-br from-emerald-50/20 via-transparent to-transparent flex flex-col justify-center min-h-[260px]">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">What this means for you:</span>
                <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                  You stop spending money blindly. At the end of every week, you see a simple profit report that clearly shows if the business is growing or if operational expenses are eating your margins. You feel like a structured CEO, not a confused hustler.
                </p>
              </div>
            </div>
          </section>

          {/* 4. STAFF ACCOUNTABILITY */}
          <section id="staff" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center lg:flex-row-reverse">
            <div className="lg:col-span-5 lg:order-2 space-y-5">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-500 border border-purple-100 flex items-center justify-center shadow-sm">
                <Users size={24} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#1e2229]">Complete Staff Accountability</h2>
              <p className="text-[#5c6479] text-sm md:text-base font-medium leading-relaxed">
                Protecting your business shouldn&apos;t feel like a trust fight. Create simple individual log-ins for your counter cashiers or attendants. You decide exactly what parts of the system they are allowed to see.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold bg-[#fff2f3] text-rose-600 px-3 py-2 rounded-xl border border-rose-100">
                  <XCircle size={14} className="shrink-0" /> Old Way: Constant worry about cash drawer discrepancies.
                </div>
                <div className="flex items-center gap-2 text-xs font-bold bg-[#edfbf0] text-emerald-600 px-3 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={14} className="shrink-0" /> Tawala Way: Every sales shift starts and ends perfectly balanced.
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 lg:order-1 bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-soft bg-gradient-to-br from-purple-50/20 via-transparent to-transparent flex flex-col justify-center min-h-[260px]">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-purple-500 bg-purple-50 px-2.5 py-1 rounded-md uppercase tracking-wider">What this means for you:</span>
                <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                  You can leave the shop completely unattended to attend to family duties or open a second branch. Tawala audits cash movements behind the scenes so your staff remain totally honest and accountable, and your relationship with them stays peaceful.
                </p>
              </div>
            </div>
          </section>

          {/* 5. MULTI-BRANCH SYNC */}
          <section id="branches" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-5">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-500 border border-indigo-100 flex items-center justify-center shadow-sm">
                <MapPin size={24} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#1e2229]">Be Everywhere At Once</h2>
              <p className="text-[#5c6479] text-sm md:text-base font-medium leading-relaxed">
                Why spend hours driving in traffic just to audit another store location? Tawala links your multiple retail branches or storage rooms into one continuous cloud database dashboard.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold bg-[#fff2f3] text-rose-600 px-3 py-2 rounded-xl border border-rose-100">
                  <XCircle size={14} className="shrink-0" /> Old Way: Travelling up and down to count notebooks manually.
                </div>
                <div className="flex items-center gap-2 text-xs font-bold bg-[#edfbf0] text-emerald-600 px-3 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={14} className="shrink-0" /> Tawala Way: Centralized control from your pocket phone.
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-soft bg-gradient-to-br from-indigo-50/20 via-transparent to-transparent flex flex-col justify-center min-h-[260px]">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-wider">What this means for you:</span>
                <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                  Scaling your brand becomes fun rather than terrifying. You can expand your business across town knowing that stock levels, sales reports, and customer profiles stay synchronized automatically without data loss.
                </p>
              </div>
            </div>
          </section>

          {/* 6. AUTOMATED REPORTS */}
          <section id="reports" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center lg:flex-row-reverse">
            <div className="lg:col-span-5 lg:order-2 space-y-5">
              <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-500 border border-teal-100 flex items-center justify-center shadow-sm">
                <FileText size={24} />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#1e2229]">Beautiful, Ready-Made Reports</h2>
              <p className="text-[#5c6479] text-sm md:text-base font-medium leading-relaxed">
                No complex financial formulas required. Click one button and see your top-selling products, slow items, and performance trends instantly formatted into easy-to-read charts or clean PDFs.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold bg-[#fff2f3] text-rose-600 px-3 py-2 rounded-xl border border-rose-100">
                  <XCircle size={14} className="shrink-0" /> Old Way: Scattered scraps of paper and missed numbers.
                </div>
                <div className="flex items-center gap-2 text-xs font-bold bg-[#edfbf0] text-emerald-600 px-3 py-2 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={14} className="shrink-0" /> Tawala Way: Flawless business history built effortlessly.
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 lg:order-1 bg-white rounded-[2rem] border border-slate-100 p-6 md:p-8 shadow-soft bg-gradient-to-br from-teal-50/20 via-transparent to-transparent flex flex-col justify-center min-h-[260px]">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-teal-500 bg-teal-50 px-2.5 py-1 rounded-md uppercase tracking-wider">What this means for you:</span>
                <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed">
                  You stop managing your business by gut feelings. You can clearly see what moves fast, predict when to restock items before holidays, and confidently plan store expansions based on true historical sales trends.
                </p>
              </div>
            </div>
          </section>

        </div>


        {/* --- CONVERSION FOOTER BOX --- */}
        <section className="bg-white border-t border-slate-100 py-20 px-6 text-center relative overflow-hidden">
          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
              <Smile size={24} />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black text-[#1e2229] uppercase tracking-tight">
              Ready to take complete control?
            </h2>
            
            <p className="text-[#5c6479] text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed">
              Join thousands of Kenyan shop owners who are moving their retail businesses from manual confusion into structured digital growth. Let&apos;s clean up your books today.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/terminal"
                className="group flex h-14 w-full sm:w-auto min-w-[240px] items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-sm font-bold text-white shadow-md hover:bg-primary/95 hover:shadow-lg transition-all duration-200"
              >
                Launch Your System Now
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" aria-hidden="true" />
              </Link>
              <Link
                href="/"
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-2 px-4 rounded-xl"
              >
                &larr; Return to Main Page
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}