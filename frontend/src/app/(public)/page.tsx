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
  title: "Tawala biashara yako bila stress | Shop POS for Kenya",
  description:
    "Tawala is a modern retail OS for Kenyan shops, minimarts, and pharmacies. Sell with cash and M-Pesa, keep stock honest, track store credit, and see real daily profit — on any phone or PC. 14-day free trial.",
  keywords: [
    "shop POS Kenya",
    "retail software Kenya",
    "minimart POS",
    "pharmacy inventory Kenya",
    "M-Pesa POS",
    "stock management Kenya",
    "store credit tracking",
    "Tawala POS",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Tawala biashara yako bila stress",
    description:
      "Modern retail OS for Kenyan shops: sales, stock, staff, store credit, and daily profit — without the stress.",
    url: "https://tawala.nethub.co.ke",
    type: "website",
    locale: "en_KE",
    siteName: "Tawala",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Tawala — retail OS for Kenyan shops",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tawala biashara yako bila stress",
    description:
      "Shop POS built for Kenya — cash, M-Pesa, stock, credit, and real profit.",
    images: ["/og-default.png"],
  },
};

const TRIAL_HREF = "/onboarding/personal-details";
const LOGIN_HREF = "/login";
const PLANS_HREF = "/onboarding/plans";

const BENEFITS = [
  {
    icon: Zap,
    title: "Checkout that matches the counter",
    desc: "Cash, M-Pesa, and store credit in one flow — on the phone you already use. No bulky till required.",
  },
  {
    icon: Package,
    title: "Stock that matches the shelf",
    desc: "Every sale reduces inventory automatically. Low-stock alerts and simple counts catch shrink before month-end surprises.",
  },
  {
    icon: Users,
    title: "Know who did what",
    desc: "Shared devices with personal PIN sessions so discounts, voids, and sales are attributable — useful for coaching, not just blame.",
  },
  {
    icon: ShieldCheck,
    title: "Profit you can trust at close of day",
    desc: "See net that accounts for stock movement and open credit — not only what is left in the drawer.",
  },
] as const;

const WHY = [
  {
    title: "Built for Kenyan retail reality",
    desc: "M-Pesa-ready checkout, store credit (deni), multi-branch when you grow, and language that matches how shops actually run.",
  },
  {
    title: "Less paper, fewer arguments",
    desc: "One system for sales, stock, and staff activity so owners stop reconciling three notebooks at night.",
  },
  {
    title: "Start in minutes, not a project",
    desc: "14-day trial, no card up front. Add products, set PINs, and take the first sale the same day.",
  },
] as const;

const COMPARE = [
  {
    title: "Exercise book or Excel",
    pain: "Sales in one place, stock in another, credit in your head — night-end math and missing stock.",
    better: "Tawala keeps till, shelf, and deni in one system so close of day is a report, not a fight.",
  },
  {
    title: "Imported POS kits",
    pain: "Hardware lock-in, foreign support hours, and features aimed at big chains — not a single minimart.",
    better: "Browser-based on the phone you already own. Cash, M-Pesa, and store credit without a project team.",
  },
  {
    title: "“We’ll fix it later”",
    pain: "Leakages and open credit only show up at month-end — when the money is already gone.",
    better: "Live stock and open-credit totals so you act the same week, not next month.",
  },
] as const;

const VERTICALS = [
  {
    title: "Retail & minimarts",
    desc: "Fast checkout, low-stock alerts, and multi-branch when you grow.",
    href: "/solutions/retail",
  },
  {
    title: "Pharmacies",
    desc: "Batch-aware stock habits and accountable till sessions for chemists.",
    href: "/solutions/pharmacy",
  },
  {
    title: "Wholesale counters",
    desc: "Larger tickets, customer credit, and stock that matches the store.",
    href: "/solutions/wholesale",
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
    title: "Start the free trial",
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
    q: "What is Tawala?",
    a: "Tawala is retail software for Kenyan shops — a POS and back office for sales (cash, M-Pesa, store credit), inventory, staff activity, and daily profit. It runs in the browser on phones, tablets, and PCs.",
  },
  {
    q: "How much does Tawala cost?",
    a: "Plans start at KSh 1,490 per month. Self-serve trial is 14 days on Ndovu with no credit card required. You can upgrade or cancel before the trial ends.",
  },
  {
    q: "Can I use Tawala on my phone?",
    a: "Yes. Android, iPhone, tablet, or PC. No special barcode hardware is required to start — optional scanners work when you are ready.",
  },
  {
    q: "How does Tawala help with stock losses?",
    a: "Stock updates when you sell, so the system quantity should match the shelf. You can run simple counts, see differences, and investigate shortages early — instead of discovering missing stock only at month-end. PIN sessions show who was on the till when issues happened; they support investigation, they are not a magic anti-theft device by themselves.",
  },
  {
    q: "Does Tawala support M-Pesa and store credit?",
    a: "Yes. Record cash, M-Pesa, and customer credit (deni) at checkout. Open credit stays visible so you can collect later and still see real exposure.",
  },
  {
    q: "Can I manage more than one shop?",
    a: "Yes. Ndovu and above support multiple branches under one organisation, with a shared team and per-branch stock and sales.",
  },
] as const;

