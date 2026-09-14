"use client";

/**
 * Canonical receipt / invoice view — thermal-friendly print + PDF export.
 * Tokens only; calm retail hierarchy (total wins the eye).
 */
import React, { useEffect, useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  ArrowLeft,
  Download,
  Share2,
} from "lucide-react";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { Spinner, Button } from "@/lib/components/ui";

function money(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ReceiptClientView() {
  const router = useRouter();
  const printAreaRef = useRef<HTMLDivElement>(null);
  const ctx = useBusinessContext();
  const businessId = Array.isArray(ctx.businessId)
    ? ctx.businessId[0]
    : ctx.businessId;
  const organizationId = Array.isArray(ctx.organizationId)
    ? ctx.organizationId[0]
    : ctx.organizationId;
  const [isNavigating, startTransition] = useTransition();
  const [isDownloading, setIsDownloading] = useState(false);

  const { cart, getFinancials, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [documentMode, setDocumentMode] = useState<"receipt" | "invoice">(
    "receipt"
  );

  useEffect(() => {
    setMounted(true);
    setOrderId("TWL-" + Math.floor(100000 + Math.random() * 900000));
    const now = new Date();
    setCurrentTime(
      now.toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
        " " +
        now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })
    );
    if (typeof window !== "undefined") {
      const method = new URLSearchParams(window.location.search).get("method");
      setDocumentMode(method === "invoice" ? "invoice" : "receipt");
    }
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner size="md" label="Loading receipt" />
      </div>
    );
  }

  const { subtotal, taxAmount, discountApplied, grandTotal } = getFinancials();
  const isInvoice = documentMode === "invoice";

  const handlePrintReceipt = () => {
    if (typeof window !== "undefined") window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printAreaRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const target = clonedDoc.getElementById("receipt-capture-node");
          if (target) {
            target.style.backgroundColor = "#ffffff";
            target.style.color = "#121B1E";
            target.querySelectorAll(".text-muted").forEach((el) => {
              if (el instanceof HTMLElement) el.style.color = "#5A6468";
            });
          }
        },
      });
      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      pdf.save(`${documentMode}_${orderId}.pdf`);
    } catch (error) {
      console.error("Receipt PDF failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const terminalHref =
    organizationId && businessId
      ? `/org/${organizationId}/${businessId}/terminal`
      : businessId
        ? `../terminal`
        : "/org";

  const newSale = () => {
    clearCart();
    startTransition(() => {
      router.push(terminalHref);
    });
  };

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Screen chrome */}
      <header className="print:hidden border-b border-border bg-card">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-muted hover:bg-register hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <ArrowLeft size={16} aria-hidden />
            Back
          </button>
          <p className="text-sm font-semibold text-foreground">
            {isInvoice ? "Invoice" : "Receipt"}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-register hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Print"
              title="Print"
            >
              <Printer size={16} />
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadPDF()}
              disabled={isDownloading}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-register hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Download PDF"
              title="Download PDF"
            >
              {isDownloading ? <Spinner size="sm" /> : <Download size={16} />}
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-register hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Share"
              title="Share"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6 print:max-w-none print:p-0">
        {/* Thermal paper card */}
        <section
          id="receipt-print-window"
          className="mx-auto w-full max-w-[22rem] flex-1"
        >
          <div
            ref={printAreaRef}
            id="receipt-capture-node"
            className="rounded-md border border-border bg-card p-5 shadow-none print:border-0 print:p-0"
          >
            {/* Brand */}
            <div className="border-b border-border pb-4 text-center print:border-black/20">
              <p className="text-xs font-semibold tracking-wide text-brand-primary print:text-black">
                TAWALA
              </p>
              <h1 className="mt-1 text-lg font-semibold tracking-tight text-foreground print:text-black">
                {isInvoice ? "Tax invoice" : "Sales receipt"}
              </h1>
              <p className="mt-1 text-xs text-muted print:text-black/70">
                {/* Placeholder store block — replace with live branch when wired */}
                Branch register · Kenya
              </p>
            </div>

            {/* Meta */}
            <dl className="space-y-1.5 border-b border-border py-4 text-xs print:border-black/20">
              <div className="flex justify-between gap-3">
                <dt className="text-muted print:text-black/60">
                  {isInvoice ? "Invoice no." : "Receipt no."}
                </dt>
                <dd className="font-semibold tabular text-foreground print:text-black">
                  {orderId}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted print:text-black/60">Date</dt>
                <dd className="font-medium tabular text-foreground print:text-black">
                  {currentTime}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted print:text-black/60">Type</dt>
                <dd className="font-medium capitalize text-foreground print:text-black">
                  {documentMode}
                </dd>
              </div>
            </dl>

            {/* Lines */}
            <div className="border-b border-dashed border-border py-4 print:border-black/40">
              <div className="mb-2 flex justify-between text-xs font-semibold tracking-wide text-muted print:text-black/60">
                <span>Item</span>
                <span>Amount</span>
              </div>
              {cart.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  No lines on this ticket.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {cart.map((item) => (
                    <li key={item.id} className="text-sm">
                      <div className="flex justify-between gap-3 text-foreground print:text-black">
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {item.name}
                        </span>
                        <span className="shrink-0 tabular font-semibold">
                          {money(item.price * item.qty)}
                        </span>
                      </div>
                      <p className="text-xs text-muted print:text-black/60">
                        {item.qty} × {money(item.price)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Totals — hierarchy: total is loudest */}
            <div className="space-y-1.5 py-4 text-sm">
              <div className="flex justify-between text-muted print:text-black/70">
                <span>Subtotal</span>
                <span className="tabular text-foreground print:text-black">
                  KES {money(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-muted print:text-black/70">
                <span>Tax</span>
                <span className="tabular text-foreground print:text-black">
                  KES {money(taxAmount)}
                </span>
              </div>
              {discountApplied > 0 && (
                <div className="flex justify-between text-[var(--success)]">
                  <span>Discount</span>
                  <span className="tabular">−KES {money(discountApplied)}</span>
                </div>
              )}
              <div className="mt-2 flex items-baseline justify-between border-t border-border pt-3 print:border-black/30">
                <span className="text-sm font-semibold text-foreground print:text-black">
                  {isInvoice ? "Amount due" : "Total paid"}
                </span>
                <span className="amount-lg font-semibold tabular text-foreground print:text-black">
                  KES {money(grandTotal)}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-4 text-center text-xs text-muted print:border-black/20 print:text-black/70">
              <p className="font-medium text-foreground print:text-black">
                {isInvoice ? "Payment terms: as agreed" : "Thank you for your business"}
              </p>
              <p className="mt-1">Powered by Tawala</p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="print:hidden mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Button
            type="button"
            variant="success"
            className="flex-1"
            disabled={isNavigating}
            onClick={newSale}
          >
            New sale
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handlePrintReceipt}
          >
            <Printer size={16} aria-hidden />
            Print
          </Button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body,
          html {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #receipt-print-window,
          #receipt-print-window * {
            visibility: visible !important;
          }
          #receipt-print-window {
            position: absolute !important;
            left: 50% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
            width: 72mm !important;
            max-width: 72mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
        }
      `}</style>
    </main>
  );
}
