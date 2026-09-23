import type { Metadata } from "next";
import Link from "next/link";
import { backendUrl } from "@/lib/api/backend";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing | Plans for Kenyan shops",
  description:
    "Tawala plans from KSh 1,490/month. Basic, Ndovu, and Enterprise for retail, minimarts, and pharmacies. 14-day free trial — no card required to start.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Tawala pricing — plans for Kenyan retail",
    description:
      "Transparent KES pricing. Start a 14-day free trial. Built for shops, minimarts, and pharmacies.",
    url: "https://tawala.nethub.co.ke/pricing",
    type: "website",
    locale: "en_KE",
  },
  robots: { index: true, follow: true },
};

type PublicPlan = {
  id?: string;
  code: string;
  name: string;
  description?: string | null;
  price_monthly: number;
  price_yearly?: number | null;
  currency: string;
  trial_days?: number;
  features?: Record<string, unknown>;
  limits?: Record<string, unknown>;
};

const TRIAL_HREF = "/onboarding/personal-details";

const FALLBACK_PLANS: PublicPlan[] = [
  {
    code: "BASIC",
    name: "Basic",
    description: "Perfect for single-location businesses just getting started.",
    price_monthly: 1490,
    price_yearly: 14300,
    currency: "KES",
    trial_days: 14,
    limits: { max_businesses: 1, max_staff: 3, max_products: 300 },
    features: {
      pos_and_sales: true,
      basic_stock_tracking: true,
      pin_login: true,
      customer_management: true,
    },
  },
  {
    code: "NDOVU",
    name: "Ndovu",
    description: "For growing shops that need full inventory, credit, and multi-branch.",
    price_monthly: 2499,
    price_yearly: 23990,
    currency: "KES",
    trial_days: 14,
    limits: { max_businesses: 5, max_staff: 15, max_products: 5000 },
    features: {
      pos_and_sales: true,
      full_inventory: true,
      customer_credit: true,
      multi_business: true,
      low_stock_alerts: true,
      pin_login: true,
    },
  },
  {
    code: "ENTERPRISE",
    name: "Enterprise",
    description: "Multi-branch operations that need scale, compliance, and control.",
    price_monthly: 8990,
    price_yearly: null,
    currency: "KES",
    trial_days: 14,
    limits: { max_businesses: 20, max_staff: 100, max_products: 25000 },
    features: {
      pos_and_sales: true,
      full_inventory: true,
      advanced_reports: true,
      multi_business: true,
      pin_login: true,
      api_access: true,
    },
  },
];

const FEATURE_LABELS: Record<string, string> = {
  pos_and_sales: "POS & sales",
  invoicing: "Invoicing",
  basic_stock_tracking: "Basic stock tracking",
  full_inventory: "Full inventory",
  low_stock_alerts: "Low-stock alerts",
  customer_management: "Customer management",
  customer_credit: "Store credit (deni)",
  expense_tracking: "Expense tracking",
  multi_business: "Multi-branch",
  pin_login: "Staff PIN login",
  advanced_reports: "Advanced reports",
  profit_and_loss: "Profit & loss",
  api_access: "API access",
};

async function loadPublicPlans(): Promise<PublicPlan[]> {
  try {
    const res = await fetch(backendUrl("/organizations/plans/public"), {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return FALLBACK_PLANS;
    const json = await res.json();
    const data = (json.data ?? json) as PublicPlan[];
    if (!Array.isArray(data) || data.length === 0) return FALLBACK_PLANS;
    return data;
  } catch {
    return FALLBACK_PLANS;
  }
}

function formatKes(n: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);
}

function featureList(plan: PublicPlan): string[] {
  const feats = plan.features || {};
  const labels: string[] = [];
  for (const [k, v] of Object.entries(feats)) {
    if (v === true && FEATURE_LABELS[k]) labels.push(FEATURE_LABELS[k]);
  }
  const limits = plan.limits || {};
  if (limits.max_businesses != null)
    labels.push(`Up to ${limits.max_businesses} branch(es)`);
  if (limits.max_staff != null) labels.push(`Up to ${limits.max_staff} staff`);
  if (limits.max_products != null)
    labels.push(`Up to ${Number(limits.max_products).toLocaleString()} products`);
  return labels.slice(0, 8);
}

export default async function PricingPage() {
  const plans = await loadPublicPlans();
  const sorted = [...plans].sort((a, b) => {
    const rank = (c: string) =>
      c === "BASIC" ? 0 : c === "NDOVU" ? 1 : c === "ENTERPRISE" ? 2 : 99;
    return rank(a.code) - rank(b.code);
  });
  const prices = sorted.map((p) => p.price_monthly).filter((n) => n > 0);
  const minPrice = prices.length ? Math.min(...prices) : 1490;

  return (
    <div className="bg-background text-foreground">
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
            Pricing
          </p>
          <h1 className="mt-2 text-h2 text-foreground sm:text-3xl">
            Simple plans for Kenyan shops
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
            From {formatKes(minPrice)}/month. 14-day free trial on all plans —
            start without a card. Built for retail, minimarts, and pharmacies.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={TRIAL_HREF}
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-brand-accent px-5 text-sm font-semibold text-white hover:opacity-90"
            >
              Start free trial
            </Link>
            <Link
              href="/support"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-card"
            >
              Talk to support
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <ul className="grid gap-6 lg:grid-cols-3">
          {sorted.map((plan) => {
            const highlight = plan.code === "NDOVU";
            const features = featureList(plan);
            return (
              <li
                key={plan.code}
                className={`flex flex-col rounded-xl border p-6 shadow-sm ${
                  highlight
                    ? "border-brand-primary bg-card ring-1 ring-brand-primary/30"
                    : "border-border/60 bg-card"
                }`}
              >
                {highlight ? (
                  <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-primary">
                    Most popular
                  </span>
                ) : null}
                <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted">{plan.description}</p>
                <p className="mt-4">
                  <span className="text-3xl font-bold tabular-nums text-foreground">
                    {formatKes(plan.price_monthly)}
                  </span>
                  <span className="text-sm text-muted"> / month</span>
                </p>
                {plan.price_yearly ? (
                  <p className="mt-1 text-xs text-muted">
                    or {formatKes(plan.price_yearly)}/year
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted">Annual: contact sales</p>
                )}
                <ul className="mt-6 flex-1 space-y-2">
                  {features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent"
                        aria-hidden
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={TRIAL_HREF}
                  className={`mt-8 inline-flex min-h-[44px] items-center justify-center rounded-md px-4 text-sm font-semibold ${
                    highlight
                      ? "bg-brand-accent text-white hover:opacity-90"
                      : "border border-border text-foreground hover:bg-background"
                  }`}
                >
                  Start free trial
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-10 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-primary hover:underline">
            Log in
          </Link>{" "}
          to manage billing, or see{" "}
          <Link href="/solutions" className="font-medium text-brand-primary hover:underline">
            solutions by trade
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
