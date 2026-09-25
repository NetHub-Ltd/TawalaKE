"use client";

/**
 * Sale receipt / invoice — thermal-first layout (≈80mm).
 * Header (business + meta) · body (lines + totals) · footer (thanks + Tawala).
 * Screen preview matches the printed slip; print/PDF target 80mm thermal paper.
 */
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer, Download, Banknote } from "lucide-react";
import { useReceipt } from "@/features/sales/hooks/useReceipts";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { Spinner } from "@/lib/components/ui";
import { cn } from "@/lib/utils";

/** 80mm thermal width at 96dpi ≈ 302px; keep preview and print aligned */
const THERMAL_MM = 80;
const THERMAL_PX = 302;

interface ReceiptClientViewProps {
  saleId: string;
}

interface ReceiptItem {
  item_id: string;
  product_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_price: number;
}

interface Payment {
  payment_id: string;
  method: string;
  amount: number;
  reference: string;
  processed_at: string;
}

interface ServiceLine {
  description: string;
  amount: number;
}

interface ReceiptData {
  document_id: string;
  document_number: string;
  document_type: string;
  issued_at: string;
  version: string;
  seller: {
    business_id: string;
    business_name: string;
    address: string | null;
    phone: string | null;
    tax_number: string | null;
    cashier: {
      id: string;
      name: string;
      role: string;
    };
  };
  buyer: {
    customer_id: string | null;
    name: string;
    phone: string | null;
    email: string | null;
  };
  financials: {
    currency: string;
    subtotal: number;
    discount_amount: number;
    tax_rate_applied: number;
    tax_amount: number;
    total_amount: number;
    amount_paid: number;
    balance_due: number;
    service_lines?: ServiceLine[];
    service_total?: number;
  };
  items: ReceiptItem[];
  payments: Payment[];
  summary: {
    total_items: number;
    payment_count: number;
    total_quantity: number;
    total_tax_collected: number;
    services?: ServiceLine[];
  };
  dispute_and_audit: {
    parent_sale_id: string;
    status: string;
    original_document_hash: string;
    notes: string;
  };
}

