"use client";

import type { DocumentModel } from "@/features/documents/lib/documentModel";
import {
  escapeHtml,
  money,
  printHtmlDocument,
} from "@/features/documents/lib/documentModel";

/** Payment status for formal invoice badge. */
export function invoicePaymentStatus(m: DocumentModel): {
  label: string;
  kind: "unpaid" | "partial" | "paid";
} {
  const due = Number(m.balanceDue) || 0;
  const paid = Number(m.amountPaid) || 0;
  if (due > 0.001 && paid <= 0.001) return { label: "Unpaid", kind: "unpaid" };
  if (due > 0.001 && paid > 0.001) return { label: "Partially paid", kind: "partial" };
  return { label: "Paid", kind: "paid" };
}

function statusBadgeStyles(kind: "unpaid" | "partial" | "paid") {
  if (kind === "paid") {
    return {
      bg: "#ecfdf5",
      border: "#6ee7b7",
      color: "#047857",
    };
  }
  if (kind === "partial") {
    return {
      bg: "#fffbeb",
      border: "#fcd34d",
      color: "#b45309",
    };
  }
  return {
    bg: "#fef2f2",
    border: "#fca5a5",
    color: "#b91c1c",
  };
}

export function buildFormalPrintHtml(m: DocumentModel): string {
  const page = m.paper === "A4" ? "A4" : "A5";
  const status = invoicePaymentStatus(m);
  const badge = statusBadgeStyles(status.kind);
  const docKind =
    status.kind === "paid" && !m.isInvoicePreferred ? "RECEIPT" : "INVOICE";

  const rowHtml = m.rows
    .map(
      (r) => `
    <tr>
      <td class="c-no">${r.no}</td>
      <td class="desc">${escapeHtml(r.description)}</td>
      <td class="num">${r.quantity}</td>
      <td class="num">${escapeHtml(money(r.unitPrice))}</td>
      <td class="num">${escapeHtml(money(r.total))}</td>
    </tr>`,
    )
    .join("");
  const metaHtml = m.branchMeta
    .map((x) => `<div class="meta-line">${escapeHtml(x)}</div>`)
    .join("");
  const payHtml = (m.tenderLines.length ? m.tenderLines : m.paymentFields)
    .map(
      (f) =>
        `<div class="pay-row"><span class="lbl">${escapeHtml(f.label)}</span><span class="val">${escapeHtml(f.value || "—")}</span></div>`,
    )
    .join("");

  const goods = m.showDiscount ? m.goodsSubtotal ?? m.subtotal : m.subtotal;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${docKind} ${escapeHtml(m.docNumber)}</title>
<style>
  @page { size: ${page}; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif;
    color: #0a0a0a; margin: 0; font-size: 12px; line-height: 1.5;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .top {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 16px; padding-bottom: 14px; border-bottom: 2px solid #171717; margin-bottom: 18px;
  }
  .brand { display: flex; gap: 12px; align-items: flex-start; }
  .brand img { height: 42px; width: auto; max-width: 80px; object-fit: contain; }
  .brand-name { font-weight: 800; font-size: 16px; margin: 0 0 4px; color: #0a0a0a; letter-spacing: -0.01em; }
  .meta-line { font-size: 11px; color: #262626; }
  .doc-head { text-align: right; }
  .doc-title { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 6px; color: #0a0a0a; }
  .doc-meta { font-size: 11px; color: #171717; text-align: right; }
  .doc-meta strong { font-weight: 700; }
  .status-badge {
    display: inline-block; margin-top: 8px; padding: 4px 10px;
    border-radius: 999px; border: 1.5px solid ${badge.border};
    background: ${badge.bg}; color: ${badge.color};
    font-size: 10px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .parties { margin-bottom: 18px; }
  .parties h3, .section-title {
    margin: 0 0 6px; font-size: 10px; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase; color: #404040;
  }
  .parties .name { font-size: 13px; font-weight: 700; margin: 0; color: #0a0a0a; }
  .parties .sub { font-size: 11px; color: #262626; margin: 2px 0 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead th {
    background: #f5f5f5; text-align: left; padding: 10px 8px;
    font-size: 10px; font-weight: 800; letter-spacing: 0.04em;
    text-transform: uppercase; color: #171717; border-bottom: 1px solid #d4d4d4;
  }
  thead th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }
  tbody td { padding: 10px 8px; border-bottom: 1px solid #e5e5e5; color: #171717; font-size: 12px; vertical-align: top; }
  td.c-no { color: #525252; width: 36px; }
  td.desc { font-weight: 500; color: #0a0a0a; }
  .totals-wrap {
    display: flex; justify-content: flex-end; margin-bottom: 18px;
  }
  .totals {
    width: 100%; max-width: 280px; font-size: 12px;
  }
  .totals .row {
    display: flex; justify-content: space-between; gap: 24px;
    padding: 5px 0; color: #171717;
  }
  .totals .row.muted { color: #404040; }
  .totals .divider { border-top: 1px solid #a3a3a3; margin: 6px 0; }
  .totals .grand {
    display: flex; justify-content: space-between; gap: 24px;
    font-size: 14px; font-weight: 800; color: #0a0a0a; padding: 6px 0 4px;
  }
  .totals .due {
    display: flex; justify-content: space-between; gap: 24px;
    font-weight: 800; color: #b91c1c; padding: 4px 0;
  }
  .totals .paid-line {
    display: flex; justify-content: space-between; gap: 24px;
    color: #047857; font-weight: 600; padding: 4px 0;
  }
  .pay-block {
    margin-bottom: 18px; padding: 12px 14px;
    border: 1px solid #d4d4d4; border-radius: 6px; background: #fafafa;
  }
  .pay-row {
    display: flex; justify-content: space-between; gap: 12px;
    font-size: 12px; padding: 4px 0; color: #171717;
  }
  .pay-row .lbl { font-weight: 700; color: #262626; min-width: 5rem; }
  .pay-row .val { text-align: right; font-variant-numeric: tabular-nums; }
  .terms { margin-top: 8px; padding-top: 14px; border-top: 1px solid #d4d4d4; }
  .terms p, .terms-body {
    margin: 0; font-size: 11px; color: #262626; line-height: 1.55; white-space: pre-wrap;
  }
  .sig {
    display: flex; justify-content: space-between; gap: 40px; margin-top: 36px;
  }
  .sig .line {
    flex: 1; max-width: 200px; border-top: 1px solid #525252;
    padding-top: 6px; font-size: 10px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase; color: #404040;
  }
</style></head><body>
<div class="top">
  <div class="brand">
    <img src="${escapeHtml(m.logoUrl)}" alt="" onerror="this.style.display='none'"/>
    <div>
      <p class="brand-name">${escapeHtml(m.businessName)}</p>
      ${metaHtml}
    </div>
  </div>
  <div class="doc-head">
    <p class="doc-title">${docKind}</p>
    <div class="doc-meta">
      <div><strong>Date</strong> · ${escapeHtml(m.issuedAt)}</div>
      <div><strong>No.</strong> · ${escapeHtml(m.docNumber)}</div>
    </div>
    <span class="status-badge">${escapeHtml(status.label)}</span>
  </div>
</div>
<div class="parties">
  <h3>Bill to</h3>
  <p class="name">${escapeHtml(m.buyerName)}</p>
  ${m.buyerPhone ? `<p class="sub">${escapeHtml(m.buyerPhone)}</p>` : ""}
</div>
<table>
  <thead>
    <tr>
      <th>No.</th><th>Description</th>
      <th class="num">Qty</th><th class="num">Unit</th><th class="num">Amount</th>
    </tr>
  </thead>
  <tbody>${rowHtml || `<tr><td colspan="5">No line items</td></tr>`}</tbody>
</table>

<div class="totals-wrap">
  <div class="totals">
    <div class="row"><span>${m.showDiscount ? "Goods" : "Subtotal"}</span><span>${escapeHtml(m.currency)} ${escapeHtml(money(goods))}</span></div>
    ${m.showDiscount ? `<div class="row muted"><span>Discount</span><span>− ${escapeHtml(m.currency)} ${escapeHtml(money(m.discount))}</span></div>` : ""}
    ${m.showTax ? `<div class="row muted"><span>Tax (${escapeHtml(m.taxRateLabel)})</span><span>${escapeHtml(m.currency)} ${escapeHtml(money(m.tax))}</span></div>` : ""}
    <div class="divider"></div>
    <div class="grand"><span>Total</span><span>${escapeHtml(m.currency)} ${escapeHtml(money(m.total))}</span></div>
    ${m.amountPaid > 0.001 ? `<div class="paid-line"><span>Paid</span><span>${escapeHtml(m.currency)} ${escapeHtml(money(m.amountPaid))}</span></div>` : ""}
    ${m.balanceDue > 0.001 ? `<div class="due"><span>Balance due</span><span>${escapeHtml(m.currency)} ${escapeHtml(money(m.balanceDue))}</span></div>` : ""}
    ${status.kind === "paid" ? `<div class="paid-line"><span>Status</span><span>Paid in full</span></div>` : ""}
  </div>
</div>

<div class="pay-block">
  <h3 class="section-title">Payment details</h3>
  ${payHtml || `<div class="pay-row"><span class="lbl">Method</span><span class="val">—</span></div>`}
</div>

<div class="terms">
  <h3 class="section-title">Terms &amp; conditions</h3>
  <div class="terms-body">${escapeHtml(m.terms)}</div>
</div>
<div class="sig">
  <div class="line">Authorized signature</div>
  <div class="line">Date / name</div>
</div>
</body></html>`;
}

export function printFormalInvoice(m: DocumentModel) {
  printHtmlDocument(buildFormalPrintHtml(m));
}

export function FormalInvoicePreview({ model }: { model: DocumentModel }) {
  const m = model;
  const status = invoicePaymentStatus(m);
  const docKind =
    status.kind === "paid" && !m.isInvoicePreferred ? "Receipt" : "Invoice";
  const goods = m.showDiscount ? m.goodsSubtotal ?? m.subtotal : m.subtotal;
  const tenders = m.tenderLines.length ? m.tenderLines : m.paymentFields;

  const badgeClass =
    status.kind === "paid"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
      : status.kind === "partial"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-rose-300 bg-rose-50 text-rose-800";

  return (
    <article
      className="rounded-sm border border-neutral-300 bg-white p-6 text-neutral-950 shadow-sm sm:p-10 print:border-0 print:shadow-none"
      style={{ fontFamily: "system-ui, Segoe UI, sans-serif" }}
    >
      <header className="mb-6 flex items-start justify-between gap-6 border-b-2 border-neutral-900 pb-5">
        <div className="flex min-w-0 items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.logoUrl}
            alt=""
            className="h-10 w-auto max-w-[72px] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="min-w-0">
            <p className="text-[16px] font-extrabold tracking-tight text-neutral-950">
              {m.businessName}
            </p>
            {m.branchMeta.map((line, i) => (
              <p key={i} className="text-[12px] leading-snug text-neutral-700">
                {line}
              </p>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[22px] font-extrabold tracking-tight text-neutral-950">
            {docKind}
          </p>
          <p className="mt-1 text-[12px] text-neutral-800">
            <span className="font-bold">Date</span> · {m.issuedAt}
          </p>
          <p className="text-[12px] text-neutral-800">
            <span className="font-bold">No.</span> · {m.docNumber}
          </p>
          <span
            className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${badgeClass}`}
          >
            {status.label}
          </span>
        </div>
      </header>

      <div className="mb-5">
        <h2 className="text-[10px] font-extrabold tracking-[0.1em] text-neutral-600 uppercase">
          Bill to
        </h2>
        <p className="mt-1 text-[13px] font-bold text-neutral-950">{m.buyerName}</p>
        {m.buyerPhone ? (
          <p className="text-[12px] text-neutral-700">{m.buyerPhone}</p>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-neutral-300 bg-neutral-100 text-left text-[10px] font-extrabold tracking-wide text-neutral-900 uppercase">
              <th className="px-2 py-2.5">No.</th>
              <th className="px-2 py-2.5">Description</th>
              <th className="px-2 py-2.5 text-right">Qty</th>
              <th className="px-2 py-2.5 text-right">Unit</th>
              <th className="px-2 py-2.5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {m.rows.map((r) => (
              <tr key={r.no} className="border-b border-neutral-200">
                <td className="px-2 py-2.5 text-neutral-600">{r.no}</td>
                <td className="px-2 py-2.5 font-medium text-neutral-950">
                  {r.description}
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums text-neutral-900">
                  {r.quantity}
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums text-neutral-900">
                  {money(r.unitPrice)}
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums font-semibold text-neutral-950">
                  {money(r.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals alone — not beside payment details */}
      <div className="mt-5 flex justify-end">
        <div className="w-full max-w-[280px] text-[13px] tabular-nums">
          <div className="flex justify-between py-1 text-neutral-900">
            <span>{m.showDiscount ? "Goods" : "Subtotal"}</span>
            <span className="font-medium">
              {m.currency} {money(goods)}
            </span>
          </div>
          {m.showDiscount ? (
            <div className="flex justify-between py-1 text-neutral-700">
              <span>Discount</span>
              <span>
                − {m.currency} {money(m.discount)}
              </span>
            </div>
          ) : null}
          {m.showTax ? (
            <div className="flex justify-between py-1 text-neutral-700">
              <span>Tax ({m.taxRateLabel})</span>
              <span>
                {m.currency} {money(m.tax)}
              </span>
            </div>
          ) : null}
          <div className="mt-2 flex justify-between border-t border-neutral-400 pt-2 text-[14px] font-extrabold text-neutral-950">
            <span>Total</span>
            <span>
              {m.currency} {money(m.total)}
            </span>
          </div>
          {m.amountPaid > 0.001 ? (
            <div className="flex justify-between py-1 font-semibold text-emerald-800">
              <span>Paid</span>
              <span>
                {m.currency} {money(m.amountPaid)}
              </span>
            </div>
          ) : null}
          {m.balanceDue > 0.001 ? (
            <div className="flex justify-between py-1 font-extrabold text-rose-700">
              <span>Balance due</span>
              <span>
                {m.currency} {money(m.balanceDue)}
              </span>
            </div>
          ) : null}
          {status.kind === "paid" ? (
            <div className="flex justify-between py-1 font-semibold text-emerald-800">
              <span>Status</span>
              <span>Paid in full</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Payment details — full width block below totals */}
      <div className="mt-6 rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3">
        <h2 className="text-[10px] font-extrabold tracking-[0.1em] text-neutral-600 uppercase">
          Payment details
        </h2>
        {tenders.length === 0 ? (
          <p className="mt-2 text-[13px] text-neutral-700">
            {status.kind === "unpaid"
              ? "No payments recorded yet."
              : "No payment lines on this document."}
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-[13px]">
            {tenders.map((f, i) => (
              <li key={i} className="flex justify-between gap-3 text-neutral-900">
                <span className="font-bold text-neutral-800">{f.label}</span>
                <span className="tabular-nums text-right">{f.value || "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 border-t border-neutral-300 pt-4 text-[12px] leading-relaxed text-neutral-800 whitespace-pre-wrap">
        <h2 className="mb-2 text-[10px] font-extrabold tracking-[0.1em] text-neutral-600 uppercase">
          Terms & conditions
        </h2>
        {m.terms}
      </div>

      <div className="mt-12 flex flex-wrap justify-between gap-10 text-[10px] font-bold tracking-wide text-neutral-600 uppercase">
        <div className="min-w-[150px] border-t border-neutral-500 pt-2">
          Authorized signature
        </div>
        <div className="min-w-[150px] border-t border-neutral-500 pt-2">
          Date / name
        </div>
      </div>
    </article>
  );
}
