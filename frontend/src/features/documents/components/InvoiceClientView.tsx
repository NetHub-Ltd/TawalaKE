"use client";

/**
 * A5/A4 printable & downloadable invoice/receipt.
 * Backwards-compatible with pre-branding snapshots (no branding / no service_lines).
 * Line table: products + services; discount & tax only in totals (no double-count).
 */

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
};

type ServiceLine = { description: string; amount: number };

/** Loose shape — legacy snapshots omit branding and some financial fields. */
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
    discount_amount?: number;
  }>;
  payments?: Array<{
    method?: string;
    amount?: number;
    reference?: string | null;
  }>;
  summary?: {
    services?: ServiceLine[];
    service_total?: number;
    discount_amount?: number;
  };
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
      <td>${escapeHtml(String(r.no))}</td>
      <td>${escapeHtml(r.description)}</td>
      <td class="num">${escapeHtml(r.quantity)}</td>
      <td class="num">${escapeHtml(r.unitPrice)}</td>
      <td class="num">${escapeHtml(r.total)}</td>
    </tr>`,
    )
    .join("");

  const payHtml = opts.paymentFields
    .map(
      (f) =>
        `<div class="pay-row"><span class="lbl">${escapeHtml(f.label)}:</span> <span>${escapeHtml(f.value)}</span></div>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${escapeHtml(opts.docLabel)} ${escapeHtml(opts.docNumber)}</title>