function money(n: number) {
  return (Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatWhen(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function taxRateLabel(rate: number): string {
  if (!rate || rate <= 0) return "";
  const pct = rate <= 1 ? rate * 100 : rate;
  const shown = pct % 1 === 0 ? String(Math.round(pct)) : pct.toFixed(2);
  return ` (${shown}%)`;
}

function resolveServiceLines(receipt: ReceiptData): ServiceLine[] {
  const fromFin = receipt.financials?.service_lines;
  const fromSummary = receipt.summary?.services;
  const raw = (Array.isArray(fromFin) && fromFin.length > 0
    ? fromFin
    : Array.isArray(fromSummary)
      ? fromSummary
      : []) as unknown[];

  return raw
    .filter((s) => s && typeof s === "object")
    .map((s) => {
      const o = s as { description?: string; amount?: number };
      return {
        description: String(o.description || "").trim(),
        amount: Number(o.amount) || 0,
      };
    })
    .filter((s) => s.description && s.amount > 0);
}

function DashRule({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-0 w-full border-t border-dashed border-neutral-400 print:border-black",
        className,
      )}
      aria-hidden
    />
  );
}

function DoubleRule() {
  return (
    <div className="my-2 space-y-0.5" aria-hidden>
      <div className="border-t-2 border-neutral-900 print:border-black" />
      <div className="border-t border-neutral-900 print:border-black" />
    </div>
  );
}

export default function ReceiptClientView({ saleId }: ReceiptClientViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const ctx = useBusinessContext();
  const businessId = Array.isArray(ctx.businessId)
    ? ctx.businessId[0]
    : ctx.businessId;
  const organizationId = Array.isArray(ctx.organizationId)
    ? ctx.organizationId[0]
    : ctx.organizationId;

  const { data, isLoading, error } = useReceipt(saleId);
  const receipt = data as ReceiptData | undefined;
  const [isDownloading, setIsDownloading] = useState(false);
  const searchParams = useSearchParams();
  const [collectOpen, setCollectOpen] = useState(
    () => searchParams?.get("collect") === "1",
  );
  const [collectMethod, setCollectMethod] = useState<"CASH" | "MPESA" | "CARD">("CASH");
  const [collectRef, setCollectRef] = useState("");
  const [collecting, setCollecting] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [collectSuccess, setCollectSuccess] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Spinner size="md" label="Loading document" />
        <p className="text-sm text-muted">Loading sale document…</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="mx-auto max-w-sm rounded-lg border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm font-semibold text-foreground">
          Could not load this document
        </p>
        <p className="mt-1 text-sm text-muted">
          {(error as Error)?.message || "Receipt data is unavailable."}
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-6 inline-flex h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-foreground hover:bg-register"
        >
          Go back
        </button>
      </div>
    );
  }

  const fin = receipt.financials;
  const currency = fin.currency || "KES";
  const balanceDue = Number(fin.balance_due) || 0;
  const isInvoice =
    balanceDue > 0.001 ||
    /invoice|credit/i.test(receipt.document_type || "");
  const docLabel = isInvoice ? "INVOICE" : "RECEIPT";
  const totalLabel = isInvoice ? "AMOUNT DUE" : "TOTAL";
  const serviceLines = resolveServiceLines(receipt);
  const servicesTotal =
    serviceLines.reduce((a, s) => a + s.amount, 0) ||
    Number(fin.service_total) ||
    0;
  const goodsSubtotal =
    Number(fin.subtotal) + Number(fin.discount_amount || 0);
  const taxAmount = Number(fin.tax_amount) || 0;
  const discountAmount = Number(fin.discount_amount) || 0;
  const totalShown = isInvoice
    ? balanceDue || Number(fin.total_amount)
    : Number(fin.total_amount);

  const terminalHref =
    organizationId && businessId
      ? `/org/${organizationId}/${businessId}/terminal`
      : "..";

  const thermalPrintStyles = `
    @page { size: ${THERMAL_MM}mm auto; margin: 2mm; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    img { max-width: 100%; }
  `;

  /** Dedicated print window — avoids blank preview from app-shell visibility hacks */
  const handlePrint = () => {
    const node =
      document.getElementById("sale-doc-capture") || printRef.current;
    if (!node) return;

    const win = window.open("", "_blank", "noopener,noreferrer,width=420,height=720");
    if (!win) {
      // Popup blocked — fall back to in-page print with safer CSS class
      document.body.classList.add("receipt-printing");
      window.print();
      setTimeout(() => document.body.classList.remove("receipt-printing"), 500);
      return;
    }

    const title = `${isInvoice ? "Invoice" : "Receipt"} ${
      receipt.document_number || saleId.slice(0, 8)
    }`;
    win.document.open();
    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title.replace(/</g, "")}</title>
  <style>${thermalPrintStyles}
    body { width: ${THERMAL_MM}mm; max-width: 100%; margin: 0 auto; padding: 2mm; }
  </style>
