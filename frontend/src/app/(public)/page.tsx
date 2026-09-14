import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Package,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { ProductPreviewCard } from "@/lib/components/marketing/ProductPreviewCard";

export const metadata: Metadata = {
  title: "Stop Shop Leakages & Track Daily Profits",
  description:
    "Eliminate stock leakages, hold staff accountable with PIN login, and see real daily net profits. Built for Kenyan retail shops, minimarts, and pharmacies.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Tawala | Stop Shop Leakages & Track Daily Profits",
    description:
      "Eliminate stock leakages, hold staff accountable with PIN login, and see real daily net profits. Built for Kenyan retail shops, minimarts, and pharmacies.",
    url: "https://tawala.nethub.co.ke",
  },
};

const TRIAL_HREF = "/onboarding/personal-details";
const LOGIN_HREF = "/login";
const PLANS_HREF = "/onboarding/plans";

const BENEFITS = [
  {
    icon: Zap,
    title: "Sell in seconds",
    desc: "Cash, M-Pesa, and store credit on any phone or PC — no special hardware.",
  },
  {
    icon: Package,
    title: "Stop stock leaks",
    desc: "Every sale updates inventory. Low-stock and mismatch alerts keep shelves honest.",
  },
  {
    icon: Users,
    title: "Staff on PIN",
    desc: "Shared devices, personal accountability. Every sale and discount ties to a person.",
  },
  {
    icon: ShieldCheck,
    title: "See real profit",
    desc: "Daily net that accounts for stock and credit — not just till cash.",
  },
] as const;

const STEPS = [
  {
    n: "1",
    title: "Create your account",
    desc: "Name and email — about two minutes.",
  },
  {
    n: "2",
    title: "Start the trial",
    desc: "14 days on Ndovu. No credit card.",
  },
  {
    n: "3",
    title: "Run the shop",
    desc: "Add stock, staff PINs, and sell.",
  },
] as const;

const FAQS = [
  {
    q: "How much does Tawala cost?",
    a: "Plans start at KSh 1,490 per month. Self-serve trial is 14 days on Ndovu with no credit card required.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes. Android, iPhone, tablet, or PC. No special hardware required.",
  },
  {
    q: "How does it reduce stock theft?",
    a: "Sales and adjustments are tied to staff PIN login. Real-time stock alerts flag mismatches quickly.",
  },
  {
    q: "Multiple shops?",
    a: "Yes. Ndovu and above support multiple branches under one organisation.",
  },
] as const;

const TRUST = [
  "Built for Kenyan retail",
  "M-Pesa-ready checkout",
  "PIN staff accountability",
  "14-day free trial",
] as const;

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-20">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
              Modern retail OS for Kenyan shops
            </p>
            <h1 className="text-h1 text-foreground">
              Stop leakages.{" "}
              <span className="text-brand-primary">See real daily profit.</span>
            </h1>
            <p className="max-w-xl text-base text-muted sm:text-lg">
              Tawala ties every sale to stock and staff PIN — so cash, M-Pesa, and
              credit stay honest from counter to close of day.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={TRIAL_HREF}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-brand-primary px-6 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                Start free trial
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link
                href={PLANS_HREF}
                className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-card px-6 text-sm font-semibold text-foreground transition hover:bg-register focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                See pricing
              </Link>
            </div>
            <p className="text-xs text-muted">
              14 days free · No card required · Cancel anytime
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <ProductPreviewCard />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section
        aria-label="Highlights"
        className="border-b border-border bg-card/60"
      >
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
          {TRUST.map((t) => (
            <li
              key={t}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted sm:text-sm"
            >
              <CheckCircle2
                size={16}
                className="text-brand-accent"
                aria-hidden
              />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Benefits */}
      <section className="section-padding mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-h2 text-foreground">Built for the counter</h2>
          <p className="mt-2 text-sm text-muted sm:text-base">
            Less paperwork. Fewer surprises at month-end. More control on the
            floor.
          </p>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, desc }) => (
            <li
              key={title}
              className="rounded-md border border-border bg-card p-5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-register text-brand-primary">
                <Icon size={20} aria-hidden />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-muted">{desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-card/40">
        <div className="section-padding mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-h2 text-foreground">Live in three steps</h2>
            <p className="mt-2 text-sm text-muted">
              From sign-up to first sale without a long setup project.
            </p>
          </div>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="relative rounded-md border border-border bg-card p-5"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white">
                  {s.n}
                </span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{s.desc}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex justify-center">
            <Link
              href={TRIAL_HREF}
              className="inline-flex h-12 items-center gap-2 rounded-md bg-brand-primary px-6 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              Start free trial
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-h2 text-foreground">Questions</h2>
        <dl className="mt-8 space-y-4">
          {FAQS.map((f) => (
            <div
              key={f.q}
              className="rounded-md border border-border bg-card px-5 py-4"
            >
              <dt className="text-sm font-semibold text-foreground">{f.q}</dt>
              <dd className="mt-1.5 text-sm text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-brand-primary">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Ready to take control of the till?
            </h2>
            <p className="mt-1 text-sm text-white/80">
              14-day trial · No credit card · Built for Kenyan retail
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={TRIAL_HREF}
              className="inline-flex h-12 items-center justify-center rounded-md bg-card px-6 text-sm font-semibold text-brand-primary hover:opacity-95"
            >
              Start free trial
            </Link>
            <Link
              href={LOGIN_HREF}
              className="inline-flex h-12 items-center justify-center rounded-md border border-white/30 px-6 text-sm font-semibold text-white hover:bg-white/10"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-sm font-semibold text-foreground">Tawala</p>
              <p className="max-w-sm text-sm text-muted">
                Tawala biashara yako. Take control of your business profits.
              </p>
            </div>
            <nav
              aria-label="Footer"
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
            >
              <Link href={PLANS_HREF} className="text-muted hover:text-foreground">
                Pricing
              </Link>
              <Link href="/solutions" className="text-muted hover:text-foreground">
                Solutions
              </Link>
              <Link href="/support" className="text-muted hover:text-foreground">
                Support
              </Link>
              <Link href="/blog" className="text-muted hover:text-foreground">
                Blog
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
          <p className="text-center text-xs text-muted sm:text-left">
            © {new Date().getFullYear()} Tawala · Nethub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