<style>
  @page { size: ${page}; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #111; margin: 0; font-size: 11px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; gap: 12px; }
  .brand { display: flex; gap: 10px; align-items: center; }
  .brand img { height: 36px; width: auto; filter: grayscale(1) brightness(0); }
  .brand-name { font-weight: 700; font-size: 14px; }
  .title { font-size: 26px; font-weight: 800; margin: 0; }
  .meta { text-align: right; font-size: 11px; line-height: 1.5; }
  .parties { margin: 16px 0 18px; }
  .parties h3 { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.06em; }
  .parties p { margin: 0; line-height: 1.45; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  thead th { background: #d4d4d4; text-align: left; padding: 8px 6px; font-size: 10px; }
  thead th.num, td.num { text-align: right; }
  tbody td { padding: 8px 6px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #fafafa; }
  .bottom { display: flex; justify-content: space-between; gap: 24px; margin-top: 8px; }
  .pay h3, .terms h3 { margin: 0 0 8px; font-size: 11px; letter-spacing: 0.06em; }
  .pay-row { margin-bottom: 4px; }
  .pay-row .lbl { font-weight: 600; }
  .totals { min-width: 190px; }
  .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .grand { border: 1.5px solid #111; padding: 8px 10px; margin-top: 6px; font-weight: 800; display: flex; justify-content: space-between; }
  .terms { margin-top: 24px; font-size: 10px; line-height: 1.5; color: #333; white-space: pre-wrap; }
  .sig { display: flex; justify-content: space-between; margin-top: 32px; gap: 40px; }
  .sig .line { border-top: 1px solid #111; padding-top: 6px; min-width: 140px; font-size: 10px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="sheet">
  <div class="header">
    <div class="brand">
      <img src="${escapeHtml(opts.logoUrl)}" alt="" onerror="this.style.display='none'"/>
      <span class="brand-name">${escapeHtml(opts.businessName)}</span>
    </div>
    <div>
      <p class="title">${escapeHtml(opts.docLabel)}</p>
      <div class="meta">
        <div><strong>DATE:</strong> ${escapeHtml(opts.date)}</div>
        <div><strong>NO:</strong> ${escapeHtml(opts.docNumber)}</div>
      </div>
    </div>
  </div>
  <div class="parties">
    <h3>INVOICE TO</h3>
    <p><strong>${escapeHtml(opts.buyerName || "Walk-in customer")}</strong></p>
    ${opts.buyerPhone ? `<p>${escapeHtml(opts.buyerPhone)}</p>` : ""}
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:8%">NO.</th>
        <th>DESCRIPTION</th>
        <th class="num" style="width:12%">QTY</th>
        <th class="num" style="width:16%">UNIT PRICE</th>
        <th class="num" style="width:16%">TOTAL</th>
      </tr>
    </thead>
    <tbody>${rowHtml || `<tr><td colspan="5">No line items</td></tr>`}</tbody>
  </table>
  <div class="bottom">
    <div class="pay">
      <h3>PAYMENT DETAILS</h3>
      ${payHtml || "<div class='pay-row'>—</div>"}
    </div>
    <div class="totals">
      <div class="row"><span>SUBTOTAL:</span><span>${escapeHtml(opts.currency)} ${escapeHtml(opts.subtotal)}</span></div>
      ${opts.showDiscount ? `<div class="row"><span>DISCOUNT:</span><span>-${escapeHtml(opts.currency)} ${escapeHtml(opts.discount)}</span></div>` : ""}
      ${opts.showTax ? `<div class="row"><span>TAX (${escapeHtml(opts.taxRate)}):</span><span>${escapeHtml(opts.currency)} ${escapeHtml(opts.tax)}</span></div>` : ""}
      <div class="grand"><span>TOTAL:</span><span>${escapeHtml(opts.currency)} ${escapeHtml(opts.total)}</span></div>
      ${opts.showPaid ? `<div class="row"><span>PAID:</span><span>${escapeHtml(opts.currency)} ${escapeHtml(opts.amountPaid)}</span></div>` : ""}
      ${opts.showBalance ? `<div class="row"><span>BALANCE DUE:</span><span>${escapeHtml(opts.currency)} ${escapeHtml(opts.balanceDue)}</span></div>` : ""}
    </div>
  </div>
  <div class="terms">
    <h3>TERMS &amp; CONDITIONS</h3>
    ${escapeHtml(opts.terms)}
  </div>
  <div class="sig">
    <div class="line">AUTHORIZED SIGNATURE</div>
    <div class="line">DATE / NAME</div>
  </div>
</div>
</body></html>`;
}

function printHtml(html: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Print document");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
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
  const { data, isLoading, error, isFetching, refetch } = useReceipt(saleId);
  const receipt = data as ReceiptData | undefined;
  const [busy, setBusy] = useState<"print" | "pdf" | null>(null);

  const model = useMemo(() => {
    if (!receipt || typeof receipt !== "object") return null;

    const fin = receipt.financials || {};
    const seller = receipt.seller || {};
    const branding = receipt.branding || {};
    const currency = fin.currency || "KES";
    const balanceDue = Number(fin.balance_due) || 0;
    const amountPaid = Number(fin.amount_paid) || 0;
    const totalAmount = Number(fin.total_amount) || 0;
    const dtype = docTypeString(receipt.document_type);
    const isInvoice =
      balanceDue > 0.001 || /invoice|credit/i.test(dtype);

    const services = resolveServices(receipt);
    const discount = Number(fin.discount_amount ?? receipt.summary?.discount_amount) || 0;
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
    // Discount only in totals — avoids double-counting vs older thermal layout

    const paper =
      String(branding.paper_size || "A5").toUpperCase() === "A4" ? "A4" : "A5";

    let paymentFields = (branding.payment_fields || []).filter(
      (f) => f && (f.label || f.value),
    ) as PaymentField[];

    // Legacy: no configured payment fields → show recorded tender lines
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

    const businessName =
      (branding.display_name && String(branding.display_name).trim()) ||
      seller.business_name ||
      "Business";

    return {
      paper: paper as "A5" | "A4",
      logoUrl: branding.logo_url || DEFAULT_LOGO,
      businessName,
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
      showTax: tax > 0,
      showDiscount: discount > 0,
      showBalance: isInvoice && balanceDue > 0.001,
      showPaid: amountPaid > 0,
      isInvoice,
    };
  }, [receipt, saleId]);

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

  const handlePrint = () => {
    setBusy("print");
    try {
      printHtml(buildPrintHtml(htmlOpts));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Print failed");
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = () => {
    setBusy("pdf");
    try {
      // Browser print → “Save as PDF” keeps A5 layout accurate
      printHtml(buildPrintHtml(htmlOpts));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Download failed");
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
            onClick={handlePrint}
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
            onClick={handleDownload}
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
        Paper: {model.paper}. Save PDF uses the system print dialog (choose
        “Save as PDF”).
      </p>

      <article
        className="rounded-sm border border-border bg-white p-6 text-[#111] shadow-sm sm:p-8 print:border-0 print:shadow-none"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={model.logoUrl}
              alt=""
              className="h-9 w-auto object-contain"
              style={{ filter: "grayscale(1) brightness(0)" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="text-sm font-bold tracking-wide">
              {model.businessName}
            </span>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {model.docLabel}
            </h1>
            <p className="mt-1 text-xs">
              <span className="font-semibold">DATE:</span> {model.date}
            </p>
            <p className="text-xs">
              <span className="font-semibold">NO:</span> {model.docNumber}
            </p>
          </div>
        </header>

        <div className="mb-5">
          <h2 className="text-[11px] font-bold tracking-wider">INVOICE TO</h2>
          <p className="mt-1 text-sm font-semibold">{model.buyerName}</p>
          {model.buyerPhone ? (
            <p className="text-sm text-neutral-600">{model.buyerPhone}</p>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-300 text-left text-[10px] font-semibold tracking-wide">
                <th className="px-2 py-2">NO.</th>
                <th className="px-2 py-2">DESCRIPTION</th>
                <th className="px-2 py-2 text-right">QTY</th>
                <th className="px-2 py-2 text-right">UNIT PRICE</th>
                <th className="px-2 py-2 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {model.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-2 py-4 text-center text-sm text-neutral-500"
                  >
                    No line items on this document
                  </td>
                </tr>
              ) : (
                model.rows.map((r, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 1 ? "bg-neutral-50" : undefined}
                  >
                    <td className="border-b border-neutral-200 px-2 py-2">
                      {r.no}
                    </td>
                    <td className="border-b border-neutral-200 px-2 py-2">
                      {r.description}
                    </td>
                    <td className="border-b border-neutral-200 px-2 py-2 text-right">
                      {r.quantity}
                    </td>
                    <td className="border-b border-neutral-200 px-2 py-2 text-right">
                      {r.unitPrice}
                    </td>
                    <td className="border-b border-neutral-200 px-2 py-2 text-right">
                      {r.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-6 sm:flex-row">
          <div className="min-w-0 flex-1">
            <h2 className="text-[11px] font-bold tracking-wider">
              PAYMENT DETAILS
            </h2>
            {model.paymentFields.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">
                No payment details on this document. Configure defaults in
                branch settings → Receipts & invoices.
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {model.paymentFields.map((f, i) => (
                  <li key={i}>
                    <span className="font-semibold">{f.label}:</span>{" "}
                    {f.value || "—"}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="w-full max-w-[220px] text-sm">
            <div className="flex justify-between py-1">
              <span>SUBTOTAL:</span>
              <span>
                {model.currency} {model.subtotal}
              </span>
            </div>
            {model.showDiscount ? (
              <div className="flex justify-between py-1">
                <span>DISCOUNT:</span>
                <span>
                  -{model.currency} {model.discount}
                </span>
              </div>
            ) : null}
            {model.showTax ? (
              <div className="flex justify-between py-1">
                <span>TAX ({model.taxRate}):</span>
                <span>
                  {model.currency} {model.tax}
                </span>
              </div>
            ) : null}
            <div className="mt-2 flex justify-between border-2 border-neutral-900 px-2 py-2 font-extrabold">
              <span>TOTAL:</span>
              <span>
                {model.currency} {model.total}
              </span>
            </div>
            {model.showPaid ? (
              <div className="flex justify-between py-1 text-neutral-600">
                <span>PAID:</span>
                <span>
                  {model.currency} {model.amountPaid}
                </span>
              </div>
            ) : null}
            {model.showBalance ? (
              <div className="flex justify-between py-1 font-semibold">
                <span>BALANCE DUE:</span>
                <span>
                  {model.currency} {model.balanceDue}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 whitespace-pre-wrap text-xs leading-relaxed text-neutral-700">
          <h2 className="mb-1 text-[11px] font-bold tracking-wider text-neutral-900">
            TERMS & CONDITIONS
          </h2>
          {model.terms}
        </div>

        <div className="mt-12 flex flex-wrap justify-between gap-8 text-[10px]">
          <div className="min-w-[140px] border-t border-neutral-900 pt-2">
            AUTHORIZED SIGNATURE
          </div>
          <div className="min-w-[140px] border-t border-neutral-900 pt-2">
            DATE / NAME
          </div>
        </div>
      </article>
    </div>
  );
}
