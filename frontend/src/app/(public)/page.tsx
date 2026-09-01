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
  title: "Stop Shop Leakages & Track Daily Profits",
  description:
    "Eliminate stock leakages, hold staff accountable with PIN login, and see real daily net profits. Built for Kenyan retail shops, minimarts, and pharmacies.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Tawala | Stop Shop Leakages & Track Daily Profits",
    description:
      "Eliminate stock leakages, hold staff accountable with PIN login, and see real daily net profits. Built for Kenyan retail shops, minimarts, and pharmacies.",
    url: "https://tawala.nethub.co.ke",
  },
};

const TRIAL_HREF = "/onboarding/personal-details";
const LOGIN_HREF = "/login";

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tawala",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Android, iOS, Windows",
    description:
      "Business management system for Kenyan SMEs. Stop stock leakages, manage staff with PIN login, track inventory, and see real daily net profit.",
    url: "https://tawala.nethub.co.ke",
    offers: {
      "@type": "Offer",
      price: "1490",
      priceCurrency: "KES",
      description: "Plans from KSh 1,490/month · 14-day free trial",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-foreground selection:bg-brand-primary/20">
        <section className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 pb-16 pt-8 sm:px-6 md:pb-24 md:pt-16 lg:grid-cols-12 lg:px-8">
          <div className="flex flex-col space-y-6 lg:col-span-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">
              <Sparkles size={14} className="shrink-0" aria-hidden="true" />
              <span>Zero hardware required · Works on any phone or PC</span>
            </div>

            <h1 className="text-h1 text-foreground">
              Tawala Biashara Yako{" "}
              <span className="text-gradient">Bila Stress na Leakage.</span>
            </h1>

            <p className="max-w-xl text-muted">
              Stop relying on exercise books and unverified cash counters.
              Track counter sales, block stock theft, and see your true daily
              net profit — built for Kenyan retail shops, minimarts, and
              pharmacies.
            </p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link href={TRIAL_HREF} className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-none bg-linear-to-r from-brand-primary to-brand-secondary text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:shadow-glow sm:min-w-[220px]"
                >
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </Link>
              <Link href="#how-it-works" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="min-h-[48px] w-full rounded-xl border-border/80 text-xs font-bold uppercase tracking-wider hover:bg-card"
                >
                  See How It Works
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted">
              From <span className="font-semibold text-foreground">KSh 1,490/mo</span>
              {" · "}No credit card{" · "}M-Pesa ready{" · "}Local support
            </p>

            <p className="text-sm text-muted">
              Already have an account?{" "}
              <Link
                href={LOGIN_HREF}
                className="font-semibold text-brand-primary underline-offset-2 hover:underline"
              >
                Log in
              </Link>
            </p>

            <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-500" aria-hidden="true" />
                <span className="text-xs font-medium text-muted">No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-500" aria-hidden="true" />
                <span className="text-xs font-medium text-muted">5-min setup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-500" aria-hidden="true" />
                <span className="text-xs font-medium text-muted">M-Pesa ready</span>
              </div>
            </div>
          </div>

          <div className="relative w-full lg:col-span-6">
            <div
              className="pointer-events-none absolute -inset-1 rounded-3xl bg-linear-to-r from-brand-primary/20 via-brand-secondary/20 to-brand-accent/20 opacity-70 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative space-y-4 rounded-2xl border border-border/80 bg-card/90 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Live Shop Command
                  </span>
                </div>
                <span className="rounded-md border border-border/40 bg-surface px-2 py-0.5 text-xs font-semibold text-muted">
                  Today&apos;s Ledger
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-foreground to-slate-900 p-4 text-white shadow-md">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">
                    Net Profit (After Expenses)
                  </p>
                  <p className="mt-1 font-mono text-2xl font-black tracking-tight text-emerald-400">
                    KES 18,450.00
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                  <TrendingUp size={20} aria-hidden="true" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle size={16} className="shrink-0 text-amber-500" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Stock audit discrepancy flagged
                      </p>
                      <p className="text-xs text-muted">
                        2 units Cooking Oil unaccounted for at shift handover.
                      </p>
                    </div>
                  </div>
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-xs font-bold uppercase text-amber-600 dark:text-amber-400">
                    Flagged
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface p-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className="shrink-0 text-brand-primary" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Counter staff accountable
                      </p>
                      <p className="text-xs text-muted">
                        Staff PIN #204 (John) · Till balance verified
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-500">100% Match</span>
                </div>
              </div>

              <Link
                href={TRIAL_HREF}
                className="group flex w-full items-center justify-between rounded-xl border border-brand-primary/20 bg-brand-primary/10 p-3 transition-colors hover:bg-brand-primary/15"
              >
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-brand-primary" aria-hidden="true" />
                  <span className="text-sm font-bold text-foreground">
                    Test your shop metrics in 60 seconds
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  className="text-brand-primary transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </section>

        <section className="relative z-10 w-full border-y border-border/50 bg-surface/50 py-10">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 text-center sm:px-6 md:grid-cols-4 lg:px-8">
            <div className="space-y-1">
              <p className="font-mono text-2xl font-black text-gradient sm:text-3xl">Stock clarity</p>
              <p className="text-xs font-medium text-muted">Every sale updates inventory in real time</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-2xl font-black text-foreground sm:text-3xl">M-Pesa ready</p>
              <p className="text-xs font-medium text-muted">Cash, Buy Goods, and store credit in one flow</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-2xl font-black text-brand-secondary sm:text-3xl">&lt; 3 secs</p>
              <p className="text-xs font-medium text-muted">Typical counter sale record</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-2xl font-black text-brand-accent sm:text-3xl">24 / 7</p>
              <p className="text-xs font-medium text-muted">Owner visibility from anywhere</p>
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl space-y-3 text-center">
            <h2 className="text-h2">Built for how Kenyan shops actually run</h2>
            <p className="text-muted">
              Owners use Tawala to replace exercise books with clear sales, stock, and staff accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <figure className="flex flex-col justify-between space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <blockquote className="text-sm leading-relaxed text-foreground">
                “I finally see which items are leaking and which staff closed the till clean. The daily profit view alone paid for the subscription.”
              </blockquote>
              <figcaption className="border-t border-border/40 pt-3 text-xs text-muted">
                <span className="font-semibold text-foreground">Minimart owner</span>
                {" · "}Nairobi
              </figcaption>
            </figure>

            <figure className="flex flex-col justify-between space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <blockquote className="text-sm leading-relaxed text-foreground">
                “PIN login on the shared counter phone changed everything. Every sale and discount is tied to a person now.”
              </blockquote>
              <figcaption className="border-t border-border/40 pt-3 text-xs text-muted">
                <span className="font-semibold text-foreground">Pharmacy manager</span>
                {" · "}Kisumu
              </figcaption>
            </figure>

            <figure className="flex flex-col justify-between space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <blockquote className="text-sm leading-relaxed text-foreground">
                “We run two hardware branches from one login. Stock and staff reports used to take the whole evening — now it is minutes.”
              </blockquote>
              <figcaption className="border-t border-border/40 pt-3 text-xs text-muted">
                <span className="font-semibold text-foreground">Hardware shop owner</span>
                {" · "}Mombasa
              </figcaption>
            </figure>
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            Illustrative owner feedback for layout — replace with verified customer quotes when available.
          </p>
        </section>

        <section
          id="how-it-works"
          className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
            <h2 className="text-h2">Designed to protect every shilling</h2>
            <p className="text-muted">
              No complex setups. Tawala turns daily operations into a simple, airtight system you can access from your phone.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <Smartphone size={22} aria-hidden="true" />
                </div>
                <h3 className="text-h3">Lightning-fast counter sales</h3>
                <p className="text-sm leading-relaxed text-muted">
                  Record trades in seconds on Android phones or laptops. Categorise cash, M-Pesa Buy Goods, and customer store credit in one flow.
                </p>
              </div>
              <div className="flex items-center gap-1.5 border-t border-border/30 pt-2 text-xs font-bold text-brand-primary">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>Zero counter delays</span>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-secondary/10 text-brand-secondary">
                  <Package size={22} aria-hidden="true" />
                </div>
                <h3 className="text-h3">Automatic stock leak block</h3>
                <p className="text-sm leading-relaxed text-muted">
                  Every sale reduces inventory counts. Get alerts when fast-moving stock runs low or numbers mismatch staff entries.
                </p>
              </div>
              <div className="flex items-center gap-1.5 border-t border-border/30 pt-2 text-xs font-bold text-brand-secondary">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>Low-stock & mismatch alerts</span>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
                  <Users size={22} aria-hidden="true" />
                </div>
                <h3 className="text-h3">Staff PIN accountability</h3>
                <p className="text-sm leading-relaxed text-muted">
                  4-digit PIN locks on shared counter phones. Every sale, discount, or cancelled receipt is logged to the active employee.
                </p>
              </div>
              <div className="flex items-center gap-1.5 border-t border-border/30 pt-2 text-xs font-bold text-brand-accent">
                <CheckCircle2 size={13} aria-hidden="true" />
                <span>Full audit trail</span>
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 w-full border-t border-border/60 bg-surface/50 py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="relative space-y-8 overflow-hidden rounded-3xl border border-brand-primary/30 bg-gradient-to-br from-card via-card to-brand-primary/5 p-8 text-center shadow-xl sm:p-12">
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-primary/20 blur-3xl"
                aria-hidden="true"
              />

              <div className="mx-auto max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Clock size={14} aria-hidden="true" />
                  <span>Setup takes less than 5 minutes</span>
                </div>

                <h2 className="text-h2 tracking-tight">
                  Ready to stop losing money in your shop?
                </h2>

                <p className="text-muted">
                  Start free for 14 days. Plans from{" "}
                  <span className="font-semibold text-foreground">KSh 1,490/month</span>.
                  No credit card required.
                </p>
              </div>

              <div className="mx-auto max-w-md space-y-4">
                <Link href={TRIAL_HREF} className="block w-full">
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-linear-to-r from-brand-primary to-brand-secondary text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all duration-300 hover:shadow-glow"
                  >
                    <span>Start 14-Day Free Trial Now</span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                </Link>

                <p className="flex items-center justify-center gap-2 text-xs text-muted">
                  <Lock size={12} className="text-brand-primary" aria-hidden="true" />
                  <span>No credit card required. Full access during trial.</span>
                </p>

                <p className="text-sm text-muted">
                  Already registered?{" "}
                  <Link
                    href={LOGIN_HREF}
                    className="font-semibold text-brand-primary underline-offset-2 hover:underline"
                  >
                    Log in
                  </Link>
                </p>
              </div>

              <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 border-t border-border/40 pt-6 text-left sm:grid-cols-3">
                <div className="flex items-start gap-2.5">
                  <Building2 size={18} className="mt-0.5 shrink-0 text-brand-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Multi-branch ready</p>
                    <p className="text-xs text-muted">Manage 1 or many shops from one login.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Smartphone size={18} className="mt-0.5 shrink-0 text-brand-secondary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Works on any device</p>
                    <p className="text-xs text-muted">Use existing smartphones, tablets, or PCs.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-brand-accent" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Local support</p>
                    <p className="text-xs text-muted">Kenyan onboarding assistance when you need it.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="relative z-10 w-full border-t border-border/60 bg-surface/30 py-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
              <div className="space-y-2 text-center sm:text-left">
                <p className="text-sm font-bold text-foreground">Tawala</p>
                <p className="max-w-sm text-sm text-muted">
                  Tawala biashara yako. Take control of your business profits.
                </p>
              </div>

              <nav
                aria-label="Footer"
                className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
              >
                <Link href="/onboarding/plans" className="text-muted hover:text-foreground">
                  Pricing
                </Link>
                <Link href="/solutions" className="text-muted hover:text-foreground">
                  Solutions
                </Link>
                <Link href="/support" className="text-muted hover:text-foreground">
                  Support
                </Link>
                <Link href={LOGIN_HREF} className="text-muted hover:text-foreground">
                  Log in
                </Link>
                <Link href="/legal/terms" className="text-muted hover:text-foreground">
                  Terms
                </Link>
                <Link href="/legal/privacy" className="text-muted hover:text-foreground">
                  Privacy
                </Link>
              </nav>
            </div>

            <p className="text-center text-xs text-muted tabular-nums sm:text-left">
              &copy; {new Date().getFullYear()} Tawala · Nethub. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
