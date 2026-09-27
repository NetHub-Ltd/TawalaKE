"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { Permission } from "@/lib/rbac";
import { Loader2, Save, ShieldAlert, Plus, Trash2 } from "lucide-react";

const DEFAULT_LOGO = "https://tawala.nethub.co.ke/logo.svg";
const DEFAULT_TERMS =
  "Payment is due within 30 days of the invoice date. Late payments may be subject to a 2% fee.\nThank you for your business!";

type PaymentField = { label: string; value: string };

type BranchProfile = {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  tax_rate?: number | null;
  tax_enabled?: boolean;
  active?: boolean;
  config?: {
    receipt_footer?: string;
    show_tax_on_receipt?: boolean;
    financial_documents?: {
      logo_url?: string;
      display_name?: string | null;
      payment_fields?: PaymentField[];
      terms_and_conditions?: string;
      paper_size?: string;
    };
  } | null;
};

export function BusinessSettingsForm() {
  const params = useParams();
  const organizationId = params?.organizationId as string;
  const businessId = params?.businessId as string;
  const { can } = usePermissions();
  const canEdit =
    can(Permission.STORE_WRITE) ||
    can(Permission.ORG_WRITE) ||
    can(Permission.STOCK_ADJUST);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [active, setActive] = useState(true);
  const [receiptFooter, setReceiptFooter] = useState("");
  const [showTax, setShowTax] = useState(true);

  // financial_documents
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO);
  const [displayName, setDisplayName] = useState("");
  const [paymentFields, setPaymentFields] = useState<PaymentField[]>([
    { label: "", value: "" },
  ]);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [paperSize, setPaperSize] = useState<"A5" | "A4">("A5");
  const [rawConfig, setRawConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/org/stores/${businessId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const body = await res.json();
          const b = (body?.data || body) as BranchProfile;
          if (cancelled) return;
          setName(b.name || "");
          setPhone(b.phone || "");
          setAddress(b.address || "");
          setTaxRate(String(b.tax_rate ?? 0));
          setTaxEnabled(Boolean(b.tax_enabled));
          setActive(b.active !== false);
          const cfg = (b.config || {}) as BranchProfile["config"] &
            Record<string, unknown>;
          setRawConfig(cfg || {});
          setReceiptFooter(cfg?.receipt_footer || "");
          setShowTax(cfg?.show_tax_on_receipt !== false);
          const fd = cfg?.financial_documents;
          setLogoUrl(fd?.logo_url || DEFAULT_LOGO);
          setDisplayName(fd?.display_name || "");
          const pf = fd?.payment_fields;
          setPaymentFields(
            Array.isArray(pf) && pf.length
              ? pf.slice(0, 3).map((x) => ({
                  label: String(x.label || ""),
                  value: String(x.value || ""),
                }))
              : [{ label: "", value: "" }],
          );
          setTerms(fd?.terms_and_conditions || DEFAULT_TERMS);
          setPaperSize(fd?.paper_size === "A4" ? "A4" : "A5");
        } else {
          setError("Could not load branch settings");
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (businessId) load();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || saving) return;
    setSaving(true);
    setError(null);
    setMsg(null);
    const tax = Number(taxRate);
    const cleanedFields = paymentFields
      .map((f) => ({
        label: f.label.trim(),
        value: f.value.trim(),
      }))
      .filter((f) => f.label || f.value)
      .slice(0, 3);

    try {
      const res = await fetch(`/api/v1/org/stores/update-business/${businessId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          phone: phone.trim() || null,
          address: address.trim() || null,
          tax_rate: Number.isFinite(tax) ? tax : 0,
          tax_enabled: taxEnabled,
          active,
          config: {
            ...rawConfig,
            receipt_footer: receiptFooter.trim(),
            show_tax_on_receipt: showTax,
            financial_documents: {
              logo_url: logoUrl.trim() || DEFAULT_LOGO,
              display_name: displayName.trim() || null,
              payment_fields: cleanedFields,
              terms_and_conditions: terms.trim() || DEFAULT_TERMS,
              paper_size: paperSize,
            },
          },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          body?.error ||
            body?.detail?.message ||
            body?.message ||
            "Could not save settings",
        );
        return;
      }
      setMsg("Branch settings saved. New sales will use these on invoices.");
      setRawConfig((prev) => ({
        ...prev,
        receipt_footer: receiptFooter.trim(),
        show_tax_on_receipt: showTax,
        financial_documents: {
          logo_url: logoUrl.trim() || DEFAULT_LOGO,
          display_name: displayName.trim() || null,
          payment_fields: cleanedFields,
          terms_and_conditions: terms.trim() || DEFAULT_TERMS,
          paper_size: paperSize,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading branch settings…
      </div>
    );
  }

  const inputCls =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-2 sm:p-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Branch settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tax feeds the terminal. Receipts & invoices use the section below.
        </p>
      </div>

      {!canEdit && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          You can view these settings but need the right role to edit them.
        </div>
      )}

      <form onSubmit={onSave} className="space-y-6">
        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Branch profile</h2>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Branch name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              className={inputCls}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!canEdit}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Tax rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                disabled={!canEdit || !taxEnabled}
                className={inputCls}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={taxEnabled}
              onChange={(e) => setTaxEnabled(e.target.checked)}
              disabled={!canEdit}
              className="rounded border-border"
            />
            Enable tax on sales
          </label>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!canEdit}
              className={inputCls}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              disabled={!canEdit}
              className="rounded border-border"
            />
            Branch active
          </label>
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Receipts & invoices
            </h2>
            <p className="mt-1 text-xs text-muted">
              Appears on printable / downloadable financial documents. Logo is
              rendered in black.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Logo URL
            </label>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              disabled={!canEdit}
              placeholder={DEFAULT_LOGO}
              className={inputCls}
            />
            <p className="mt-1 text-[11px] text-muted">
              Default: {DEFAULT_LOGO}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Name on document
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={!canEdit}
              placeholder={name || "Uses branch name if empty"}
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Paper size
            </label>
            <select
              value={paperSize}
              onChange={(e) =>
                setPaperSize(e.target.value === "A4" ? "A4" : "A5")
              }
              disabled={!canEdit}
              className={inputCls}
            >
              <option value="A5">A5 (default)</option>
              <option value="A4">A4</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted">
                Payment details (up to 3 fields)
              </label>
              {canEdit && paymentFields.length < 3 && (
                <button
                  type="button"
                  onClick={() =>
                    setPaymentFields((f) => [...f, { label: "", value: "" }])
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary"
                >
                  <Plus className="h-3.5 w-3.5" /> Add field
                </button>
              )}
            </div>
            {paymentFields.map((field, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={field.label}
                  onChange={(e) => {
                    const next = [...paymentFields];
                    next[i] = { ...next[i], label: e.target.value };
                    setPaymentFields(next);
                  }}
                  disabled={!canEdit}
                  placeholder="Label (e.g. Bank name)"
                  className={inputCls}
                />
                <input
                  value={field.value}
                  onChange={(e) => {
                    const next = [...paymentFields];
                    next[i] = { ...next[i], value: e.target.value };
                    setPaymentFields(next);
                  }}
                  disabled={!canEdit}
                  placeholder="Value"
                  className={inputCls}
                />
                {canEdit && paymentFields.length > 1 && (
                  <button
                    type="button"
                    aria-label="Remove field"
                    onClick={() =>
                      setPaymentFields((f) => f.filter((_, j) => j !== i))
                    }
                    className="shrink-0 rounded-md border border-border p-2 text-muted hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Terms & conditions
            </label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              disabled={!canEdit}
              rows={4}
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Short receipt footer (thermal)
            </label>
            <textarea
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              disabled={!canEdit}
              rows={2}
              placeholder="Thank you for shopping with us"
              className={inputCls}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={showTax}
              onChange={(e) => setShowTax(e.target.checked)}
              disabled={!canEdit}
              className="rounded border-border"
            />
            Show tax line on documents
          </label>
        </section>

        {error && (
          <p
            className="rounded-md border border-[var(--error)]/30 bg-[var(--error)]/5 px-3 py-2 text-sm text-[var(--error)]"
            role="alert"
          >
            {error}
          </p>
        )}
        {msg && (
          <p className="rounded-md border border-border bg-register px-3 py-2 text-sm text-foreground">
            {msg}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save settings
            </button>
          )}
          <Link
            href={`/org/${organizationId}/${businessId}/overview`}
            className="text-sm text-muted hover:text-foreground"
          >
            Back to overview
          </Link>
        </div>
      </form>
    </div>
  );
}
