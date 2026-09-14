"use client";

/**
 * Sale-backed receipt / invoice — data from GET receipts?sale_id=
 * Canonical tokens; print-friendly thermal hierarchy.
 */
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  Download,
} from "lucide-react";
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
  };
  items: ReceiptItem[];
  payments: Payment[];
  summary: {
    total_items: number;
    payment_count: number;
    total_quantity: number;
    total_tax_collected: number;
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
  const docLabel = isInvoice ? "Tax invoice" : "Sales receipt";
  const totalLabel = isInvoice ? "Amount due" : "Total paid";

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
        `${isInvoice ? "invoice" : "receipt"}_${receipt.document_number || saleId.slice(0, 8)}.pdf`
      );
    } catch (e) {
      console.error("PDF export failed", e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      {/* Screen chrome */}
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
        <div id="sale-doc-capture">
          {/* Seller */}
          <div className="border-b border-border pb-4 text-center print:border-black/20">
            <p className="text-xs font-semibold tracking-wide text-brand-primary print:text-black">
              TAWALA
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-foreground print:text-black">
              {docLabel}
            </h1>
            <p className="mt-1 text-sm font-semibold text-foreground print:text-black">
              {receipt.seller.business_name}
            </p>
            {(receipt.seller.address || receipt.seller.phone) && (
              <p className="mt-0.5 text-xs text-muted print:text-black/70">
                {[receipt.seller.address, receipt.seller.phone]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {receipt.seller.tax_number && (
              <p className="mt-0.5 text-xs text-muted print:text-black/70">
                PIN: {receipt.seller.tax_number}
              </p>
            )}
          </div>

          {/* Meta */}
          <dl className="space-y-1.5 border-b border-border py-4 text-xs print:border-black/20">
            <div className="flex justify-between gap-3">
              <dt className="text-muted print:text-black/60">
                {isInvoice ? "Invoice no." : "Receipt no."}
              </dt>
              <dd className="font-semibold tabular text-foreground print:text-black">
                {receipt.document_number || saleId.slice(0, 8).toUpperCase()}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted print:text-black/60">Date</dt>
              <dd className="font-medium tabular text-foreground print:text-black">
                {formatWhen(receipt.issued_at)}
              </dd>
            </div>
            {receipt.seller.cashier?.name && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted print:text-black/60">Cashier</dt>
                <dd className="font-medium text-foreground print:text-black">
                  {receipt.seller.cashier.name}
                </dd>
              </div>
            )}
            {receipt.dispute_and_audit?.parent_sale_id && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted print:text-black/60">Sale ref</dt>
                <dd className="max-w-[12rem] truncate font-mono text-[11px] text-foreground print:text-black">
                  {receipt.dispute_and_audit.parent_sale_id}
                </dd>
              </div>
            )}
          </dl>

          {/* Buyer — required emphasis for invoices */}
          {(isInvoice ||
            (receipt.buyer?.name &&
              receipt.buyer.name.toLowerCase() !== "walk-in" &&
              receipt.buyer.name.toLowerCase() !== "walk in")) && (
            <div
              className={cn(
                "border-b border-border py-4 text-sm print:border-black/20",
                isInvoice && "bg-register/40 -mx-5 px-5 print:bg-transparent"
              )}
            >
              <p className="text-xs font-semibold tracking-wide text-muted print:text-black/60">
                {isInvoice ? "Bill to" : "Customer"}
              </p>
              <p className="mt-1 font-semibold text-foreground print:text-black">
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
            </div>
          )}

          {/* Lines */}
          <div className="border-b border-dashed border-border py-4 print:border-black/40">
            <div className="mb-2 flex justify-between text-xs font-semibold tracking-wide text-muted print:text-black/60">
              <span>Item</span>
              <span>Amount</span>
            </div>
            <ul className="space-y-2.5">
              {(receipt.items || []).map((item) => (
                <li key={item.item_id || item.product_id + item.name}>
                  <div className="flex justify-between gap-3 text-sm text-foreground print:text-black">
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
            </ul>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 py-4 text-sm">
            <div className="flex justify-between text-muted print:text-black/70">
              <span>Subtotal</span>
              <span className="tabular text-foreground print:text-black">
                {currency} {money(fin.subtotal)}
              </span>
            </div>
            {Number(fin.discount_amount) > 0 && (
              <div className="flex justify-between text-[var(--success)]">
                <span>Discount</span>
                <span className="tabular">
                  −{currency} {money(fin.discount_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-muted print:text-black/70">
              <span>
                Tax
                {fin.tax_rate_applied
                  ? ` (${fin.tax_rate_applied}%)`
                  : ""}
              </span>
              <span className="tabular text-foreground print:text-black">
                {currency} {money(fin.tax_amount)}
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between border-t border-border pt-3 print:border-black/30">
              <span className="text-sm font-semibold text-foreground print:text-black">
                {totalLabel}
              </span>
              <span
                className={cn(
                  "amount-lg font-semibold tabular print:text-black",
                  isInvoice && balanceDue > 0
                    ? "text-brand-secondary"
                    : "text-foreground"
                )}
              >
                {currency}{" "}
                {money(isInvoice ? balanceDue || fin.total_amount : fin.total_amount)}
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
          </div>

          {/* Payments */}
          {(receipt.payments || []).length > 0 && (
            <div className="border-t border-border pt-3 space-y-1.5 text-xs print:border-black/20">
              <p className="font-semibold text-muted print:text-black/60">
                Payments
              </p>
              {receipt.payments.map((p) => (
                <div
                  key={p.payment_id}
                  className="flex justify-between gap-2 text-foreground print:text-black"
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
            </div>
          )}

          <div className="mt-4 border-t border-border pt-4 text-center text-xs text-muted print:border-black/20 print:text-black/70">
            <p className="font-medium text-foreground print:text-black">
              {isInvoice
                ? "Thank you — balance due as agreed"
                : "Thank you for your business"}
            </p>
            <p className="mt-1">Powered by Tawala</p>
          </div>
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
            position: absolute !important;
            left: 50% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
            width: 72mm !important;
            max-width: 72mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}
