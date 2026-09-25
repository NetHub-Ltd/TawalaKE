"use client";

/**
 * Sale receipt / invoice — header (business + meta), body (lines + totals),
 * footer (thanks + powered by Tawala). Services resolved from financials,
 * summary, or enriched API snapshot.
 */
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useReceipt } from "@/features/sales/hooks/useReceipts";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { Spinner } from "@/lib/components/ui";
import { cn } from "@/lib/utils";

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

/** Prefer financials.service_lines, then summary.services, then service_total row. */
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-border bg-card py-24">
        <Spinner size="md" label="Loading document" />
        <p className="text-sm text-muted">Loading sale document…</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="mx-auto max-w-md rounded-md border border-border bg-card px-6 py-12 text-center">
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
  const docLabel = isInvoice ? "Invoice" : "Receipt";
  const totalLabel = isInvoice ? "Amount due" : "Total";
  const serviceLines = resolveServiceLines(receipt);
  const servicesTotal =
    serviceLines.reduce((a, s) => a + s.amount, 0) ||
    Number(fin.service_total) ||
    0;
  const goodsSubtotal =
    Number(fin.subtotal) + Number(fin.discount_amount || 0);
  const taxAmount = Number(fin.tax_amount) || 0;
  const discountAmount = Number(fin.discount_amount) || 0;

  const terminalHref =
    organizationId && businessId
      ? `/org/${organizationId}/${businessId}/terminal`
      : "..";

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handlePdf = async () => {
    if (!printRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(printRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (doc) => {
          const el = doc.getElementById("sale-doc-capture");
          if (el) {
            el.style.backgroundColor = "#ffffff";
            el.style.color = "#121B1E";
            el.querySelectorAll(".text-muted").forEach((n) => {
              if (n instanceof HTMLElement) n.style.color = "#5A6468";
            });
          }
        },
      });
      const img = canvas.toDataURL("image/png", 1.0);
      const w = 80;
      const h = (canvas.height * w) / canvas.width;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [w, h],
      });
      pdf.addImage(img, "PNG", 0, 0, w, h, undefined, "FAST");
      pdf.save(
        `${isInvoice ? "invoice" : "receipt"}_${receipt.document_number || saleId.slice(0, 8)}.pdf`,
      );
    } catch (e) {
      console.error("PDF export failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      {/* Screen chrome — not printed */}
      <div className="print:hidden mb-4 flex items-center justify-between gap-2">
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
            aria-label="Print"
          >
            <Printer size={16} />
          </button>
          <button
            type="button"
            onClick={() => void handlePdf()}
            disabled={isDownloading}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-register hover:text-foreground disabled:opacity-50"
            aria-label="Download PDF"
          >
            {isDownloading ? <Spinner size="sm" /> : <Download size={16} />}
          </button>
        </div>
      </div>

      {/* Document */}
      <div
        id="sale-doc-print"
        ref={printRef}
        className="rounded-md border border-border bg-card p-5 shadow-none print:border-0 print:p-0"
      >
        <div id="sale-doc-capture" className="text-foreground">
          {/* ========== HEADER: business + document meta ========== */}
          <header className="border-b border-border pb-4 print:border-black/25">
            <div className="text-center">
              <h1 className="text-lg font-semibold tracking-tight print:text-black">
                {receipt.seller.business_name}
              </h1>
              {(receipt.seller.address || receipt.seller.phone) && (
                <p className="mt-1 text-xs leading-relaxed text-muted print:text-black/70">
                  {[receipt.seller.address, receipt.seller.phone]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {receipt.seller.tax_number && (
                <p className="mt-0.5 text-xs text-muted print:text-black/70">
                  PIN / Tax ID: {receipt.seller.tax_number}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted print:text-black/60">
                {docLabel}
              </p>
              <p className="font-mono text-xs font-semibold tabular text-foreground print:text-black">
                {receipt.document_number || saleId.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <dl className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted print:text-black/60">Date</dt>
                <dd className="font-medium tabular print:text-black">
                  {formatWhen(receipt.issued_at)}
                </dd>
              </div>
              {receipt.seller.cashier?.name && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted print:text-black/60">Cashier</dt>
                  <dd className="font-medium print:text-black">
                    {receipt.seller.cashier.name}
                  </dd>
                </div>
              )}
              {receipt.dispute_and_audit?.parent_sale_id && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted print:text-black/60">Sale ref</dt>
                  <dd className="max-w-[11rem] truncate font-mono text-[11px] print:text-black">
                    {String(receipt.dispute_and_audit.parent_sale_id).slice(0, 8)}…
                  </dd>
                </div>
              )}
            </dl>
          </header>

          {/* ========== BODY: customer, lines, totals, payments ========== */}
          <main>
            {(isInvoice ||
              (receipt.buyer?.name &&
                !/^walk[-\s]?in/i.test(receipt.buyer.name))) && (
              <section
                className={cn(
                  "border-b border-border py-4 text-sm print:border-black/20",
                  isInvoice && "bg-register/40 -mx-5 px-5 print:bg-transparent",
                )}
              >
                <p className="text-xs font-semibold tracking-wide text-muted print:text-black/60">
                  {isInvoice ? "Bill to" : "Customer"}
                </p>
                <p className="mt-1 font-semibold print:text-black">
                  {receipt.buyer?.name || "—"}
                </p>
                {(receipt.buyer?.phone || receipt.buyer?.email) && (
                  <p className="mt-0.5 text-xs text-muted print:text-black/70">
                    {[receipt.buyer.phone, receipt.buyer.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {isInvoice && balanceDue > 0 && (
                  <p className="mt-2 text-xs font-semibold text-brand-secondary print:text-black">
                    Payment terms: collect as agreed · balance open
                  </p>
                )}
              </section>
            )}

            <section className="border-b border-dashed border-border py-4 print:border-black/40">
              <div className="mb-2 flex justify-between text-xs font-semibold tracking-wide text-muted print:text-black/60">
                <span>Item</span>
                <span>Amount</span>
              </div>
              <ul className="space-y-2.5">
                {(receipt.items || []).map((item) => (
                  <li key={item.item_id || `${item.product_id}-${item.name}`}>
                    <div className="flex justify-between gap-3 text-sm print:text-black">
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {item.name}
                      </span>
                      <span className="shrink-0 tabular font-semibold">
                        {money(item.total_price)}
                      </span>
                    </div>
                    <p className="text-xs text-muted print:text-black/60">
                      {item.quantity} × {money(item.unit_price)}
                      {item.sku ? ` · ${item.sku}` : ""}
                    </p>
                  </li>
                ))}
                {serviceLines.map((s, i) => (
                  <li key={`svc-line-${i}-${s.description}`}>
                    <div className="flex justify-between gap-3 text-sm print:text-black">
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {s.description}
                      </span>
                      <span className="shrink-0 tabular font-semibold">
                        {money(s.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-muted print:text-black/60">
                      Service
                    </p>
                  </li>
                ))}
                {(receipt.items || []).length === 0 && serviceLines.length === 0 && (
                  <li className="text-xs text-muted">No line items</li>
                )}
              </ul>
            </section>

            <section className="space-y-1.5 py-4 text-sm">
              <div className="flex justify-between text-muted print:text-black/70">
                <span>Items</span>
                <span className="tabular print:text-black">
                  {currency} {money(goodsSubtotal)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[var(--success)]">
                  <span>Discount</span>
                  <span className="tabular">
                    −{currency} {money(discountAmount)}
                  </span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-muted print:text-black/70">
                  <span>
                    Tax
                    {taxRateLabel(Number(fin.tax_rate_applied) || 0)}
                  </span>
                  <span className="tabular print:text-black">
                    {currency} {money(taxAmount)}
                  </span>
                </div>
              )}
              {servicesTotal > 0 && (
                <div className="flex justify-between text-muted print:text-black/70">
                  <span>Services</span>
                  <span className="tabular print:text-black">
                    {currency} {money(servicesTotal)}
                  </span>
                </div>
              )}

              <div className="mt-2 flex items-baseline justify-between border-t border-border pt-3 print:border-black/30">
                <span className="text-sm font-semibold print:text-black">
                  {totalLabel}
                </span>
                <span
                  className={cn(
                    "text-base font-semibold tabular print:text-black",
                    isInvoice && balanceDue > 0
                      ? "text-brand-secondary"
                      : "text-foreground",
                  )}
                >
                  {currency}{" "}
                  {money(
                    isInvoice
                      ? balanceDue || fin.total_amount
                      : fin.total_amount,
                  )}
                </span>
              </div>

              {isInvoice && (
                <div className="flex justify-between text-xs text-muted print:text-black/70">
                  <span>Already paid</span>
                  <span className="tabular">
                    {currency} {money(fin.amount_paid)}
                  </span>
                </div>
              )}
            </section>

            {(receipt.payments || []).length > 0 && (
              <section className="border-t border-border pt-3 space-y-1.5 text-xs print:border-black/20">
                <p className="font-semibold text-muted print:text-black/60">
                  Payments
                </p>
                {receipt.payments.map((p) => (
                  <div
                    key={p.payment_id}
                    className="flex justify-between gap-2 print:text-black"
                  >
                    <span className="min-w-0 truncate">
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
          <footer className="mt-5 border-t border-border pt-4 text-center print:border-black/25">
            <p className="text-sm font-medium print:text-black">
              {isInvoice
                ? "Thank you — balance due as agreed"
                : "Thank you for shopping with us"}
            </p>
            <p className="mt-2 text-[11px] tracking-wide text-muted print:text-black/55">
              Powered by Tawala
            </p>
          </footer>
        </div>
      </div>

      {/* Actions */}
      <div className="print:hidden mt-6 flex flex-col gap-2.5 sm:flex-row">
        <Link
          href={terminalHref}
          className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-brand-accent text-sm font-semibold text-white hover:opacity-90"
        >
          New sale
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-semibold text-foreground hover:bg-register"
        >
          <Printer size={16} aria-hidden />
          Print
        </button>
      </div>

      <style jsx global>{`
        @media print {
          body,
          html {
            background: #fff !important;
            color: #000 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #sale-doc-print,
          #sale-doc-print * {
            visibility: visible !important;
          }
          #sale-doc-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