</head>
<body>${node.innerHTML}</body>
</html>`);
    win.document.close();
    // Wait for layout then print
    const trigger = () => {
      try {
        win.focus();
        win.print();
      } catch (e) {
        console.error("Print failed", e);
      }
    };
    if (win.document.readyState === "complete") {
      setTimeout(trigger, 150);
    } else {
      win.onload = () => setTimeout(trigger, 150);
      setTimeout(trigger, 400);
    }
  };

  const handlePdf = async () => {
    const node =
      (document.getElementById("sale-doc-capture") as HTMLElement | null) ||
      printRef.current;
    if (!node || isDownloading) return;
    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      // Force layout size so capture is not 0×0
      const prev = {
        width: node.style.width,
        maxWidth: node.style.maxWidth,
        background: node.style.backgroundColor,
        color: node.style.color,
      };
      node.style.width = `${THERMAL_PX}px`;
      node.style.maxWidth = `${THERMAL_PX}px`;
      node.style.backgroundColor = "#ffffff";
      node.style.color = "#000000";

      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        foreignObjectRendering: false,
      });

      node.style.width = prev.width;
      node.style.maxWidth = prev.maxWidth;
      node.style.backgroundColor = prev.background;
      node.style.color = prev.color;

      if (!canvas.width || !canvas.height) {
        throw new Error("Could not capture receipt for PDF");
      }

      const img = canvas.toDataURL("image/png", 1.0);
      const pageW = THERMAL_MM;
      const pageH = Math.max(40, (canvas.height * pageW) / canvas.width);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pageW, pageH],
        compress: true,
      });
      pdf.addImage(img, "PNG", 0, 0, pageW, pageH, undefined, "FAST");
      const name = `${isInvoice ? "invoice" : "receipt"}_${
        receipt.document_number || saleId.slice(0, 8)
      }.pdf`;
      pdf.save(name);
    } catch (e) {
      console.error("PDF export failed", e);
      // Fallback: open print dialog so user can “Save as PDF”
      alert(
        e instanceof Error
          ? `Download failed: ${e.message}. Try Print → Save as PDF.`
          : "Download failed. Try Print → Save as PDF.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCollectCredit = async () => {
    if (collecting) return;
    setCollecting(true);
    setCollectError(null);
    setCollectSuccess(null);
    try {
      const res = await fetch(`/api/v1/org/stores/sales/${saleId}/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: collectMethod,
          payment_reference: collectRef.trim() || null,
          customer_name: receipt?.buyer?.name ?? null,
          customer_phone: receipt?.buyer?.phone ?? null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const d = body.error || body.detail || body.message;
        throw new Error(
          typeof d === "string" ? d : `Collection failed (${res.status})`,
        );
      }
      setCollectSuccess("Payment collected — invoice settled.");
      setTimeout(() => {
        router.refresh();
        window.location.reload();
      }, 800);
    } catch (e) {
      setCollectError(e instanceof Error ? e.message : "Collection failed");
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center">
      {/* Screen chrome */}
      <div className="print:hidden mb-5 flex w-full max-w-[302px] items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-muted hover:bg-register hover:text-foreground"
        >
          <ArrowLeft size={16} aria-hidden />
          Back
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-register hover:text-foreground"
            aria-label="Print on thermal printer"
            title="Print (80mm thermal)"
          >
            <Printer size={16} />
          </button>
          <button
            type="button"
            onClick={() => void handlePdf()}
            disabled={isDownloading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-register hover:text-foreground disabled:opacity-50"
            aria-label="Download thermal PDF"
            title="Download 80mm PDF"
          >
            {isDownloading ? <Spinner size="sm" /> : <Download size={16} />}
          </button>
        </div>
      </div>

      {/* Paper slip — screen looks like thermal paper */}
      <div
        id="sale-doc-print"
        ref={printRef}
        className="receipt-thermal w-full bg-white text-black shadow-[0_8px_30px_rgba(0,0,0,0.08)] print:shadow-none"
        style={{ maxWidth: THERMAL_PX }}
      >
        <div
          id="sale-doc-capture"
          className="receipt-thermal-inner px-3 py-4 font-mono text-[11px] leading-snug text-black"
          style={{ width: "100%", maxWidth: THERMAL_PX }}
        >
          {/* ========== HEADER ========== */}
          <header className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-600 print:text-black">
              {docLabel}
            </p>
            <h1 className="mt-2 text-[15px] font-bold uppercase leading-tight tracking-wide text-black">
              {receipt.seller.business_name}
            </h1>
            {(receipt.seller.address || receipt.seller.phone) && (
              <p className="mt-1.5 text-[10px] leading-relaxed text-neutral-700 print:text-black">
                {[receipt.seller.address, receipt.seller.phone]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {receipt.seller.tax_number && (
              <p className="mt-0.5 text-[10px] text-neutral-700 print:text-black">
                PIN {receipt.seller.tax_number}
              </p>
            )}
          </header>

          <DoubleRule />

          {/* Meta block */}
          <section className="space-y-0.5 text-[10px]">
            <div className="flex justify-between gap-2">
              <span className="text-neutral-600 print:text-black">No.</span>
              <span className="font-semibold tabular">
                {receipt.document_number || saleId.slice(0, 8).toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-600 print:text-black">Date</span>
              <span className="tabular">{formatWhen(receipt.issued_at)}</span>
            </div>
            {receipt.seller.cashier?.name && (
              <div className="flex justify-between gap-2">
                <span className="text-neutral-600 print:text-black">Cashier</span>
                <span className="max-w-[60%] truncate text-right">
                  {receipt.seller.cashier.name}
                </span>
              </div>
            )}
          </section>

          <DashRule className="my-2.5" />

          {/* ========== BODY ========== */}
          <main>
            {(isInvoice ||
              (receipt.buyer?.name &&
                !/^walk[-\s]?in/i.test(receipt.buyer.name))) && (
              <section className="mb-2.5 text-[10px]">
                <p className="font-semibold uppercase tracking-wide">
                  {isInvoice ? "Bill to" : "Customer"}
                </p>
                <p className="mt-0.5 font-medium">
                  {receipt.buyer?.name || "—"}
                </p>
                {(receipt.buyer?.phone || receipt.buyer?.email) && (
                  <p className="text-neutral-700 print:text-black">
                    {[receipt.buyer.phone, receipt.buyer.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </section>
            )}

            <section>
              <div className="mb-1 flex justify-between text-[9px] font-semibold uppercase tracking-wider text-neutral-600 print:text-black">
                <span>Item</span>
                <span>Amount</span>
              </div>
              <ul className="space-y-2">
                {(receipt.items || []).map((item) => (
                  <li key={item.item_id || `${item.product_id}-${item.name}`}>
                    <div className="flex justify-between gap-2 text-[11px]">
                      <span className="min-w-0 flex-1 break-words font-medium uppercase">
                        {item.name}
                      </span>
                      <span className="shrink-0 tabular font-semibold">
                        {money(item.total_price)}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-600 print:text-black">
                      {item.quantity} x {money(item.unit_price)}
                      {item.sku ? `  ${item.sku}` : ""}
                    </p>
                  </li>
                ))}
                {serviceLines.map((s, i) => (
                  <li key={`svc-${i}-${s.description}`}>
                    <div className="flex justify-between gap-2 text-[11px]">
                      <span className="min-w-0 flex-1 break-words font-medium uppercase">
                        {s.description}
                      </span>
                      <span className="shrink-0 tabular font-semibold">
                        {money(s.amount)}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-600 print:text-black">
                      Service
                    </p>
                  </li>
                ))}
                {(receipt.items || []).length === 0 &&
                  serviceLines.length === 0 && (
                    <li className="text-[10px] text-neutral-600">No items</li>
                  )}
              </ul>
            </section>

            <DashRule className="my-2.5" />

            <section className="space-y-1 text-[11px]">
              <div className="flex justify-between gap-2">
                <span>Items</span>
                <span className="tabular">
                  {currency} {money(goodsSubtotal)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between gap-2">
                  <span>Discount</span>
                  <span className="tabular">
                    -{currency} {money(discountAmount)}
                  </span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between gap-2">
                  <span>
                    Tax
                    {taxRateLabel(Number(fin.tax_rate_applied) || 0)}
                  </span>
                  <span className="tabular">
                    {currency} {money(taxAmount)}
                  </span>
                </div>
              )}
              {servicesTotal > 0 && (
                <div className="flex justify-between gap-2">
                  <span>Services</span>
                  <span className="tabular">
                    {currency} {money(servicesTotal)}
                  </span>
                </div>
              )}
            </section>

            <DoubleRule />

            <div className="flex items-baseline justify-between gap-2 py-0.5">
              <span className="text-[12px] font-bold tracking-wide">
                {totalLabel}
              </span>
              <span className="text-[15px] font-bold tabular tracking-tight">
                {currency} {money(totalShown)}
              </span>
            </div>

            {isInvoice && (
              <div className="mt-1 flex justify-between gap-2 text-[10px]">
                <span>Paid</span>
                <span className="tabular">
                  {currency} {money(fin.amount_paid)}
                </span>
              </div>
            )}

            {(receipt.payments || []).length > 0 && (
              <section className="mt-2.5 space-y-1 text-[10px]">
                <DashRule />
                <p className="pt-1.5 font-semibold uppercase tracking-wide">
                  Payments
                </p>
                {receipt.payments.map((p) => (
                  <div
                    key={p.payment_id}
                    className="flex justify-between gap-2"
                  >
                    <span className="min-w-0 truncate uppercase">
                      {p.method}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </span>
                    <span className="shrink-0 tabular font-semibold">
                      {currency} {money(p.amount)}
                    </span>
                  </div>
                ))}
              </section>
            )}
          </main>

          {/* ========== FOOTER ========== */}
          <footer className="mt-4 text-center">
            <DashRule className="mb-3" />
            <p className="text-[11px] font-medium leading-relaxed">
              {isInvoice
                ? "Thank you — balance due as agreed"
                : "Thank you for shopping with us"}
            </p>
            <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-neutral-500 print:text-black">
              Powered by Tawala
            </p>
            {/* Tear edge hint — screen only */}
            <div
              className="print:hidden mx-auto mt-3 h-2 w-full bg-[repeating-linear-gradient(90deg,#e5e5e5_0_6px,transparent_6px_12px)] opacity-80"
              aria-hidden
            />
          </footer>
        </div>
      </div>

      {/* Actions */}
      <div className="print:hidden mt-6 flex w-full max-w-[302px] flex-col gap-2.5">
        {isInvoice && balanceDue > 0.001 && !collectSuccess && (
          <div className="rounded-md border border-brand-secondary/30 bg-card p-3 space-y-2.5">
            {!collectOpen ? (
              <button
                type="button"
                onClick={() => setCollectOpen(true)}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand-secondary text-sm font-semibold text-white hover:opacity-90"
              >
                <Banknote size={16} aria-hidden />
                Collect credit
              </button>
            ) : (
              <>
                <p className="text-xs font-semibold text-foreground">
                  Collect {currency} {money(balanceDue || Number(fin.total_amount))}
                </p>
                <label className="block space-y-1">
                  <span className="text-[11px] text-muted">Method</span>
                  <select
                    value={collectMethod}
                    onChange={(e) =>
                      setCollectMethod(e.target.value as "CASH" | "MPESA" | "CARD")
                    }
                    className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm"
                  >
                    <option value="CASH">Cash</option>
                    <option value="MPESA">M-Pesa</option>
                    <option value="CARD">Card</option>
                  </select>
                </label>
                {(collectMethod === "MPESA" || collectMethod === "CARD") && (
                  <label className="block space-y-1">
                    <span className="text-[11px] text-muted">Reference</span>
                    <input
                      value={collectRef}
                      onChange={(e) => setCollectRef(e.target.value)}
                      placeholder="Txn / receipt no."
                      className="h-10 w-full rounded-md border border-border bg-background px-2 text-sm"
                    />
                  </label>
                )}
                {collectError && (
                  <p className="text-xs text-[var(--error)]" role="alert">
                    {collectError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={collecting}
                    onClick={() => void handleCollectCredit()}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-brand-secondary text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {collecting ? "Collecting…" : "Confirm collect"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectOpen(false)}
                    className="inline-flex h-11 items-center rounded-md border border-border px-3 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {collectSuccess && (
          <p className="rounded-md border border-[var(--success-border)] bg-[var(--success-soft)] px-3 py-2 text-center text-xs text-[var(--success)]">
            {collectSuccess}
          </p>
        )}
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand-accent text-sm font-semibold text-white hover:opacity-90"
        >
          <Printer size={16} aria-hidden />
          Print (80mm thermal)
        </button>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => void handlePdf()}
            disabled={isDownloading}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-semibold text-foreground hover:bg-register disabled:opacity-50"
          >
            {isDownloading ? (
              <Spinner size="sm" />
            ) : (
              <Download size={16} aria-hidden />
            )}
            Download PDF
          </button>
          <Link
            href={terminalHref}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-md border border-border bg-card text-sm font-semibold text-foreground hover:bg-register"
          >
            New sale
          </Link>
        </div>
        <p className="text-center text-[11px] text-muted">
          Designed for 80mm thermal printers · select that paper size when
          printing
        </p>
      </div>

      {/* Fallback when popup is blocked: hide chrome, show slip only */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 2mm;
          }
          html,
          body {
            background: #fff !important;
            color: #000 !important;
          }
          body.receipt-printing .print\:hidden,
          body.receipt-printing [class*="print:hidden"] {
            display: none !important;
          }
          body.receipt-printing #sale-doc-print {
            position: static !important;
            width: 80mm !important;
            max-width: 80mm !important;
            box-shadow: none !important;
            margin: 0 auto !important;
          }
        }
      `}</style>
    </div>
  );
}
