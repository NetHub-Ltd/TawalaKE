"use client";

/**
 * A5/A4 invoice/receipt — professional print layout.
 * Branch phone/address/name refreshed live at render time.
 * Payment details: frozen snapshot unless business.config.financial_documents.apply_to_existing.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Loader2, Printer, RefreshCw } from "lucide-react";
import { useReceipt } from "@/features/sales/hooks/useReceipts";
import { Spinner } from "@/lib/components/ui";

type PaymentField = { label: string; value: string };

type Branding = {
  logo_url?: string;
  display_name?: string | null;
  payment_fields?: PaymentField[];
  terms_and_conditions?: string;
  paper_size?: string;
  apply_to_existing?: boolean;
};

type ServiceLine = { description: string; amount: number };

type ReceiptData = {
  document_number?: string;
  document_type?: string | { value?: string };
  issued_at?: string;
  branding?: Branding | null;
  seller?: {
    business_name?: string;
    business_id?: string;
    address?: string | null;
    phone?: string | null;
    tax_number?: string | null;
    cashier?: { name?: string } | null;
  } | null;
  buyer?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  financials?: {
    currency?: string;
    subtotal?: number;
    discount_amount?: number;
    tax_rate_applied?: number;
    tax_amount?: number;
    total_amount?: number;
    amount_paid?: number;
    balance_due?: number;
    service_lines?: ServiceLine[];
    service_total?: number;
  } | null;
  items?: Array<{
    name?: string;
    sku?: string;
    quantity?: number;
    unit_price?: number;
    total_price?: number;
  }>;
  payments?: Array<{
    method?: string;
    amount?: number;
    reference?: string | null;
  }>;
  summary?: {
    services?: ServiceLine[];
    discount_amount?: number;
  };
};

type LiveBranch = {
  name?: string;
  phone?: string | null;
  address?: string | null;
  config?: {
    financial_documents?: Branding;
    show_tax_on_receipt?: boolean;
  } | null;
};

const DEFAULT_LOGO = "https://tawala.nethub.co.ke/logo.svg";
const DEFAULT_TERMS =
  "Payment is due within 30 days of the invoice date. Late payments may be subject to a 2% fee.\nThank you for your business!";

function money(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  return v.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatWhen(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(iso).slice(0, 10);
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function docTypeString(raw: ReceiptData["document_type"]): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw.value) return String(raw.value);
  return String(raw);
}

function resolveServices(r: ReceiptData): ServiceLine[] {
  const a = r.financials?.service_lines;
  const b = r.summary?.services;
  const list = (Array.isArray(a) && a.length ? a : b) || [];
  return list
    .filter((s) => s && (s.description || Number(s.amount)))
    .map((s) => ({
      description: String(s.description || "Service"),
      amount: Number(s.amount) || 0,
    }));
}

type LineRow = {
  no: number | string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
};

function buildPrintHtml(opts: {
  paper: "A5" | "A4";
  logoUrl: string;
  businessName: string;
  branchMeta: string[];
  docLabel: string;
  date: string;
  docNumber: string;
  buyerName: string;
  buyerPhone: string;
  rows: LineRow[];
  paymentFields: PaymentField[];
  subtotal: string;
  discount: string;
  tax: string;
  taxRate: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  currency: string;
  terms: string;
  showTax: boolean;
  showDiscount: boolean;
  showBalance: boolean;
  showPaid: boolean;
}): string {
  const page = opts.paper === "A4" ? "A4" : "A5";
  const rowHtml = opts.rows
    .map(
      (r) => `
    <tr>
      <td class="c-no">${escapeHtml(String(r.no))}</td>
      <td>${escapeHtml(r.description)}</td>
      <td class="num">${escapeHtml(r.quantity)}</td>
      <td class="num">${escapeHtml(r.unitPrice)}</td>
      <td class="num">${escapeHtml(r.total)}</td>
    </tr>`,
    )
    .join("");
  const metaHtml = opts.branchMeta
    .map((m) => `<div class="meta-line">${escapeHtml(m)}</div>`)
    .join("");
  const payHtml = opts.paymentFields
    .map(
      (f) =>
        `<div class="pay-row"><span class="lbl">${escapeHtml(f.label)}</span><span>${escapeHtml(f.value || "—")}</span></div>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${escapeHtml(opts.docLabel)} ${escapeHtml(opts.docNumber)}</title>
<style>
  @page { size: ${page}; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #171717; margin: 0; font-size: 11px; line-height: 1.45;
    -webkit-font-smoothing: antialiased;
  }
  .sheet { max-width: 100%; }
  .top {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e5e5; margin-bottom: 20px;
  }
  .brand { display: flex; gap: 12px; align-items: flex-start; min-width: 0; }
  .brand img { height: 40px; width: auto; max-width: 72px; object-fit: contain;
    filter: grayscale(1) brightness(0); flex-shrink: 0; }
  .brand-text { min-width: 0; }
  .brand-name {
    font-weight: 700; font-size: 15px; letter-spacing: -0.01em;
    color: #0a0a0a; margin: 0 0 4px;
  }
  .meta-line { font-size: 10px; color: #525252; line-height: 1.5; }
  .doc-side { text-align: right; flex-shrink: 0; }
  .doc-title {
    font-size: 28px; font-weight: 800; letter-spacing: -0.03em;
    margin: 0 0 8px; color: #0a0a0a; line-height: 1;
  }
  .doc-meta { font-size: 10.5px; color: #404040; }
  .doc-meta strong { color: #171717; font-weight: 600; }
  .parties { margin-bottom: 22px; }
  .parties h3 {
    margin: 0 0 6px; font-size: 9px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; color: #737373;
  }
  .parties .name { font-size: 12px; font-weight: 600; margin: 0; }
  .parties .sub { font-size: 10.5px; color: #525252; margin: 2px 0 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
  thead th {
    background: #f5f5f5; text-align: left; padding: 9px 8px;
    font-size: 9px; font-weight: 700; letter-spacing: 0.06em;
    text-transform: uppercase; color: #525252; border-bottom: 1px solid #d4d4d4;
  }
  thead th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.c-no { color: #737373; width: 28px; }
  tbody td { padding: 10px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; font-size: 11px; }
  .bottom { display: flex; justify-content: space-between; gap: 32px; align-items: flex-start; }
  .pay { flex: 1; min-width: 0; }
  .pay h3, .terms h3 {
    margin: 0 0 10px; font-size: 9px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; color: #737373;
  }
  .pay-row { display: flex; gap: 8px; margin-bottom: 5px; font-size: 10.5px; }
  .pay-row .lbl { font-weight: 600; color: #404040; min-width: 88px; }
  .totals { width: 200px; flex-shrink: 0; }
  .totals .row {
    display: flex; justify-content: space-between; padding: 5px 0;
    font-size: 11px; color: #404040; font-variant-numeric: tabular-nums;
  }
  .totals .row.muted { color: #737373; font-size: 10.5px; }
  .totals .divider { border-top: 1px solid #e5e5e5; margin: 6px 0; }
  .totals .grand {
    display: flex; justify-content: space-between; padding: 8px 0 0;
    font-size: 13px; font-weight: 800; color: #0a0a0a;
    font-variant-numeric: tabular-nums; letter-spacing: -0.01em;
  }
  .terms {
    margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e5e5;
    font-size: 9.5px; line-height: 1.55; color: #525252; white-space: pre-wrap;
  }
  .sig {
    display: flex; justify-content: space-between; margin-top: 40px; gap: 48px;
  }
  .sig .line {
    border-top: 1px solid #a3a3a3; padding-top: 8px; min-width: 150px;
    font-size: 9px; letter-spacing: 0.04em; text-transform: uppercase; color: #737373;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head><body>
<div class="sheet">
  <div class="top">
    <div class="brand">
      <img src="${escapeHtml(opts.logoUrl)}" alt="" onerror="this.style.display='none'"/>
      <div class="brand-text">
        <p class="brand-name">${escapeHtml(opts.businessName)}</p>
        ${metaHtml}
      </div>
    </div>
    <div class="doc-side">
      <p class="doc-title">${escapeHtml(opts.docLabel)}</p>
      <div class="doc-meta">
        <div><strong>Date</strong> · ${escapeHtml(opts.date)}</div>
        <div><strong>No.</strong> · ${escapeHtml(opts.docNumber)}</div>
      </div>
    </div>
  </div>
  <div class="parties">
    <h3>Bill to</h3>
    <p class="name">${escapeHtml(opts.buyerName || "Walk-in customer")}</p>
    ${opts.buyerPhone ? `<p class="sub">${escapeHtml(opts.buyerPhone)}</p>` : ""}
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:8%">No.</th>
        <th>Description</th>
        <th class="num" style="width:12%">Qty</th>
        <th class="num" style="width:16%">Unit</th>
        <th class="num" style="width:16%">Amount</th>
      </tr>
    </thead>
    <tbody>${rowHtml || `<tr><td colspan="5">No line items</td></tr>`}</tbody>
  </table>
  <div class="bottom">
    <div class="pay">
      <h3>Payment details</h3>
      ${payHtml || `<div class="pay-row"><span class="lbl">—</span></div>`}
    </div>
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${escapeHtml(opts.currency)} ${escapeHtml(opts.subtotal)}</span></div>
      ${opts.showDiscount ? `<div class="row muted"><span>Discount</span><span>− ${escapeHtml(opts.currency)} ${escapeHtml(opts.discount)}</span></div>` : ""}
      ${opts.showTax ? `<div class="row muted"><span>Tax (${escapeHtml(opts.taxRate)})</span><span>${escapeHtml(opts.currency)} ${escapeHtml(opts.tax)}</span></div>` : ""}
      <div class="divider"></div>
      <div class="grand"><span>Total</span><span>${escapeHtml(opts.currency)} ${escapeHtml(opts.total)}</span></div>
      ${opts.showPaid ? `<div class="row muted"><span>Paid</span><span>${escapeHtml(opts.currency)} ${escapeHtml(opts.amountPaid)}</span></div>` : ""}
      ${opts.showBalance ? `<div class="row"><span>Balance due</span><span>${escapeHtml(opts.currency)} ${escapeHtml(opts.balanceDue)}</span></div>` : ""}
    </div>
  </div>
  <div class="terms">
    <h3>Terms &amp; conditions</h3>
    ${escapeHtml(opts.terms)}
  </div>
  <div class="sig">
    <div class="line">Authorized signature</div>
    <div class="line">Date / name</div>
  </div>
</div>
</body></html>`;
}

function printHtml(html: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Print document");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Could not create print frame");
  }
  doc.open();
  doc.write(html);
  doc.close();
  const w = iframe.contentWindow;
  if (!w) {
    document.body.removeChild(iframe);
    throw new Error("Print window unavailable");
  }
  setTimeout(() => {
    w.focus();
    w.print();
    setTimeout(() => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    }, 1200);
  }, 300);
}

export function InvoiceClientView({ saleId }: { saleId: string }) {
  const router = useRouter();
  const params = useParams();
  const routeBusinessId = params?.businessId as string | undefined;
  const { data, isLoading, error, isFetching, refetch } = useReceipt(saleId);
  const receipt = data as ReceiptData | undefined;
  const [busy, setBusy] = useState<"print" | "pdf" | null>(null);
  const [liveBranch, setLiveBranch] = useState<LiveBranch | null>(null);

  const businessId =
    routeBusinessId ||
    receipt?.seller?.business_id ||
    undefined;

  // Always refresh branch profile for name/phone/address (+ optional live branding)
  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/v1/org/stores/${businessId}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const body = await res.json();
        const b = (body?.data || body) as LiveBranch;
        if (!cancelled) setLiveBranch(b);
      } catch {
        /* keep snapshot-only */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const model = useMemo(() => {
    if (!receipt || typeof receipt !== "object") return null;

    const fin = receipt.financials || {};
    const seller = receipt.seller || {};
    const snapBranding = receipt.branding || {};
    const liveFd = liveBranch?.config?.financial_documents || {};
    const applyLive = Boolean(liveFd.apply_to_existing);

    // Branding: live overlay when toggle on; else frozen snapshot + defaults
    const branding: Branding = applyLive
      ? { ...snapBranding, ...liveFd }
      : { ...snapBranding };

    const currency = fin.currency || "KES";
    const balanceDue = Number(fin.balance_due) || 0;
    const amountPaid = Number(fin.amount_paid) || 0;
    const totalAmount = Number(fin.total_amount) || 0;
    const dtype = docTypeString(receipt.document_type);
    const isInvoice =
      balanceDue > 0.001 || /invoice|credit/i.test(dtype);

    const services = resolveServices(receipt);
    const discount =
      Number(fin.discount_amount ?? receipt.summary?.discount_amount) || 0;
    const tax = Number(fin.tax_amount) || 0;
    const taxRate = Number(fin.tax_rate_applied) || 0;
    const taxLabel =
      taxRate > 0 && taxRate <= 1
        ? `${(taxRate * 100).toFixed(0)}%`
        : taxRate > 1
          ? `${taxRate}%`
          : "—";

    const rows: LineRow[] = [];
    let n = 1;
    for (const item of receipt.items || []) {
      const qty = Number(item.quantity) || 0;
      const unit = Number(item.unit_price) || 0;
      const lineTotal =
        item.total_price != null && Number.isFinite(Number(item.total_price))
          ? Number(item.total_price)
          : qty * unit;
      const name = (item.name || item.sku || "Item").trim() || "Item";
      rows.push({
        no: n++,
        description: name,
        quantity: String(qty),
        unitPrice: money(unit),
        total: money(lineTotal),
      });
    }
    for (const s of services) {
      rows.push({
        no: n++,
        description: s.description,
        quantity: "1",
        unitPrice: money(s.amount),
        total: money(s.amount),
      });
    }

    const paper =
      String(branding.paper_size || "A5").toUpperCase() === "A4" ? "A4" : "A5";

    let paymentFields = (branding.payment_fields || []).filter(
      (f) => f && (f.label || f.value),
    ) as PaymentField[];

    if (!paymentFields.length && Array.isArray(receipt.payments)) {
      paymentFields = receipt.payments.map((p) => ({
        label: String(p.method || "Payment"),
        value: [
          p.reference ? String(p.reference) : null,
          p.amount != null ? `${currency} ${money(Number(p.amount))}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      }));
    }

    // Live branch metadata always preferred when available
    const businessName =
      (branding.display_name && String(branding.display_name).trim()) ||
      liveBranch?.name ||
      seller.business_name ||
      "Business";

    const phone = liveBranch?.phone || seller.phone || "";
    const address = liveBranch?.address || seller.address || "";
    const taxNumber = seller.tax_number || "";
    const branchMeta = [
      address ? String(address) : null,
      phone ? `Tel ${phone}` : null,
      taxNumber ? `Tax / PIN ${taxNumber}` : null,
    ].filter(Boolean) as string[];

    const showTax =
      tax > 0 && liveBranch?.config?.show_tax_on_receipt !== false;

    return {
      paper: paper as "A5" | "A4",
      logoUrl: branding.logo_url || DEFAULT_LOGO,
      businessName,
      branchMeta,
      docLabel: isInvoice ? "INVOICE" : "RECEIPT",
      date: formatWhen(receipt.issued_at),
      docNumber:
        receipt.document_number || saleId.slice(0, 8).toUpperCase(),
      buyerName:
        receipt.buyer?.name && !/^walk[-\s]?in/i.test(receipt.buyer.name)
          ? receipt.buyer.name
          : receipt.buyer?.name || "Walk-in customer",
      buyerPhone: receipt.buyer?.phone || "",
      rows,
      paymentFields,
      subtotal: money(Number(fin.subtotal) || 0),
      discount: money(discount),
      tax: money(tax),
      taxRate: taxLabel,
      total: money(totalAmount),
      amountPaid: money(amountPaid),
      balanceDue: money(balanceDue),
      currency,
      terms: branding.terms_and_conditions || DEFAULT_TERMS,
      showTax,
      showDiscount: discount > 0,
      showBalance: isInvoice && balanceDue > 0.001,
      showPaid: amountPaid > 0,
      applyLive,
    };
  }, [receipt, saleId, liveBranch]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Spinner size="md" label="Loading document" />
        <p className="text-sm text-muted">
          Loading document…
          {isFetching ? " (waiting if still generating)" : ""}
        </p>
      </div>
    );
  }

  if (error || !receipt || !model) {
    const msg =
      (error as Error)?.message ||
      "Document may still be generating. Try again in a moment.";
    return (
      <div className="mx-auto max-w-sm rounded-lg border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm font-semibold text-foreground">
          Could not load this document
        </p>
        <p className="mt-1 text-sm text-muted">{msg}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold hover:bg-register"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-11 items-center rounded-md border border-border px-4 text-sm font-semibold"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const htmlOpts = {
    paper: model.paper,
    logoUrl: model.logoUrl,
    businessName: model.businessName,
    branchMeta: model.branchMeta,
    docLabel: model.docLabel,
    date: model.date,
    docNumber: model.docNumber,
    buyerName: model.buyerName,
    buyerPhone: model.buyerPhone,
    rows: model.rows,
    paymentFields: model.paymentFields,
    subtotal: model.subtotal,
    discount: model.discount,
    tax: model.tax,
    taxRate: model.taxRate,
    total: model.total,
    amountPaid: model.amountPaid,
    balanceDue: model.balanceDue,
    currency: model.currency,
    terms: model.terms,
    showTax: model.showTax,
    showDiscount: model.showDiscount,
    showBalance: model.showBalance,
    showPaid: model.showPaid,
  };

  const runPrint = (kind: "print" | "pdf") => {
    setBusy(kind);
    try {
      printHtml(buildPrintHtml(htmlOpts));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Print failed");
    } finally {
      setTimeout(() => setBusy(null), 400);
    }
  };

  return (
    <div className="w-full max-w-[640px] space-y-4 print:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-muted hover:text-foreground"
        >
          ← Back
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runPrint("print")}
            disabled={!!busy}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-register disabled:opacity-60"
          >
            {busy === "print" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Print
          </button>
          <button
            type="button"
            onClick={() => runPrint("pdf")}
            disabled={!!busy}
            title="Opens print dialog — choose Save as PDF"
            className="inline-flex items-center gap-2 rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Save PDF
          </button>
        </div>
      </div>

      <p className="text-xs text-muted print:hidden">
        {model.paper} · Save PDF uses the system print dialog
        {model.applyLive
          ? " · Live branding applied to this view"
          : " · Payment details from document snapshot (or turn on “apply to existing” in branch settings)"}
      </p>

      <article
        className="rounded-sm border border-neutral-200 bg-white p-6 text-neutral-900 shadow-sm sm:p-10 print:border-0 print:shadow-none"
        style={{ fontFamily: "system-ui, Segoe UI, sans-serif" }}
      >
        <header className="mb-6 flex items-start justify-between gap-6 border-b border-neutral-200 pb-5">
          <div className="flex min-w-0 items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={model.logoUrl}
              alt=""
              className="h-10 w-auto max-w-[72px] object-contain"
              style={{ filter: "grayscale(1) brightness(0)" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="min-w-0">
              <p className="text-[15px] font-bold tracking-tight text-neutral-950">
                {model.businessName}
              </p>
              {model.branchMeta.map((m) => (
                <p key={m} className="text-[11px] leading-relaxed text-neutral-500">
                  {m}
                </p>
              ))}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <h1 className="text-[28px] font-extrabold leading-none tracking-tight text-neutral-950">
              {model.docLabel}
            </h1>
            <p className="mt-2 text-[11px] text-neutral-600">
              <span className="font-semibold text-neutral-800">Date</span> ·{" "}
              {model.date}
            </p>
            <p className="text-[11px] text-neutral-600">
              <span className="font-semibold text-neutral-800">No.</span> ·{" "}
              {model.docNumber}
            </p>
          </div>
        </header>

        <div className="mb-6">
          <h2 className="text-[9px] font-bold uppercase tracking-[0.08em] text-neutral-500">
            Bill to
          </h2>
          <p className="mt-1 text-sm font-semibold text-neutral-900">
            {model.buyerName}
          </p>
          {model.buyerPhone ? (
            <p className="text-[12px] text-neutral-500">{model.buyerPhone}</p>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-300 bg-neutral-50 text-left text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                <th className="px-2 py-2.5">No.</th>
                <th className="px-2 py-2.5">Description</th>
                <th className="px-2 py-2.5 text-right">Qty</th>
                <th className="px-2 py-2.5 text-right">Unit</th>
                <th className="px-2 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {model.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-6 text-center text-sm text-neutral-400"
                  >
                    No line items on this document
                  </td>
                </tr>
              ) : (
                model.rows.map((r, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="px-2 py-2.5 text-neutral-400">{r.no}</td>
                    <td className="px-2 py-2.5 text-neutral-900">
                      {r.description}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {r.quantity}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {r.unitPrice}
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">
                      {r.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-8 sm:flex-row">
          <div className="min-w-0 flex-1">
            <h2 className="text-[9px] font-bold uppercase tracking-[0.08em] text-neutral-500">
              Payment details
            </h2>
            {model.paymentFields.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-400">
                No payment details. Set them under branch settings → Receipts
                &amp; invoices
                {!model.applyLive
                  ? ", then enable “apply to existing” for older documents"
                  : ""}
                .
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {model.paymentFields.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="min-w-[5.5rem] font-semibold text-neutral-700">
                      {f.label}
                    </span>
                    <span className="text-neutral-800">{f.value || "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="w-full max-w-[210px] text-sm tabular-nums">
            <div className="flex justify-between py-1 text-neutral-700">
              <span>Subtotal</span>
              <span>
                {model.currency} {model.subtotal}
              </span>
            </div>
            {model.showDiscount ? (
              <div className="flex justify-between py-1 text-neutral-500">
                <span>Discount</span>
                <span>
                  − {model.currency} {model.discount}
                </span>
              </div>
            ) : null}
            {model.showTax ? (
              <div className="flex justify-between py-1 text-neutral-500">
                <span>Tax ({model.taxRate})</span>
                <span>
                  {model.currency} {model.tax}
                </span>
              </div>
            ) : null}
            <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 text-[13px] font-extrabold tracking-tight text-neutral-950">
              <span>Total</span>
              <span>
                {model.currency} {model.total}
              </span>
            </div>
            {model.showPaid ? (
              <div className="flex justify-between py-1 text-neutral-500">
                <span>Paid</span>
                <span>
                  {model.currency} {model.amountPaid}
                </span>
              </div>
            ) : null}
            {model.showBalance ? (
              <div className="flex justify-between py-1 font-semibold text-neutral-800">
                <span>Balance due</span>
                <span>
                  {model.currency} {model.balanceDue}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-200 pt-4 text-[11px] leading-relaxed text-neutral-500 whitespace-pre-wrap">
          <h2 className="mb-2 text-[9px] font-bold uppercase tracking-[0.08em] text-neutral-500">
            Terms & conditions
          </h2>
          {model.terms}
        </div>

        <div className="mt-12 flex flex-wrap justify-between gap-10 text-[9px] uppercase tracking-wide text-neutral-500">
          <div className="min-w-[150px] border-t border-neutral-400 pt-2">
            Authorized signature
          </div>
          <div className="min-w-[150px] border-t border-neutral-400 pt-2">
            Date / name
          </div>
        </div>
      </article>
    </div>
  );
}
