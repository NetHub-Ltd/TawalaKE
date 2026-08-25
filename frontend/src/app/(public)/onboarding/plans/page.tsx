import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { backendUrl } from "@/lib/api/backend";
import { StartTrialButton } from "@/features/org/components/StartTrialButton";

type Plan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price_monthly: number;
  price_yearly?: number | null;
  currency: string;
  trial_days: number;
  sort_order: number;
  features?: Record<string, unknown>;
  limits?: Record<string, unknown>;
};

const FEATURE_LABELS: Record<string, string> = {
  pos_and_sales: "POS & sales",
  invoicing: "Invoicing",
  basic_stock_tracking: "Basic stock tracking",
  full_inventory: "Full inventory",
  low_stock_alerts: "Low-stock alerts",
  customer_management: "Customer management",
  customer_credit: "Customer credit",
  expense_tracking: "Expense tracking",
  multi_business: "Multi-business",
  receipt_customization: "Receipt customization",
  daily_sales_report: "Daily sales report",
  advanced_reports: "Advanced reports",
  profit_and_loss: "Profit & loss",
  staff_performance: "Staff performance",
  custom_reports: "Custom reports",
  pin_login: "PIN login",
  audit_trail: "Audit trail",
  api_access: "API access",
  sso: "SSO",
  enhanced_security: "Enhanced security",
  email_support: "Email support",
  whatsapp_support: "WhatsApp support",
  phone_support: "Phone support",
  priority_support: "Priority support",
  dedicated_account_manager: "Dedicated account manager",
  onboarding_training: "Onboarding training",
  automatic_backups: "Automatic backups",
  offline_mode: "Offline mode",
  supplier_management: "Supplier management",
  purchase_orders: "Purchase orders",
  batch_tracking: "Batch tracking",
  csv_export: "CSV export",
  pdf_export: "PDF export",
  custom_domain: "Custom domain",
  white_label: "White label",
};

const LIMIT_LABELS: Record<string, string> = {
  max_businesses: "Businesses",
  max_staff: "Staff",
  max_products: "Products",
  max_customers: "Customers",
  max_transactions_per_month: "Transactions / month",
  max_invoices_per_month: "Invoices / month",
  data_retention_months: "Data retention (months)",
};

function formatFeatureValue(v: unknown): string | null {
  if (v === true) return "Included";
  if (v === false || v == null) return null;
  if (typeof v === "string") return v;
  return String(v);
}

function formatLimit(v: unknown): string {
  if (v === null || v === undefined) return "Unlimited";
  return String(v);
}

function orderPlans(plans: Plan[]): Plan[] {
  const rank = (c: string) =>
    c === "BASIC" ? 0 : c === "NDOVU" ? 1 : c === "ENTERPRISE" ? 2 : 99;
  return [...plans].sort(
    (a, b) => rank(a.code) - rank(b.code) || a.sort_order - b.sort_order
  );
}

