"use client";

/**
 * ~80mm thermal cash receipt (POS till style).
 * Inspired by classic CASH RECEIPT layout: header, lines, tax/total, tender, thanks.
 */

import type { DocumentModel } from "@/features/documents/lib/documentModel";
import {
  escapeHtml,
  money,
  printHtmlDocument,
} from "@/features/documents/lib/documentModel";

/** Preview width ≈ 80mm at 96dpi */
export const THERMAL_PX = 302;

export function buildThermalPrintHtml(m: DocumentModel): string {
  const lines = m.rows
    .map(
      (r) =>
        `<div class="line"><span class="name">${escapeHtml(r.descriptionWithQty)}</span><span class="amt">${escapeHtml(money(r.total))}</span></div>`,
    )
    .join("");

  const tenders =
    m.tenderLines.length > 0
      ? m.tenderLines
          .map(
            (t) =>
              `<div class="tender">${escapeHtml(t.label)}${t.value ? `: ${escapeHtml(t.value)}` : ""}</div>`,
          )
          .join("")
      : m.paymentFields
          .map(
            (t) =>
              `<div class="tender">${escapeHtml(t.label)}${t.value ? `: ${escapeHtml(t.value)}` : ""}</div>`,
          )
          .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Receipt ${escapeHtml(m.docNumber)}</title>
<style>
  @page { size: 80mm auto; margin: 2mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0;
    font-family: "Courier New", Courier, ui-monospace, monospace;
    font-size: 12px; color: #000; background: #fff;
    width: 72mm;
  }
  .slip { padding: 4mm 3mm 6mm; text-align: center; }
  .title { font-size: 15px; font-weight: 700; letter-spacing: 0.04em; margin: 0 0 6px; }
  .sub { font-size: 11px; line-height: 1.35; margin: 0; }
  .stars { margin: 8px 0; letter-spacing: 0.15em; }
  .dash { border: none; border-top: 1px dashed #000; margin: 8px 0; }
  .line {
    display: flex; justify-content: space-between; gap: 8px;
    text-align: left; margin: 3px 0; font-size: 12px;
  }
  .line .name { flex: 1; min-width: 0; word-break: break-word; }
  .line .amt { flex-shrink: 0; font-variant-numeric: tabular-nums; }
  .totals { text-align: left; margin-top: 4px; }
  .totals .row { display: flex; justify-content: space-between; margin: 2px 0; }
  .totals .total { font-weight: 700; font-size: 13px; margin-top: 4px; }
  .tender { text-align: left; font-size: 11px; margin: 2px 0; }
  .meta { font-size: 11px; margin: 6px 0 2px; text-align: left; }
  .thanks { font-weight: 700; letter-spacing: 0.06em; margin-top: 10px; font-size: 13px; }
  .docno { font-size: 10px; margin-top: 6px; }
  @media print {
    body { width: 72mm; }
  }
</style></head><body>
<div class="slip">
  <p class="title">CASH RECEIPT</p>
  ${m.phone ? `<p class="sub">${escapeHtml(m.phone)}</p>` : ""}
  ${m.cashierName ? `<p class="sub">Cashier · ${escapeHtml(m.cashierName)}</p>` : ""}
  ${m.address ? `<p class="sub">${escapeHtml(m.address)}</p>` : ""}
  <p class="sub">${escapeHtml(m.businessName)}</p>
  <div class="stars">***</div>
  <hr class="dash"/>
  ${lines || `<div class="line"><span class="name">—</span><span class="amt">0.00</span></div>`}
  <hr class="dash"/>
  <div class="totals">
    ${m.showDiscount ? `<div class="row"><span>Discount:</span><span>-${escapeHtml(money(m.discount))}</span></div>` : ""}
    ${m.showTax ? `<div class="row"><span>Tax:</span><span>${escapeHtml(money(m.tax))}</span></div>` : ""}
    <div class="row total"><span>Total:</span><span>${escapeHtml(money(m.total))}</span></div>
  </div>
  <hr class="dash"/>
  ${tenders}
  <div class="meta">${escapeHtml(m.issuedAtShort)} · ${escapeHtml(m.docNumber)}</div>
  <div class="stars">***</div>
  <p class="thanks">${escapeHtml(m.receiptFooter.toUpperCase())}</p>
  <p class="docno">${escapeHtml(m.currency)}</p>
</div>
</body></html>`;
}

export function printThermalReceipt(m: DocumentModel) {
  printHtmlDocument(buildThermalPrintHtml(m));
}

export function ThermalReceiptPreview({ model }: { model: DocumentModel }) {
  const m = model;
  return (
    <div
      className="mx-auto bg-white text-black shadow-md"
      style={{
        width: THERMAL_PX,
        fontFamily: '"Courier New", Courier, ui-monospace, monospace',
        fontSize: 12,
      }}
    >
      {/* serrated top */}
      <div
        className="h-2 w-full bg-neutral-100"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #e5e5e5 25%, transparent 25%), linear-gradient(225deg, #e5e5e5 25%, transparent 25%)",
          backgroundSize: "8px 8px",
          backgroundPosition: "0 0, 4px 0",
        }}
        aria-hidden
      />
      <div className="px-3 py-4 text-center">
        <p className="text-[15px] font-bold tracking-wide">CASH RECEIPT</p>
        {m.phone ? <p className="mt-1 text-[11px] leading-snug">{m.phone}</p> : null}
        {m.cashierName ? (
          <p className="text-[11px] leading-snug">Cashier · {m.cashierName}</p>
        ) : null}
        {m.address ? (
          <p className="text-[11px] leading-snug">{m.address}</p>
        ) : null}
        <p className="text-[11px] leading-snug">{m.businessName}</p>
        <p className="my-2 tracking-[0.2em]">***</p>
        <div className="border-t border-dashed border-black" />

        <div className="mt-2 space-y-1 text-left">
          {m.rows.length === 0 ? (
            <p className="text-neutral-500">No items</p>
          ) : (
            m.rows.map((r) => (
              <div key={r.no} className="flex justify-between gap-2">
                <span className="min-w-0 flex-1 break-words">
                  {r.descriptionWithQty}
                </span>
                <span className="shrink-0 tabular-nums">{money(r.total)}</span>
              </div>
            ))
          )}
        </div>

        <div className="my-2 border-t border-dashed border-black" />

        <div className="space-y-0.5 text-left">
          {m.showDiscount ? (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span className="tabular-nums">-{money(m.discount)}</span>
            </div>
          ) : null}
          {m.showTax ? (
            <div className="flex justify-between">
              <span>Tax:</span>
              <span className="tabular-nums">{money(m.tax)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-[13px] font-bold">
            <span>Total:</span>
            <span className="tabular-nums">{money(m.total)}</span>
          </div>
        </div>

        <div className="my-2 border-t border-dashed border-black" />

        <div className="space-y-0.5 text-left text-[11px]">
          {(m.tenderLines.length ? m.tenderLines : m.paymentFields).map(
            (t, i) => (
              <p key={i}>
                {t.label}
                {t.value ? `: ${t.value}` : ""}
              </p>
            ),
          )}
        </div>

        <p className="mt-2 text-left text-[11px]">
          {m.issuedAtShort} · {m.docNumber}
        </p>
        <p className="mt-3 tracking-[0.2em]">***</p>
        <p className="mt-2 text-[13px] font-bold tracking-wide">
          {m.receiptFooter.toUpperCase()}
        </p>
        <p className="mt-1 text-[10px] text-neutral-600">{m.currency}</p>
      </div>
      <div
        className="h-2 w-full bg-neutral-100"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #e5e5e5 25%, transparent 25%), linear-gradient(225deg, #e5e5e5 25%, transparent 25%)",
          backgroundSize: "8px 8px",
          backgroundPosition: "0 0, 4px 0",
        }}
        aria-hidden
      />
    </div>
  );
}
