"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Coins, CreditCard, X, User, Phone, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CheckoutFormProps {
  saleId: string;
  grandTotal: number;
  organizationId: string;
  businessId: string;
}

export function CheckoutForm({ saleId, grandTotal, organizationId, businessId }: CheckoutFormProps) {
  const router = useRouter();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CREDIT">("CASH");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time structural phone regex verification tracking Kenyan formats
  const isPhoneValid = useMemo(() => {
    const cleaned = customerPhone.replace(/\s+/g, "");
    return /^(07|01)\d{8}$/.test(cleaned);
  }, [customerPhone]);

  // Gatekeeper formulation verification variable
  const isFormValid = customerName.trim().length >= 2 && isPhoneValid;

  const handleOpenSettleModal = (method: "CASH" | "CREDIT") => {
    setPaymentMethod(method);
    setModalOpen(true);
  };

  const handleSettleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Recording settlement...", {
      description: "Writing structural log records to backend database stream."
    });

    const payload = {
      sale_id: saleId,
      payment_method: paymentMethod,
      payment_reference: saleId,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.replace(/\s+/g, ""),
    };

    try {
      const response = await fetch(`/api/v1/org/stores/sales/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Backend server declined payload processing validation requirements.");
      }

      toast.success("Payment Processed Successfully", {
        id: toastId,
        description: `Order complete for KES ${grandTotal.toLocaleString()}`,
      });

      // Forward directly into the unified receipt presentation file component
      router.push(`/org/${organizationId}/${businessId}/checkout/receipt?sale_id=${saleId}`);
    } catch (error) {
      console.error("Settlement operational execution failure:", error);
      toast.error("Process Failed", {
        id: toastId,
        description: "An administrative synchronization issue stopped progress. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="px-1 text-left">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">Select Payment Pathway</h3>
      </div>

      {/* PRIMARY HIGH WEIGHT ACTIONS ACTION LAYOUT */}
      <div className="flex flex-col gap-4 w-full">
        {/* OPTION 1: CASH INTERACTION TARGET */}
        <button
          type="button"
          onClick={() => handleOpenSettleModal("CASH")}
          className="w-full p-5 bg-card border border-border/60 rounded-2xl shadow-xs flex items-center justify-between group hover:border-brand-primary/40 transition-all text-left cursor-pointer min-h-[54px]"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-brand-primary text-background rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-brand-primary/10">
              <Coins size={20} aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground uppercase tracking-wider">Settle via Cash Register</h4>
              <p className="text-[11px] font-medium text-muted mt-0.5">Collect payment directly at the cash drawer counter.</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-muted/60 group-hover:text-brand-primary transition-colors pr-1" />
        </button>

        {/* OPTION 2: CREDIT INTERACTION TARGET */}
        <button
          type="button"
          onClick={() => handleOpenSettleModal("CREDIT")}
          className="w-full p-5 bg-surface border border-border/40 rounded-2xl flex items-center justify-between group hover:border-brand-secondary/40 transition-all text-left cursor-pointer min-h-[54px]"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-card border border-border/60 text-muted rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:text-brand-secondary">
              <CreditCard size={20} aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Charge to Customer Credit</h4>
              <p className="text-[11px] font-medium text-muted mt-0.5">Log invoice balancing logs to business profile accounts.</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-muted/40 group-hover:text-brand-secondary transition-colors pr-1" />
        </button>
      </div>

      {/* DYNAMIC CUSTOMER REGISTRATION DIALOG SCREEN FRAMEWORK */}
      {modalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card rounded-[2rem] border border-border/60 shadow-xl p-6 md:p-8 relative overflow-hidden animate-in zoom-in-95 duration-150">
            
            <button
              type="button"
              onClick={() => { if (!isSubmitting) setModalOpen(false); }}
              disabled={isSubmitting}
              className="absolute right-5 top-5 p-2 text-muted hover:text-foreground rounded-full transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center disabled:opacity-30"
              aria-label="Cancel configuration tray layout"
            >
              <X size={16} aria-hidden="true" />
            </button>

            <form onSubmit={handleSettleTransactionSubmit} className="space-y-5 text-left">
              <div className="space-y-1">
                <div className="h-10 w-10 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-xl flex items-center justify-center mb-2">
                  <Coins size={18} aria-hidden="true" />
                </div>
                <h3 className="text-base font-black text-foreground uppercase tracking-tight">
                  Confirm {paymentMethod} Transaction
                </h3>
                <p className="text-[11px] text-muted leading-relaxed font-medium">
                  Provide client identity fields below to bind transactional metrics to receipts safely.
                </p>
              </div>

              {/* INPUT ELEMENT ONE: CUSTOMER IDENTITY */}
              <div className="space-y-1.5">
                <label htmlFor="customerName" className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                  Customer Full Name
                </label>
                <div className="relative">
                  <User size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input
                    type="text"
                    id="customerName"
                    required
                    disabled={isSubmitting}
                    placeholder="Jane Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-background border border-border/50 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-muted/40"
                  />
                </div>
              </div>

              {/* INPUT ELEMENT TWO: MOBILE CONTACT FIELD */}
              <div className="space-y-1.5">
                <label htmlFor="customerPhone" className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                  Customer Contact Line
                </label>
                <div className="relative">
                  <Phone size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input
                    type="text"
                    id="customerPhone"
                    required
                    disabled={isSubmitting}
                    placeholder="e.g., 0712345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-background border border-border/50 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-brand-primary/50 transition-all font-mono placeholder:text-muted/40"
                  />
                </div>
                {customerPhone.length > 0 && !isPhoneValid && (
                  <p className="text-[10px] text-brand-primary font-bold font-mono pl-1 animate-in fade-in duration-150">
                    * Format requires 10 digits starting with 07 or 01
                  </p>
                )}
              </div>

              {/* PIPELINE DISPATCH CONTROLLER TRIGGER ANCHOR */}
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full h-12 bg-brand-primary text-background text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-brand-primary/10 mt-2 min-h-[44px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Committing Settlement...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={13} aria-hidden="true" />
                    <span>Finalize Order & Print</span>
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}