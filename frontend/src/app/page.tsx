import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, LayoutGrid, CheckCircle2, ShoppingBag, BarChart3, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Tawala POS | Business Management for Kenyan SMEs",
  description:
    "Tawala helps Kenyan businesses manage sales, stock, staff, and growth from one simple platform. Move from manual biashara to structured business management.",
  alternates: {
    canonical: "/",
  },
};

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tawala POS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    description:
      "Business management platform for Kenyan SMEs to manage sales, inventory, staff, and growth.",
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

      <main id="main-content">
        <section
          className="relative min-h-screen w-full flex items-center overflow-hidden px-4 sm:px-6 py-12 md:py-24 lg:py-32 bg-background"
          aria-labelledby="hero-title"
        >
          {/* Ambient Brand Glow Layer using global ring token */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full bg-[var(--ring)] opacity-60 blur-[120px] rounded-full pointer-events-none will-change-transform"
            aria-hidden="true"
          />

          <div className="container mx-auto max-w-7xl relative z-10 w-full">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* LEFT: HERO CONVERSION COPY */}
              <div className="lg:col-span-7 flex flex-col space-y-8 text-center lg:text-left justify-center">
                <header className="inline-flex items-center gap-2 self-center lg:self-start bg-primary/10 border border-primary/20 px-4 py-2 rounded-full">
                  <Sparkles size={14} className="text-primary" aria-hidden="true" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    Tawala Biashara Yako
                  </span>
                </header>

                <div className="space-y-6">
                  <h1 id="hero-title" className="h1 text-3xl lg:text-[4rem] tracking-tighter leading-[1.05] text-foreground font-extrabold">
                    From Hustle to Structure.
                    <br />
                    <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">
                      Stop Guessing, Start Growing.
                    </span>
                  </h1>

                  <p className="max-w-xl text-base md:text-lg text-secondary font-medium leading-relaxed mx-auto lg:mx-0">
                    Ditch the notebooks, manual bookkeeping, and sales leakages. Tawala transforms manual retail confusion into an organized, automated, and powerful digital business partner built specifically for Kenyan SMEs.
                  </p>
                </div>

                {/* Conversion Focused CTAs (Fitts's Law Optimized Targets) */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/terminal"
                    className="group btn flex h-14 sm:h-16 min-w-[240px] items-center justify-center gap-3 rounded-2xl bg-primary px-8 text-base font-black text-white shadow-soft hover:brightness-110 transition-all"
                  >
                    Start Selling Now
                    <ArrowRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Link>

                  <Link
                    href="#demo"
                    className="btn flex h-14 sm:h-16 min-w-[200px] items-center justify-center gap-3 rounded-2xl border border-border bg-card px-8 text-base font-bold text-foreground hover:bg-primary/5 transition-colors"
                  >
                    Book A Live Demo
                  </Link>
                </div>

                {/* Native Business Feature Badges */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-2.5 pt-4">
                  <TrustBadge icon={<ShoppingBag size={14} />} text="Sales Tracking" />
                  <TrustBadge icon={<LayoutGrid size={14} />} text="Stock Control" />
                  <TrustBadge icon={<BarChart3 size={14} />} text="Real-time Profits" />
                  <TrustBadge icon={<Users size={14} />} text="Staff Accountability" />
                </div>
              </div>

              {/* RIGHT: LIVE UI DEEP BRAND ARCHITECTURE VISUALIZATION */}
              <div className="lg:col-span-5 relative w-full px-2 sm:px-0">
                <div className="relative mx-auto max-w-md lg:max-w-none w-full aspect-[4/3.8] bg-card rounded-[2rem] border-4 sm:border-[10px] border-foreground shadow-soft overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
                  <div className="p-4 sm:p-6 h-full flex flex-col bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                    
                    {/* UI Header Representation */}
                    <div className="flex justify-between items-center mb-6 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center text-white text-[10px] font-black">T</div>
                        <div className="h-3 w-20 bg-foreground rounded-full" />
                      </div>
                      <div className="h-6 px-2.5 bg-primary/10 rounded-full border border-primary/20 flex items-center">
                        <span className="text-[9px] font-bold text-primary tracking-wider uppercase">Live Terminal</span>
                      </div>
                    </div>

                    {/* Quick Access POS Grid Block (From globals.css layer definitions) */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-background rounded-xl border border-border flex flex-col p-2 justify-between items-start"
                        >
                          <div className="h-2 w-3/4 bg-secondary/30 rounded-full" />
                          <div className="h-3 w-1/2 bg-primary/20 rounded-full mt-auto" />
                        </div>
                      ))}
                    </div>

                    {/* Transaction Audit Snapshot Container */}
                    <div className="mt-auto space-y-2">
                      <div className="p-3 glass rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-primary" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-foreground leading-none">Stock Levels Auto-Updated</p>
                            <p className="text-[9px] text-secondary leading-none">0 items missing</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-foreground">100% Secure</span>
                      </div>

                      {/* Summary Pricing Action Bar */}
                      <div className="h-14 bg-foreground rounded-xl flex items-center px-4 justify-between dark:bg-primary/20 dark:border dark:border-primary/30">
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-secondary uppercase font-bold tracking-wider">Total Sales (Today)</p>
                          <p className="text-xs font-black text-background dark:text-foreground">KES 48,250.00</p>
                        </div>
                        <div className="h-8 px-4 bg-primary text-white text-[11px] font-black rounded-lg flex items-center justify-center shadow-md">
                          Print Receipt
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Secondary Background Glow Point */}
                <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-primary/20 blur-2xl rounded-full pointer-events-none" />
              </div>

            </div>
          </div>
        </section>
      </main>
    </>
  );
}

interface TrustBadgeProps {
  icon: React.ReactNode;
  text: string;
}

function TrustBadge({ icon, text }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm">
      <span className="text-primary" aria-hidden="true">
        {icon}
      </span>
      <span className="text-[10px] font-extrabold text-foreground uppercase tracking-wider">
        {text}
      </span>
    </div>
  );
}