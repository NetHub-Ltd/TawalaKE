import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/lib/components/ui/Button";
import {
  ArrowRight,
  CheckCircle2,
  Package,
  ShieldCheck,
  Users,
  Zap,
  ChevronRight,
} from "lucide-react";

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

const BENEFITS = [
  {
    icon: Zap,
    title: "Fast counter sales",
    desc: "Record cash, M-Pesa, and store credit in seconds on any phone or PC.",
  },
  {
    icon: Package,
    title: "Stock leak control",
    desc: "Every sale updates inventory. Low-stock and mismatch alerts keep shelves honest.",
  },
  {
    icon: Users,
    title: "Staff PIN accountability",
    desc: "4-digit PIN on shared devices. Every sale and discount is tied to a person.",
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
    title: "Set password and start trial",
    desc: "14 days of Ndovu. No credit card.",
  },
  {
    n: "3",
    title: "Run your shop",
    desc: "Add stock, staff PINs, and start selling.",
  },
] as const;

const FAQS = [
  {
    q: "How much does Tawala cost?",
    a: "Plans start at KSh 1,490 per month. Self-serve trial is 14 days on Ndovu with no credit card required.",
  },
  {
    q: "Can I use Tawala on my phone?",
    a: "Yes. It works on Android phones, iPhones, tablets, and PCs. No special hardware required.",
  },
  {
    q: "How does Tawala stop stock theft?",
    a: "Sales and adjustments are tied to staff PIN login. Real-time stock alerts flag mismatches quickly.",
  },
  {
    q: "Can I manage multiple shops?",
    a: "Yes. Ndovu and above support multi-branch inventory, staff, and sales from one dashboard.",
  },
] as const;

const PROOF = [
  {
    q: "Daily profit view alone paid for the subscription.",
    who: "Minimart owner · Nairobi",
  },
  {
    q: "Every sale and discount is tied to a person now.",
    who: "Pharmacy manager · Kisumu",
  },
  {
    q: "Two branches, one login — reports in minutes.",
    who: "Hardware owner · Mombasa",
  },
] as const;

export default function LandingPage() {
  const softwareLd = {
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

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://tawala.nethub.co.ke/#organization",
    name: "Tawala",
    url: "https://tawala.nethub.co.ke",
    logo: "https://tawala.nethub.co.ke/web-app-manifest-512x512.png",
    areaServed: { "@type": "Country", name: "Kenya" },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <div className="relative w-full text-foreground">
        <section className="section-padding mx-auto max-w-3xl pt-12 text-center md:pt-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">
            <ShieldCheck size={14} aria-hidden="true" />
            14-day free trial · No credit card · M-Pesa ready
          </p>
          <h1 className="text-h1">
            Tawala biashara yako{" "}
            <span className="text-gradient">bila stress na leakage.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
            Stop relying on exercise books. Track sales, block stock theft, and
            see true daily net profit — built for Kenyan shops.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={TRIAL_HREF} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="min-h-[48px] w-full gap-2 shadow-glow sm:min-w-[220px]"
              >
                Start 14-day free trial
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </Link>
            <Link href="#how-it-works" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="min-h-[48px] w-full sm:min-w-[180px]"
              >
                How it works
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted">
            From{" "}
            <span className="font-semibold text-foreground">KSh 1,490/mo</span>
            {" · "}
            <Link
              href={LOGIN_HREF}
              className="font-semibold text-brand-primary underline-offset-2 hover:underline"
            >
              Log in
            </Link>
          </p>
        </section>

        <section className="section-padding mx-auto max-w-6xl border-t border-border/50">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-h2">Built for how Kenyan shops actually run</h2>
            <p className="mt-3 text-muted">
              Three things owners care about at the counter — speed, stock, and
              staff.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.title} className="card-layered space-y-3 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                  <b.icon size={22} aria-hidden="true" />
                </div>
                <h3 className="text-h3">{b.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="section-padding mx-auto max-w-6xl border-t border-border/50"
        >
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-h2">Up and running in three steps</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="flex gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-card"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-padding mx-auto max-w-6xl border-t border-border/50">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {PROOF.map((t) => (
              <figure
                key={t.who}
                className="rounded-2xl border border-border/60 bg-card p-5 shadow-card"
              >
                <blockquote className="text-sm leading-relaxed text-foreground">
                  &ldquo;{t.q}&rdquo;
                </blockquote>
                <figcaption className="mt-3 text-xs text-muted">{t.who}</figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted">
            Early owner feedback — verified quotes replace these as they are
            collected.
          </p>
        </section>

        <section
          id="faq"
          className="section-padding mx-auto max-w-2xl border-t border-border/50"
        >
          <h2 className="text-h2 mb-8 text-center">Questions shop owners ask</h2>
          <div className="space-y-3">
            {FAQS.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-border/60 bg-card p-4 shadow-card open:shadow-lift"
              >
                <summary className="cursor-pointer list-none text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-muted transition-transform group-open:rotate-90"
                      aria-hidden="true"
                    />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="section-padding mx-auto max-w-3xl text-center">
          <div className="card-layered border-brand-primary/20 bg-linear-to-br from-card to-brand-primary/5 px-6 py-10 sm:px-12">
            <h2 className="text-h2">Ready to stop the leakage?</h2>
            <p className="mx-auto mt-3 max-w-md text-muted">
              Start free for 14 days on Ndovu. From KSh 1,490/month after trial.
            </p>
            <Link href={TRIAL_HREF} className="mt-6 inline-block">
              <Button
                variant="primary"
                size="lg"
                className="min-h-[48px] gap-2 shadow-glow"
              >
                Start 14-day free trial
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </Link>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
              {["No credit card", "5-min setup", "M-Pesa ready"].map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <CheckCircle2
                    size={14}
                    className="text-brand-accent"
                    aria-hidden="true"
                  />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="border-t border-border/60 bg-card/40 py-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
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
                <Link
                  href="/onboarding/plans"
                  className="text-muted hover:text-foreground"
                >
                  Pricing
                </Link>
                <Link
                  href="/solutions"
                  className="text-muted hover:text-foreground"
                >
                  Solutions
                </Link>
                <Link
                  href="/support"
                  className="text-muted hover:text-foreground"
                >
                  Support
                </Link>
                <Link href="/blog" className="text-muted hover:text-foreground">
                  Blog
                </Link>
                <Link
                  href={LOGIN_HREF}
                  className="text-muted hover:text-foreground"
                >
                  Log in
                </Link>
                <Link
                  href="/legal/terms"
                  className="text-muted hover:text-foreground"
                >
                  Terms
                </Link>
                <Link
                  href="/legal/privacy"
                  className="text-muted hover:text-foreground"
                >
                  Privacy
                </Link>
              </nav>
            </div>
            <p className="text-center text-xs text-muted sm:text-left">
              {"© "}
              {new Date().getFullYear()}
              {" Tawala · Nethub. All rights reserved."}
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