async function loadPlans(token: string): Promise<Plan[]> {
  const res = await fetch(backendUrl("/organizations/plans"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return orderPlans((json.data ?? json) as Plan[]);
}

async function loadStatus(token: string) {
  const res = await fetch(backendUrl("/organizations/onboarding-status"), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export default async function PlansOnboardingPage() {
  const session = await auth();
  if (!session?.accessToken) {
    redirect("/login?callbackUrl=%2Fonboarding%2Fplans");
  }

  const status = await loadStatus(session.accessToken);
  const role = (status?.role || session.user?.role || "").toString().toUpperCase();

  if (role && role !== "OWNER") {
    redirect("/org");
  }
  if (status?.has_active_subscription && status?.profile_complete) {
    redirect("/org");
  }
  if (status?.has_active_subscription && !status?.profile_complete) {
    redirect("/onboarding/organization");
  }

  let plans: Plan[] = [];
  try {
    plans = await loadPlans(session.accessToken);
  } catch {
    plans = [];
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-brand-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-brand-secondary/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">
            Tawala plans
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Pricing that grows with your business
          </h1>
          <p className="mt-3 text-muted">
            All paid plans are{" "}
            <span className="font-medium text-foreground">billed annually</span>.
            Start with a free trial on Basic or Ndovu — no charge today.
          </p>
        </div>

        {plans.length === 0 ? (
          <p className="text-center text-sm text-muted">
            Plans could not be loaded. Confirm the API is reachable and plans are seeded.
          </p>
        ) : (
          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const isNdovu = plan.code === "NDOVU";
              const isEnterprise = plan.code === "ENTERPRISE";
              const isBasic = plan.code === "BASIC";
              const yearly = Number(plan.price_yearly ?? 0);
              const monthly = Number(plan.price_monthly ?? 0);
              const trialDays = plan.trial_days > 0 ? plan.trial_days : isBasic || isNdovu ? 7 : 0;

              const enabledFeatures = Object.entries(plan.features || {})
                .map(([k, v]) => {
                  const label = FEATURE_LABELS[k] || k.replace(/_/g, " ");
                  const val = formatFeatureValue(v);
                  return val ? { label, val } : null;
                })
                .filter(Boolean) as { label: string; val: string }[];

              const limits = Object.entries(plan.limits || {}).map(([k, v]) => ({
                label: LIMIT_LABELS[k] || k.replace(/_/g, " "),
                val: formatLimit(v),
              }));

              return (
                <article
                  key={plan.id}
                  className={
                    isNdovu
                      ? "relative flex flex-col rounded-2xl border-2 border-brand-primary bg-card p-6 shadow-lift ring-4 ring-brand-primary/15 lg:scale-[1.03]"
                      : "relative flex flex-col rounded-2xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur"
                  }
                >
                  {isNdovu && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
                      Most popular
                    </span>
                  )}

                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
                    <p className="mt-2 min-h-[3rem] text-sm leading-relaxed text-muted">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-1">
                    {yearly > 0 ? (
                      <>
                        <p className="text-3xl font-semibold tracking-tight text-foreground">
                          {plan.currency}{" "}
                          {yearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          <span className="text-base font-normal text-muted"> /year</span>
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          Billed annually
                          {monthly > 0 && (
                            <>
                              {" "}
                              · about {plan.currency}{" "}
                              {monthly.toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                              /mo
                            </>
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="text-3xl font-semibold text-foreground">
                        {plan.currency}{" "}
                        {monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        <span className="text-base font-normal text-muted"> /mo</span>
                      </p>
                    )}
                  </div>

                  {trialDays > 0 && !isEnterprise && (
                    <p className="mt-2 text-sm font-medium text-brand-accent">
                      {trialDays}-day free trial · invoice emailed (KES 0 today)
                    </p>
                  )}

                  {limits.length > 0 && (
                    <div className="mt-5 border-t border-border pt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                        Limits
                      </p>
                      <ul className="space-y-1.5 text-sm text-foreground">
                        {limits.map((l) => (
                          <li key={l.label} className="flex justify-between gap-2">
                            <span className="text-muted">{l.label}</span>
                            <span className="font-medium">{l.val}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {enabledFeatures.length > 0 && (
                    <div className="mt-5 flex-1 border-t border-border pt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                        Features
                      </p>
                      <ul className="space-y-2 text-sm text-foreground">
                        {enabledFeatures.map((f) => (
                          <li key={f.label} className="flex items-start gap-2">
                            <span
                              className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-accent/15 text-[10px] text-brand-accent"
                              aria-hidden
                            >
                              ✓
                            </span>
                            <span>
                              {f.label}
                              {f.val !== "Included" && (
                                <span className="text-muted"> · {f.val}</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-auto pt-2">
                    {(isBasic || isNdovu) && (
                      <StartTrialButton
                        planCode={plan.code}
                        label={`Start ${trialDays || 7}-day free trial`}
                      />
                    )}
                    {isEnterprise && (
                      <Link
                        href="/org/contact-us"
                        className="mt-6 flex w-full items-center justify-center rounded-xl border-2 border-brand-primary bg-transparent px-4 py-3.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                      >
                        Contact sales
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted">
          Need help choosing?{" "}
          <Link
            href="/org/contact-us"
            className="font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            Talk to our team
          </Link>
        </p>
      </div>
    </div>
  );
}
