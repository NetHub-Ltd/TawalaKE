"use client";

import { useState } from "react";
import Link from "next/link";
import { StartTrialButton } from "@/features/org/components/StartTrialButton";

export type PlanCardData = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price_monthly: number;
  price_yearly?: number | null;
  currency: string;
  trial_days: number;
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

/** Human-readable labels for graded feature values (api, audit, offline). */
const GRADED_FEATURE_LABELS: Record<string, string> = {
  limited: "Limited",
  standard: "Standard",
  basic: "Basic",
  full: "Full",
};

function formatFeatureValue(v: unknown): string | null {
  if (v === true) return "Included";
  if (v === false || v == null) return null;
  if (typeof v === "string") {
    const key = v.toLowerCase();
    return GRADED_FEATURE_LABELS[key] ?? v;
  }
  return String(v);
}

function formatLimit(v: unknown): string {
  if (v === null || v === undefined) return "Unlimited";
  if (typeof v === "number") return v.toLocaleString();
  return String(v);
}

export function PlanCard({ plan }: { plan: PlanCardData }) {
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const isNdovu = plan.code === "NDOVU";
  const isEnterprise = plan.code === "ENTERPRISE";
  const isBasic = plan.code === "BASIC";
  const yearly = Number(plan.price_yearly ?? 0);
  const monthly = Number(plan.price_monthly ?? 0);
  const trialDays =
    plan.trial_days > 0 ? plan.trial_days : isBasic || isNdovu ? 14 : 0;

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
      className={
        isNdovu
          ? "relative flex flex-col overflow-hidden rounded-2xl border-2 border-brand-primary bg-card p-6 pt-8 shadow-lift ring-4 ring-brand-primary/15"
          : "relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/90 p-6 shadow-sm backdrop-blur"
      }
    >
      {/* Diagonal ribbon — Ndovu only */}
      {isNdovu && (
        <div
          className="pointer-events-none absolute -right-10 top-5 z-10 w-40 rotate-45 bg-brand-primary py-1 text-center text-[10px] font-bold uppercase tracking-wider text-white shadow-md"
          aria-hidden
        >
          Popular
        </div>
      )}
      {isNdovu && (
        <span className="absolute left-4 top-3 rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary">
          Recommended
        </span>
      )}

      <div className={isNdovu ? "mt-2 mb-3" : "mb-3"}>
        <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{plan.description}</p>
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
                  {monthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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

      {/* CTA early — before long feature lists */}
      <div className="mt-5">
        {(isBasic || isNdovu) && (
          <StartTrialButton
            planCode={plan.code}
            label={`Start ${trialDays || 14}-day free trial`}
          />
        )}
        {isEnterprise && (
          <Link
            href="/org/contact-us"
            className="flex w-full items-center justify-center rounded-xl border-2 border-brand-primary bg-transparent px-4 py-3.5 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
          >
            Contact sales
          </Link>
        )}
      </div>

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
        <div className="mt-4 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setFeaturesOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-left text-sm font-medium text-brand-primary transition hover:bg-brand-primary/5"
            aria-expanded={featuresOpen}
          >
            <span>{featuresOpen ? "Hide features" : "See more features"}</span>
            <span className="text-xs text-muted" aria-hidden>
              {featuresOpen ? "▴" : "▾"}
            </span>
          </button>
          {featuresOpen && (
            <ul className="mt-3 space-y-2 text-sm text-foreground">
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
          )}
        </div>
      )}
    </article>
  );
}
