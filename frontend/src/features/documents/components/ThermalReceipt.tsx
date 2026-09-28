"use client";

/**
 * Shop / mart cash receipt — narrow slip for print; clean on-screen preview.
 */
import React from "react";
import type { DocumentModel } from "@/features/documents/lib/documentModel";
import { printHtmlDocument } from "@/features/documents/lib/documentModel";

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number, currency = "KES") {
  return `${currency} ${Number(n || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildThermalPrintHtml(m: DocumentModel): string {
  const rows = m.rows
    .map(
      (r) =>
        `<div class="line"><span class="name">${escapeHtml(r.descriptionWithQty)}</span><span class="amt">${escapeHtml(money(r.total, m.currency))}</span></div>`,
    )
    .join("");

  const tenders =
    (m.tenderLines.length > 0 ? m.tenderLines : m.paymentFields)
      .map(
        (t) =>
          `<div class="tender"><span>${escapeHtml(t.label)}</span><span>${escapeHtml(t.value || "")}</span></div>`,
      )
      .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Receipt ${escapeHtml(m.docNumber)}</title>
<style>
  @page { size: 80mm auto; margin: 3mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 12px; color: #111; background: #fff; width: 72mm;
  }
  .slip { padding: 6mm 4mm 8mm; }
  .brand { text-align: center; margin-bottom: 8px; }
  .brand h1 { margin: 0; font-size: 15px; font-weight: 800; letter-spacing: 0.02em; }
  .brand p { margin: 2px 0 0; font-size: 10px; color: #444; line-height: 1.35; }
  .badge {
    display: inline-block; margin: 8px auto; padding: 3px 10px;
    border: 1.5px solid #111; border-radius: 999px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  }
  .sep { border: none; border-top: 1px dashed #999; margin: 10px 0; }
  .line { display: flex; justify-content: space-between; gap: 8px; margin: 4px 0; }
  .line .name { flex: 1; min-width: 0; word-break: break-word; }
  .line .amt { flex-shrink: 0; font-variant-numeric: tabular-nums; font-weight: 600; }
  .totals .row { display: flex; justify-content: space-between; margin: 3px 0; }
  .totals .grand { font-weight: 800; font-size: 14px; margin-top: 6px; }
  .tender { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; color: #333; }
  .meta { font-size: 10px; color: #555; margin-top: 8px; line-height: 1.4; }
  .thanks { text-align: center; font-weight: 700; margin-top: 12px; font-size: 12px; }
  .docno { text-align: center; font-size: 10px; color: #666; margin-top: 4px; font-family: ui-monospace, monospace; }
</style></head><body>
<div class="slip">
  <div class="brand">
    <h1>${escapeHtml(m.businessName)}</h1>
    ${m.address ? `<p>${escapeHtml(m.address)}</p>` : ""}
    ${m.phone ? `<p>${escapeHtml(m.phone)}</p>` : ""}
  </div>
  <div style="text-align:center"><span class="badge">RECEIPT</span></div>
  <hr class="sep"/>
  ${rows}
  <hr class="sep"/>
  <div class="totals">
    ${m.discount > 0 ? `<div class="row"><span>Discount</span><span>-${escapeHtml(money(m.discount, m.currency))}</span></div>` : ""}
    <div class="row grand"><span>Total</span><span>${escapeHtml(money(m.total, m.currency))}</span></div>
  </div>
  <hr class="sep"/>
  ${tenders}
  <div class="meta">
    ${m.cashierName ? `Cashier: ${escapeHtml(m.cashierName)}<br/>` : ""}
    ${m.buyerName ? `Customer: ${escapeHtml(m.buyerName)}<br/>` : ""}
    ${m.issuedAtShort ? `Date: ${escapeHtml(m.issuedAtShort)}` : ""}
  </div>
  <p class="thanks">Thank you for shopping with us</p>
  <p class="docno">${escapeHtml(m.docNumber)}</p>
</div>
</body></html>`;
}

export function printThermalReceipt(m: DocumentModel) {
  printHtmlDocument(buildThermalPrintHtml(m));
}