const TRUST = [
  "Built for Kenyan retail",
  "Cash · M-Pesa · store credit",
  "Phone or PC — no till required",
  "14-day free trial",
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: f.a,
    },
  })),
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tawala",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "1490",
    priceCurrency: "KES",
    description: "Plans from KSh 1,490/month; 14-day free trial",
  },
  description:
    "Modern retail OS for Kenyan shops: POS, inventory, staff PINs, store credit, and daily profit.",
  url: "https://tawala.nethub.co.ke",
  inLanguage: "en-KE",
};

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 0%, color-mix(in srgb, var(--brand-primary) 12%, transparent), transparent 55%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-14 lg:px-8 lg:py-24">
          <div className="space-y-7">
            <p className="inline-flex items-center rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-primary">
              Retail OS for Kenyan shops
            </p>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
              Tawala biashara yako{" "}
              <span className="text-brand-primary">bila stress</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              One place for sales, stock, staff, and store credit — so you close
              the day knowing what left the shelf, what was paid, and what is
              still owed. Built for minimarts, chemists, and growing retail.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={TRIAL_HREF}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-brand-primary px-7 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
              >
                Start free trial
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link
                href={PLANS_HREF}
                className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-card px-7 text-sm font-semibold text-foreground transition hover:bg-register focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                See pricing
              </Link>
            </div>
            <p className="text-xs font-medium text-muted">
              14 days free · No card required · Cancel anytime
            </p>
            <p className="text-sm text-muted">
              Plans from{" "}
              <span className="font-semibold tabular text-foreground">
                KSh 1,490
              </span>
              /month after trial.{" "}
              <Link
                href={PLANS_HREF}
                className="font-semibold text-brand-primary hover:underline"
              >
                Compare plans
              </Link>
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
        className="border-b border-border bg-card/70"
      >
        <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
          {TRUST.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-2 text-xs font-semibold text-muted sm:text-sm"
            >
              <CheckCircle2
                size={16}
                className="text-brand-accent"
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Audience / soft proof — honest, no fabricated logos */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted">
            Built for owners who run the floor
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            <li className="rounded-md border border-border bg-card px-4 py-3 text-center text-sm text-muted">
              <span className="block font-semibold text-foreground">Minimarts &amp; dukas</span>
              Fast till, stock that matches the shelf
            </li>
            <li className="rounded-md border border-border bg-card px-4 py-3 text-center text-sm text-muted">
              <span className="block font-semibold text-foreground">Pharmacies</span>
              Accountable sessions and tighter inventory
            </li>
            <li className="rounded-md border border-border bg-card px-4 py-3 text-center text-sm text-muted">
              <span className="block font-semibold text-foreground">Growing multi-branch</span>
              One organisation, many counters
            </li>
          </ul>
        </div>
      </section>

      {/* Why Tawala */}
      <section className="section-padding mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-h2 text-foreground">Why shop owners choose Tawala</h2>
          <p className="mt-2 text-sm text-muted sm:text-base">
            Not another generic spreadsheet — a counter-first system for how
            Kenyan retail actually works.
          </p>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {WHY.map((w) => (
            <li
              key={w.title}
              className="rounded-md border border-border bg-card p-5"
            >
              <h3 className="text-sm font-semibold text-foreground">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{w.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Benefits */}
      <section className="border-y border-border bg-card/40">
        <div className="section-padding mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-h2 text-foreground">What you get on the floor</h2>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Clear jobs for the till, the stockroom, and close of day.
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
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* vs alternatives */}
      <section className="section-padding mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-h2 text-foreground">Why not stay on paper?</h2>
          <p className="mt-2 text-sm text-muted sm:text-base">
            Most shops already “have a system.” Tawala replaces the fragile ones.
          </p>
        </div>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {COMPARE.map((c) => (
            <li
              key={c.title}
              className="flex flex-col rounded-md border border-border bg-card p-5"
            >
              <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                <span className="font-medium text-brand-secondary">Today: </span>
                {c.pain}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                <span className="font-medium text-brand-primary">With Tawala: </span>
                {c.better}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Verticals */}
      <section className="border-y border-border bg-card/40">
        <div className="section-padding mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-h2 text-foreground">Built for how you sell</h2>
            <p className="mt-2 text-sm text-muted sm:text-base">
              Same core — checkout, stock, credit — tuned to your counter.
            </p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {VERTICALS.map((v) => (
              <li key={v.href}>
                <Link
                  href={v.href}
                  className="flex h-full flex-col rounded-md border border-border bg-card p-5 transition-colors hover:border-brand-primary/30 hover:bg-register focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                >
                  <h3 className="text-sm font-semibold text-foreground">
                    {v.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {v.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary">
                    Learn more
                    <ArrowRight size={14} aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="section-padding mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
      </section>

      {/* FAQ */}
      <section className="border-t border-border bg-card/40">
        <div className="section-padding mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-h2 text-foreground">
            Questions owners ask
          </h2>
          <dl className="mt-8 space-y-3">
            {FAQS.map((f) => (
              <div
                key={f.q}
                className="rounded-md border border-border bg-card px-5 py-4"
              >
                <dt className="text-sm font-semibold text-foreground">{f.q}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted">
                  {f.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-brand-primary">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Tawala biashara yako bila stress
            </h2>
            <p className="mt-1 text-sm text-white/85">
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
    </div>
  );
}
