"use client";

import type { DocumentModel } from "@/features/documents/lib/documentModel";
import {
  escapeHtml,
  money,
  printHtmlDocument,
} from "@/features/documents/lib/documentModel";

export function buildFormalPrintHtml(m: DocumentModel): string {
  const page = m.paper === "A4" ? "A4" : "A5";
  const rowHtml = m.rows
    .map(
      (r) => `
    <tr>
      <td class="c-no">${r.no}</td>
      <td>${escapeHtml(r.description)}</td>
      <td class="num">${r.quantity}</td>
      <td class="num">${escapeHtml(money(r.unitPrice))}</td>
      <td class="num">${escapeHtml(money(r.total))}</td>
    </tr>`,
    )
    .join("");
  const metaHtml = m.branchMeta
    .map((x) => `<div class="meta-line">${escapeHtml(x)}</div>`)
    .join("");
  const payHtml = m.paymentFields
    .map(
      (f) =>
        `<div class="pay-row"><span class="lbl">${escapeHtml(f.label)}</span><span>${escapeHtml(f.value || "—")}</span></div>`,
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Invoice ${escapeHtml(m.docNumber)}</title>
<style>
  @page { size: ${page}; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif;
    color: #171717; margin: 0; font-size: 11px; line-height: 1.45;
  }
  .top {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e5e5; margin-bottom: 20px;
  }
  .brand { display: flex; gap: 12px; align-items: flex-start; }
  .brand img { height: 40px; width: auto; max-width: 72px; object-fit: contain;
    filter: grayscale(1) brightness(0); }
  .brand-name { font-weight: 700; font-size: 15px; margin: 0 0 4px; color: #0a0a0a; }
  .meta-line { font-size: 10px; color: #525252; }
  .doc-title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 8px; }
  .doc-meta { font-size: 10.5px; color: #404040; text-align: right; }
  .parties h3, .pay h3, .terms h3 {
    margin: 0 0 6px; font-size: 9px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; color: #737373;
  }
  .parties { margin-bottom: 22px; }
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
  tbody td { padding: 10px 8px; border-bottom: 1px solid #f0f0f0; }
  .bottom { display: flex; justify-content: space-between; gap: 32px; }
  .pay-row { display: flex; gap: 8px; margin-bottom: 5px; font-size: 10.5px; }
  .pay-row .lbl { font-weight: 600; min-width: 88px; }
  .totals { width: 200px; }
  .totals .row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 11px; color: #404040; }
  .totals .row.muted { color: #737373; font-size: 10.5px; }
  .totals .divider { border-top: 1px solid #e5e5e5; margin: 6px 0; }
  .totals .grand {
    display: flex; justify-content: space-between; padding: 8px 0 0;
    font-size: 13px; font-weight: 800; color: #0a0a0a;
  }
  .terms {
    margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e5e5;
    font-size: 9.5px; color: #525252; white-space: pre-wrap;
  }
  .sig { display: flex; justify-content: space-between; margin-top: 40px; gap: 48px; }
  .sig .line {
    border-top: 1px solid #a3a3a3; padding-top: 8px; min-width: 150px;
    font-size: 9px; text-transform: uppercase; color: #737373;
  }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body>
<div class="top">
  <div class="brand">
    <img src="${escapeHtml(m.logoUrl)}" alt="" onerror="this.style.display='none'"/>
    <div>
      <p class="brand-name">${escapeHtml(m.businessName)}</p>
      ${metaHtml}
    </div>
  </div>
  <div>
    <p class="doc-title">INVOICE</p>
    <div class="doc-meta">
      <div><strong>Date</strong> · ${escapeHtml(m.issuedAt)}</div>
      <div><strong>No.</strong> · ${escapeHtml(m.docNumber)}</div>
    </div>
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
<div class="bottom">
  <div class="pay">
    <h3>Payment details</h3>
    ${payHtml || `<div class="pay-row"><span class="lbl">—</span></div>`}
  </div>
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${escapeHtml(m.currency)} ${escapeHtml(money(m.subtotal))}</span></div>
    ${m.showDiscount ? `<div class="row muted"><span>Discount</span><span>− ${escapeHtml(m.currency)} ${escapeHtml(money(m.discount))}</span></div>` : ""}
    ${m.showTax ? `<div class="row muted"><span>Tax (${escapeHtml(m.taxRateLabel)})</span><span>${escapeHtml(m.currency)} ${escapeHtml(money(m.tax))}</span></div>` : ""}
    <div class="divider"></div>
    <div class="grand"><span>Total</span><span>${escapeHtml(m.currency)} ${escapeHtml(money(m.total))}</span></div>
    ${m.showPaid ? `<div class="row muted"><span>Paid</span><span>${escapeHtml(m.currency)} ${escapeHtml(money(m.amountPaid))}</span></div>` : ""}
    ${m.showBalance ? `<div class="row"><span>Balance due</span><span>${escapeHtml(m.currency)} ${escapeHtml(money(m.balanceDue))}</span></div>` : ""}
  </div>
</div>
<div class="terms">
  <h3>Terms &amp; conditions</h3>
  ${escapeHtml(m.terms)}
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
  return (
    <article
      className="rounded-sm border border-neutral-200 bg-white p-6 text-neutral-900 shadow-sm sm:p-10 print:border-0 print:shadow-none"
      style={{ fontFamily: "system-ui, Segoe UI, sans-serif" }}
    >
      <header className="mb-6 flex items-start justify-between gap-6 border-b border-neutral-200 pb-5">
        <div className="flex min-w-0 items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.logoUrl}
            alt=""
            className="h-10 w-auto max-w-[72px] object-contain"
            style={{ filter: "grayscale(1) brightness(0)" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-tight text-neutral-950">
              {m.businessName}
            </p>
            {m.branchMeta.map((x) => (
              <p key={x} className="text-[11px] leading-relaxed text-neutral-500">
                {x}
              </p>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <h1 className="text-[28px] font-extrabold leading-none tracking-tight text-neutral-950">
            INVOICE
          </h1>
          <p className="mt-2 text-[11px] text-neutral-600">
            <span className="font-semibold text-neutral-800">Date</span> ·{" "}
            {m.issuedAt}
          </p>
          <p className="text-[11px] text-neutral-600">
            <span className="font-semibold text-neutral-800">No.</span> ·{" "}
            {m.docNumber}
          </p>
        </div>
      </header>

      <div className="mb-6">
        <h2 className="text-[9px] font-bold uppercase tracking-[0.08em] text-neutral-500">
          Bill to
        </h2>
        <p className="mt-1 text-sm font-semibold">{m.buyerName}</p>
        {m.buyerPhone ? (
          <p className="text-[12px] text-neutral-500">{m.buyerPhone}</p>
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
            {m.rows.map((r) => (
              <tr key={r.no} className="border-b border-neutral-100">
                <td className="px-2 py-2.5 text-neutral-400">{r.no}</td>
                <td className="px-2 py-2.5">{r.description}</td>
                <td className="px-2 py-2.5 text-right tabular-nums">
                  {r.quantity}
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums">
                  {money(r.unitPrice)}
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums">
                  {money(r.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col justify-between gap-8 sm:flex-row">
        <div className="min-w-0 flex-1">
          <h2 className="text-[9px] font-bold uppercase tracking-[0.08em] text-neutral-500">
            Payment details
          </h2>
          {m.paymentFields.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-400">
              No payment details configured.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {m.paymentFields.map((f, i) => (
                <li key={i} className="flex gap-2">
                  <span className="min-w-[5.5rem] font-semibold text-neutral-700">
                    {f.label}
                  </span>
                  <span>{f.value || "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="w-full max-w-[210px] text-sm tabular-nums">
          <div className="flex justify-between py-1 text-neutral-700">
            <span>Subtotal</span>
            <span>
              {m.currency} {money(m.subtotal)}
            </span>
          </div>
          {m.showDiscount ? (
            <div className="flex justify-between py-1 text-neutral-500">
              <span>Discount</span>
              <span>
                − {m.currency} {money(m.discount)}
              </span>
            </div>
          ) : null}
          {m.showTax ? (
            <div className="flex justify-between py-1 text-neutral-500">
              <span>Tax ({m.taxRateLabel})</span>
              <span>
                {m.currency} {money(m.tax)}
              </span>
            </div>
          ) : null}
          <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 text-[13px] font-extrabold text-neutral-950">
            <span>Total</span>
            <span>
              {m.currency} {money(m.total)}
            </span>
          </div>
          {m.showPaid ? (
            <div className="flex justify-between py-1 text-neutral-500">
              <span>Paid</span>
              <span>
                {m.currency} {money(m.amountPaid)}
              </span>
            </div>
          ) : null}
          {m.showBalance ? (
            <div className="flex justify-between py-1 font-semibold">
              <span>Balance due</span>
              <span>
                {m.currency} {money(m.balanceDue)}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 border-t border-neutral-200 pt-4 text-[11px] leading-relaxed text-neutral-500 whitespace-pre-wrap">
        <h2 className="mb-2 text-[9px] font-bold uppercase tracking-[0.08em] text-neutral-500">
          Terms & conditions
        </h2>
        {m.terms}
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
  );
}