export async function downloadThermalReceiptPdf(m: DocumentModel) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    unit: "mm",
    format: [80, Math.max(120, 40 + m.rows.length * 8 + 50)],
  });
  const pageW = 80;
  let y = 8;
  const left = 4;
  const right = pageW - 4;
  const mid = pageW / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(m.businessName || "Receipt", mid, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (m.address) {
    doc.text(m.address, mid, y, { align: "center", maxWidth: 70 });
    y += 4;
  }
  if (m.phone) {
    doc.text(m.phone, mid, y, { align: "center" });
    y += 4;
  }
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("RECEIPT", mid, y, { align: "center" });
  y += 4;
  doc.setDrawColor(150);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(left, y, right, y);
  y += 5;
  doc.setLineDashPattern([], 0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const r of m.rows) {
    const name = r.descriptionWithQty || r.description || "Item";
    const amt = money(r.total, m.currency);
    const lines = doc.splitTextToSize(name, 48);
    doc.text(lines, left, y);
    doc.text(amt, right, y, { align: "right" });
    y += Math.max(4, lines.length * 3.5);
  }
  y += 2;
  doc.setDrawColor(150);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(left, y, right, y);
  y += 5;
  doc.setLineDashPattern([], 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Total", left, y);
  doc.text(money(m.total, m.currency), right, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const t of m.tenderLines.length ? m.tenderLines : m.paymentFields) {
    doc.text(`${t.label}${t.value ? `: ${t.value}` : ""}`, left, y);
    y += 4;
  }
  y += 2;
  if (m.cashierName) {
    doc.text(`Cashier: ${m.cashierName}`, left, y);
    y += 4;
  }
  if (m.buyerName) {
    doc.text(`Customer: ${m.buyerName}`, left, y);
    y += 4;
  }
  if (m.issuedAtShort) {
    doc.text(`Date: ${m.issuedAtShort}`, left, y);
    y += 4;
  }
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text("Thank you for shopping with us", mid, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(m.docNumber || "", mid, y, { align: "center" });

  doc.save(`receipt-${m.docNumber || "sale"}.pdf`);
}

export function ThermalReceiptPreview({ model }: { model: DocumentModel }) {
  const m = model;
  return (
    <div className="mx-auto w-full max-w-[280px] rounded-lg border border-border bg-white px-4 py-5 text-center shadow-sm print:border-0 print:shadow-none">
      <h2 className="text-[15px] font-extrabold tracking-tight text-neutral-900">
        {m.businessName}
      </h2>
      {m.address ? (
        <p className="mt-1 text-[11px] leading-snug text-neutral-500">{m.address}</p>
      ) : null}
      {m.phone ? (
        <p className="text-[11px] text-neutral-500">{m.phone}</p>
      ) : null}
      <span className="mt-3 inline-block rounded-full border border-neutral-900 px-3 py-0.5 text-[10px] font-bold tracking-widest text-neutral-900">
        RECEIPT
      </span>
      <div className="my-3 border-t border-dashed border-neutral-300" />
      <ul className="space-y-1.5 text-left text-[12px]">
        {m.rows.map((r, i) => (
          <li key={i} className="flex justify-between gap-2">
            <span className="min-w-0 flex-1 break-words text-neutral-800">
              {r.descriptionWithQty}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-neutral-900">
              {money(r.total, m.currency)}
            </span>
          </li>
        ))}
      </ul>
      <div className="my-3 border-t border-dashed border-neutral-300" />
      {m.discount > 0 ? (
        <div className="flex justify-between text-[12px] text-neutral-600">
          <span>Discount</span>
          <span>-{money(m.discount, m.currency)}</span>
        </div>
      ) : null}
      <div className="mt-1 flex justify-between text-[14px] font-extrabold text-neutral-900">
        <span>Total</span>
        <span className="tabular-nums">{money(m.total, m.currency)}</span>
      </div>
      <div className="my-3 border-t border-dashed border-neutral-300" />
      <div className="space-y-0.5 text-left text-[11px] text-neutral-600">
        {(m.tenderLines.length ? m.tenderLines : m.paymentFields).map((t, i) => (
          <div key={i} className="flex justify-between gap-2">
            <span>{t.label}</span>
            <span>{t.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-0.5 text-left text-[10px] text-neutral-500">
        {m.cashierName ? <p>Cashier: {m.cashierName}</p> : null}
        {m.buyerName ? <p>Customer: {m.buyerName}</p> : null}
        {m.issuedAtShort ? <p>Date: {m.issuedAtShort}</p> : null}
      </div>
      <p className="mt-4 text-[12px] font-bold text-neutral-900">
        Thank you for shopping with us
      </p>
      <p className="mt-1 font-mono text-[10px] text-neutral-400">{m.docNumber}</p>
    </div>
  );
}
