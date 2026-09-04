import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/lib/components/ui/Button";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Pill,
  FileText,
  Package,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pharmacy POS Kenya | FEFO Expiry Tracking & Batch Control",
  description:
    "POS system for pharmacies and chemists in Kenya. Track drug expiry with FEFO, manage batch inventory, and maintain prescription audit trails. KRA-compliant focus.",
  alternates: { canonical: "/solutions/pharmacy" },
  openGraph: {
    title: "Pharmacy POS Kenya | FEFO Expiry Tracking & Batch Control",
    description:
      "POS system for pharmacies and chemists in Kenya. Track drug expiry with FEFO and manage batch inventory.",
    url: "https://tawala.nethub.co.ke/solutions/pharmacy",
    type: "website",
  },
};

const TRIAL_HREF = "/onboarding/personal-details";

const FEATURES = [
  {
    icon: Package,
    title: "FEFO Expiry Tracking",
    desc: "Sell oldest stock first. Automatic alerts before drugs expire so write-offs stay low.",
  },
  {
    icon: ShieldCheck,
    title: "Batch & Lot Control",
    desc: "Track every batch from supplier to sale. Ready for recalls and supplier audits.",
  },
  {
    icon: FileText,
    title: "Prescription Audit Trail",
    desc: "Link sales to staff PIN and keep a clear log for compliance and internal review.",
  },
  {
    icon: CheckCircle2,
    title: "Fractional Unit Sales",
    desc: "Sell by tablet, pack, or bottle without breaking inventory math.",
  },
] as const;

export default function PharmacySolutionsPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://tawala.nethub.co.ke" },
      { "@type": "ListItem", position: 2, name: "Solutions", item: "https://tawala.nethub.co.ke/solutions" },
      { "@type": "ListItem", position: 3, name: "Pharmacies & Chemists", item: "https://tawala.nethub.co.ke/solutions/pharmacy" },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Pharmacy POS System Kenya",
    description:
      "Pharmacy and chemist POS with FEFO expiry tracking, batch control, and staff accountability for Kenya.",
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
            <Pill size={14} aria-hidden="true" />
            For Pharmacies & Chemists
          </div>
          <h1 className="text-h1 mx-auto max-w-3xl tracking-tight">
            Protect Margins with{" "}
            <span className="text-gradient">Pharmacy-Grade Inventory Control.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            FEFO expiry tracking, batch visibility, and staff PIN logs — built
            for Kenyan pharmacies that cannot afford leakage or expired stock.
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
            <h2 className="text-h2">Ready for Pharmacy-Grade Control?</h2>
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
