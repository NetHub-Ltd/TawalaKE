import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/lib/components/ui/Button";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Clock,
  Store,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Retail POS System Kenya | Stop Stock Theft in Shops & Minimarts",
  description:
    "Best POS for retail shops and minimarts in Kenya. Stop stock leakages, track daily profits, and hold cashiers accountable with PIN login. M-Pesa ready. From KSh 1,490/mo.",
  alternates: { canonical: "/solutions/retail" },
  openGraph: {
    title: "Retail POS System Kenya | Stop Stock Theft in Shops & Minimarts",
    description:
      "Best POS for retail shops and minimarts in Kenya. Stop stock leakages and track daily profits.",
    url: "https://tawala.nethub.co.ke/solutions/retail",
    type: "website",
  },
};

const TRIAL_HREF = "/onboarding/personal-details";

const FEATURES = [
  {
    icon: Zap,
    title: "Sub-Second Barcode Checkout",
    desc: "Scan and sell on any Android phone, tablet, or PC. No expensive hardware needed.",
  },
  {
    icon: ShieldCheck,
    title: "Cashier PIN Accountability",
    desc: "Every sale, void, and discount is logged to the staff member who performed it.",
  },
  {
    icon: CheckCircle2,
    title: "M-Pesa Auto-Reconciliation",
    desc: "Cash, Buy Goods Till, and store credit — matched automatically at shift end.",
  },
  {
    icon: Clock,
    title: "Low-Stock Alerts",
    desc: "Get notified before fast-moving items run out. Never miss a sale due to empty shelves.",
  },
] as const;

export default function RetailSolutionsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Retail POS System Kenya",
    description:
      "Point of sale and inventory management for retail shops and minimarts in Kenya.",
    provider: {
      "@type": "Organization",
      name: "Tawala",
      url: "https://tawala.nethub.co.ke",
    },
    areaServed: { "@type": "Country", name: "Kenya" },
    offers: {
      "@type": "Offer",
      price: "1490",
      priceCurrency: "KES",
      description: "From KSh 1,490/month · 14-day free trial",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen w-full bg-background text-foreground">
        <section className="mx-auto max-w-7xl px-4 pb-12 pt-16 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">
            <Store size={14} aria-hidden="true" />
            For Retail Shops & Minimarts
          </div>
          <h1 className="text-h1 mx-auto max-w-3xl tracking-tight">
            Stop Stock Theft at Your{" "}
            <span className="text-gradient">Retail Counter.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            Every sale tied to a staff PIN. Real-time inventory updates. M-Pesa
            reconciliation done automatically. Built for Kenyan retail.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={TRIAL_HREF}>
              <Button
                variant="primary"
                size="lg"
                className="min-h-[48px] w-full gap-2 sm:w-auto"
              >
                Start 14-Day Free Trial
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/solutions">
              <Button
                variant="outline"
                size="lg"
                className="min-h-[48px] w-full sm:w-auto"
              >
                View All Solutions
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="space-y-3 rounded-2xl border border-border/60 bg-card p-6"
              >
                <f.icon
                  size={22}
                  className="text-brand-primary"
                  aria-hidden="true"
                />
                <h2 className="text-h3">{f.title}</h2>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="space-y-6 rounded-3xl border border-brand-primary/30 bg-linear-to-br from-card to-brand-primary/5 p-8 sm:p-12">
            <h2 className="text-h2">Ready to Stop Losing Stock?</h2>
            <p className="text-muted">
              Start free for 14 days. Plans from KSh 1,490/month.
            </p>
            <Link href={TRIAL_HREF}>
              <Button
                variant="primary"
                size="lg"
                className="min-h-[48px] gap-2"
              >
                Start Free Trial
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
