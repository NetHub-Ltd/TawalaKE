import { Metadata } from "next";
import Link from "next/link";
import Header from "@/lib/components/Header";
import NavBar from "@/lib/components/NavBar"
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
  Zap,
  Users,
  Store,
  HelpCircle
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tawala Platform | From Hustle to Structure",
  description: "Ditch messy notebooks. Tawala transforms retail confusion into a calm digital partner optimized for Kenyan biashara workflows.",
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
    "operatingSystem": "Windows, macOS, Linux, Web",
    "description": "A calm, intuitive business partner for Kenyan shop owners to track counter sales, eliminate stock guesswork, and see daily net profits.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "KES",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Scrollable Layout Container:
        Replaces the fixed height structure with a responsive, multi-tier marketing system.
      */}
      <main className="min-h-screen w-full bg-background text-foreground relative flex flex-col overflow-x-hidden selection:bg-brand-primary/20">
        
        {/* Background Visual Gradients */}
        <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-brand-secondary/5 rounded-full blur-[140px] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

        <div className="p-4 lg:p-6 xl:p-8 w-full flex flex-col">
          <NavBar />
        </div>

        {/* =========================================================
           SECTION 1: HERO SECTION
        ========================================================= */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 px-3 py-1 rounded-full w-fit">
                <Sparkles size={12} className="text-brand-primary" aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary">
                  Built For Kenyan Biashara
                </span>
              </div>

              <h1 className="text-h1 font-extrabold tracking-tight leading-tight">
                Tawala Biashara Yako <br />
                <span className="text-gradient">Bila Stress.</span>
              </h1>
            </div>

            <p className="text-muted text-base leading-relaxed max-w-xl">
              Move from manual chaos to organized, profitable growth. Tawala helps retail shops, minimarts, pharmacies, and hardwares track counter sales, eliminate stock guesswork, and view daily net profits.
            </p>

            {/* Core Value Micro-Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg bg-card border border-border/60 p-5 rounded-2xl shadow-lift">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-brand-secondary font-bold text-xs uppercase tracking-wider">
                  <div className="p-1.5 bg-brand-secondary/10 rounded-lg">
                    <Package size={14} aria-hidden="true" />
                  </div> 
                  Shelves Balanced
                </div>
                <p className="text-xs text-muted leading-normal">
                  Track items and get low stock alerts automatically.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <div className="p-1.5 bg-brand-accent/10 rounded-lg">
                    <TrendingUp size={14} aria-hidden="true" />
                  </div> 
                  Clear Profit Lines
                </div>
                <p className="text-xs text-muted leading-normal">
                  See true net profit lines instantly every single evening.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link href="/org" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:min-w-[220px]">
                  Start Free 14-Day Trial
                  <ArrowRight size={14} className="ml-1" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full">
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive Screen Dashboard Mockup Component */}
          <div className="lg:col-span-7 w-full flex items-center justify-center relative">
            <div className="w-full max-w-2xl bg-card rounded-2xl border border-border/60 shadow-lift overflow-hidden flex flex-col">
              
              <div className="px-4 py-3 bg-surface border-b border-border/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-primary/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-secondary/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-brand-accent/40" />
                </div>
                <div className="px-3 py-0.5 bg-background border border-border/60 rounded-lg text-[11px] text-muted font-mono flex items-center gap-1.5 w-56 justify-center shadow-inner">
                  <ShieldCheck size={10} className="text-brand-accent shrink-0" /> my.tawala.shop/live
                </div>
                <div className="w-6" />
              </div>

              <div className="p-6 flex flex-col space-y-4 bg-gradient-to-br from-brand-primary/[0.01] to-transparent">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-surface border border-border/40 rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">Counter Status</span>
                    <span className="text-xs font-bold text-foreground block truncate mt-0.5">Recording Active</span>
                  </div>
                  <div className="p-3 bg-surface border border-border/40 rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">Cashier Shifts</span>
                    <span className="text-xs font-bold text-foreground block truncate mt-0.5">Balanced & Safe</span>
                  </div>
                  <div className="p-3 bg-surface border border-border/40 rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-bold block">Cloud Storage</span>
                    <span className="text-xs font-bold text-brand-accent flex items-center gap-1 mt-0.5 truncate">
                      <Activity size={12} className="animate-pulse" /> Synced Fully
                    </span>
                  </div>
                </div>

                <div className="border border-dashed border-border/80 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-2 bg-surface/20">
                  <div className="h-10 w-10 rounded-full bg-brand-accent/10 text-brand-accent flex items-center justify-center border border-brand-accent/20 shadow-inner">
                    <Smile size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Your Business Data, Clean & Managed</h3>
                    <p className="text-xs text-muted max-w-xs mt-1 leading-normal">
                      No physical log vulnerabilities, no missing pages, no calculator error surprises.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-background border border-border/60 rounded-xl flex items-center justify-between text-xs font-bold text-foreground shadow-sm">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 size={14} className="text-brand-accent shrink-0" />
                      <span className="truncate">Stock Sync Audit: No records lost today</span>
                    </div>
                    <span className="text-[9px] bg-brand-accent/10 text-brand-accent font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Secure</span>
                  </div>

                  <div className="p-4 bg-foreground text-background rounded-xl flex items-center justify-between bg-gradient-to-r from-foreground to-slate-900 shadow-lift">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Total Sales Tracked (Today)</p>
                      <p className="text-lg font-bold font-mono tracking-tight text-white leading-none pt-1">KES 48,250.00</p>
                    </div>
                    <Link href="#pricing">
                      <Button variant="secondary" size="sm">
                        View Pricing
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================
           SECTION 2: PROBLEMS TO STRUCTURE MATRIX
        ========================================================= */}
        <section id="features" className="w-full bg-surface/50 border-y border-border/50 py-20 relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
              <h2 className="text-h2 font-bold tracking-tight text-foreground">
                From Hustle to Structure
              </h2>
              <p className="text-muted text-sm sm:text-base">
                Running a biashara in Kenya is tough. We eliminate the manual confusion so you can focus on building a more sustainable workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm space-y-4">
                <div className="h-10 w-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                  <Zap size={20} />
                </div>
                <h3 className="text-lg font-bold text-foreground">Fast Sales & POS</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Record trades quickly. Complete tracking compatibility for Cash, M-Pesa statements, and Card transactions on any desktop screen or mobile responsive device.
                </p>
              </div>

              <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm space-y-4">
                <div className="h-10 w-10 bg-brand-secondary/10 rounded-xl flex items-center justify-center text-brand-secondary">
                  <Package size={20} />
                </div>
                <h3 className="text-lg font-bold text-foreground">Inventory Management</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Real-time item deduction counts. Receive push indicators for low-performing counts and critical items before shelves are emptied unexpectedly.
                </p>
              </div>

              <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm space-y-4">
                <div className="h-10 w-10 bg-brand-accent/10 rounded-xl flex items-center justify-center text-brand-accent">
                  <Users size={20} />
                </div>
                <h3 className="text-lg font-bold text-foreground">Staff Accountability</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Enforce quick authentication handling on shared counter equipment via our native 4-digit PIN access security structure. Lock down transaction tracking records securely.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
           SECTION 3: THREE-TIER SUBSCRIPTION ARCHITECTURE
        ========================================================= */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h2 className="text-h2 font-bold tracking-tight text-foreground">
              Simple Pricing. No Hidden Fees.
            </h2>
            <p className="text-muted text-sm sm:text-base">
              All plans include a 14-day trial of our Ndovu capabilities. Select the layout path optimized for your scale targets.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Basic Plan */}
            <div className="bg-card p-8 rounded-2xl border border-border/60 shadow-sm flex flex-col justify-between min-h-[480px]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Basic Plan</h3>
                  <p className="text-xs text-muted mt-1">Single shop starters transitioning from paper.</p>
                </div>
                <div className="pt-2">
                  <span className="text-3xl font-bold font-mono text-foreground">KSh 1,490</span>
                  <span className="text-xs text-muted font-medium"> / month</span>
                </div>
                <div className="border-t border-border/60 pt-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-xs text-muted">
                    <CheckCircle2 size={14} className="text-brand-primary shrink-0" /> 1 Business Allocation Limit
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted">
                    <CheckCircle2 size={14} className="text-brand-primary shrink-0" /> Up to 3 Staff Accounts
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted">
                    <CheckCircle2 size={14} className="text-brand-primary shrink-0" /> 300 Products Catalog Limit
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted">
                    <CheckCircle2 size={14} className="text-brand-primary shrink-0" /> Digital Receipts & Cashier Registers
                  </div>
                </div>
              </div>
              <Link href="/org" className="pt-8 block">
                <Button variant="outline" size="md" className="w-full">Select Basic</Button>
              </Link>
            </div>

            {/* Ndovu Plan (Featured) */}
            <div className="bg-card p-8 rounded-2xl border-2 border-brand-primary shadow-lift relative flex flex-col justify-between min-h-[520px] lg:-translate-y-4">
              <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                Most Popular
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Store size={18} className="text-brand-primary" /> Ndovu Plan
                  </h3>
                  <p className="text-xs text-muted mt-1">Growing SMEs managing multiple retail branches.</p>
                </div>
                <div className="pt-2">
                  <span className="text-4xl font-bold font-mono text-foreground">KSh 3,990</span>
                  <span className="text-xs text-muted font-medium"> / month</span>
                </div>
                <div className="border-t border-brand-primary/20 pt-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                    <CheckCircle2 size={14} className="text-brand-accent shrink-0" /> Up to 5 Branch Operations
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                    <CheckCircle2 size={14} className="text-brand-accent shrink-0" /> Unlimited Counter Staff Accounts
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                    <CheckCircle2 size={14} className="text-brand-accent shrink-0" /> 5,000 Products Catalog Capacity
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                    <CheckCircle2 size={14} className="text-brand-accent shrink-0" /> Custom Receipt Logs & Branding
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                    <CheckCircle2 size={14} className="text-brand-accent shrink-0" /> Full Profit & Loss Statements
                  </div>
                </div>
              </div>
              <Link href="/org" className="pt-8 block">
                <Button variant="primary" size="lg" className="w-full">Get Started Now</Button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-card p-8 rounded-2xl border border-border/60 shadow-sm flex flex-col justify-between min-h-[480px]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Enterprise</h3>
                  <p className="text-xs text-muted mt-1">Complex setups, wholesaling, and large teams.</p>
                </div>
                <div className="pt-2">
                  <span className="text-3xl font-bold font-mono text-foreground">KSh 9,990</span>
                  <span className="text-xs text-muted font-medium"> + / month</span>
                </div>
                <div className="border-t border-border/60 pt-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-xs text-muted">
                    <CheckCircle2 size={14} className="text-brand-secondary shrink-0" /> Unlimited Branch Configurations
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted">
                    <CheckCircle2 size={14} className="text-brand-secondary shrink-0" /> Full M-Pesa Core API Automation
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted">
                    <CheckCircle2 size={14} className="text-brand-secondary shrink-0" /> Advanced Multi-Tenant Audit Trails
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-muted">
                    <CheckCircle2 size={14} className="text-brand-secondary shrink-0" /> Dedicated Local Account Support
                  </div>
                </div>
              </div>
              <Link href="mailto:support@tawala.io" className="pt-8 block">
                <Button variant="outline" size="md" className="w-full">Contact Sales</Button>
              </Link>
            </div>

          </div>
        </section>

        {/* =========================================================
           SECTION 4: LOCAL TRUST ARCHITECTURE FOOTER
        ========================================================= */}
        <footer className="w-full border-t border-border/60 bg-surface/30 py-12 relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-sm font-bold text-foreground">Tawala Platform</p>
              <p className="text-xs text-muted">Tawala biashara yako. Take control of your business.</p>
            </div>
            <p className="text-xs text-muted tabular-nums">
              &copy; {new Date().getFullYear()} Tawala. All rights reserved.
            </p>
          </div>
        </footer>

      </main>
    </>
  );
}