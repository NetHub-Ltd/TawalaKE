import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/lib/components/ui/Button";
import {
  ArrowRight,
  CheckCircle2,
  Truck,
  Warehouse,
  Smartphone,
  Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Wholesale POS Kenya | Multi-Branch Stock Sync",
  description:
    "Wholesale and distribution management system for Kenya. Sync multi-warehouse stock, empower field sales reps, and reconcile high-volume M-Pesa transactions.",
  alternates: { canonical: "/solutions/wholesale" },
  openGraph: {
    title: "Wholesale POS Kenya | Multi-Branch Stock Sync",
    description:
      "Wholesale and distribution management for Kenya. Multi-warehouse sync, field reps, and high-volume M-Pesa reconciliation.",
    url: "https://tawala.nethub.co.ke/solutions/wholesale",
    type: "website",
  },
};

const TRIAL_HREF = "/onboarding/personal-details";

const FEATURES = [
  {
    icon: Warehouse,
    title: "Multi-Warehouse Sync",
    desc: "See stock across branches from one dashboard. Move inventory without spreadsheet chaos.",
  },
  {
    icon: Smartphone,
    title: "Field Rep Mobile Orders",
    desc: "Sales reps place and track orders from the field on any phone with live stock visibility.",
  },
  {
    icon: Layers,
    title: "Tiered Wholesale Pricing",
    desc: "Different price tiers by customer or volume. Margin stays protected as you scale.",
  },
  {
    icon: CheckCircle2,
    title: "High-Volume M-Pesa Reconciliation",
    desc: "Match large Buy Goods volumes to invoices automatically so day-end closes faster.",
  },
] as const;

export default function WholesaleSolutionsPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://tawala.nethub.co.ke" },
      { "@type": "ListItem", position: 2, name: "Solutions", item: "https://tawala.nethub.co.ke/solutions" },
      { "@type": "ListItem", position: 3, name: "Wholesale & Distribution", item: "https://tawala.nethub.co.ke/solutions/wholesale" },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Wholesale POS System Kenya",
    description:
      "Wholesale and distribution management with multi-warehouse sync, field sales, and M-Pesa reconciliation for Kenya.",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen w-full bg-background text-foreground">
        <section className="mx-auto max-w-7xl px-4 pb-12 pt-16 text-center sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary">
            <Truck size={14} aria-hidden="true" />
            For Wholesale & Distribution
          </div>
          <h1 className="text-h1 mx-auto max-w-3xl tracking-tight">
            One Dashboard for Every{" "}
            <span className="text-gradient">Warehouse and Sales Rep.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            Multi-branch stock, field orders, and high-volume payment matching —
            built for Kenyan wholesalers and distributors.
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
            <h2 className="text-h2">Ready to Scale Distribution?</h2>
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
