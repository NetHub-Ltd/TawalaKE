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
                  Start your free trial
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