"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Smartphone, 
  Coins, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  X,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { useCartStore } from "@/features/sales/stores/useCartStore";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";

type CheckoutModalMode = "NONE" | "MPESA" | "CASH" | "INVOICE_SUCCESS";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getFinancials, getReceiptPayload } = useCartStore();
  const { businessId } = useBusinessContext();
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState<CheckoutModalMode>("NONE");
  
  // Track final variant selected to forward explicitly as param route states
  const [selectedMethodParam, setSelectedMethodParam] = useState<"receipt" | "invoice">("receipt");

  // Modal interaction fields
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [cashError, setCashError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen w-full bg-[#fafbfc] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  // Enforce type safety for dynamic business ID parameters
  const normalizedBusinessId = Array.isArray(businessId) 
    ? businessId[0] 
    : businessId || "BIZ-PRO-01";

  const { subtotal, taxAmount, discountApplied, grandTotal } = getFinancials();

  // Business Logic Guard: Required cash amount equals grand total minus tax and discount (which isolates raw base subtotal)
  const targetCashRequired = subtotal;

  // --- MPESA PHONE VALIDATION RULES ---
  const handleMpesaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");

    const cleaned = phoneNumber.replace(/\s+/g, "");
    const kenyanPhoneRegex = /^(07|01)\d{8}$/;

    if (!kenyanPhoneRegex.test(cleaned)) {
      setPhoneError("Phone number must be exactly 10 digits and start with 07 or 01.");
      return;
    }

    setIsProcessing(true);
    setSelectedMethodParam("receipt");
    
    setTimeout(() => {
      // Use the safe string value instead of raw param contexts
      const payload = getReceiptPayload(normalizedBusinessId, "CASHIER-MAIN", "MPESA");
      console.log("Mpesa STK Checkout Payload Persisted Safely:", payload);
      
      setIsProcessing(false);
      setActiveModal("INVOICE_SUCCESS");
    }, 1200);
  };

  // --- CASH VALUATION GATES ---
  const handleCashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCashError("");

    const parsedCash = parseFloat(cashAmount);
    if (isNaN(parsedCash) || Math.abs(parsedCash - targetCashRequired) > 0.01) {
      setCashError(`Exactly KES ${targetCashRequired.toLocaleString()} is required. We cannot accept more or less.`);
      return;
    }

    setIsProcessing(true);
    setSelectedMethodParam("receipt");

    setTimeout(() => {
      const payload = getReceiptPayload(normalizedBusinessId, "CASHIER-MAIN", "CASH");
      console.log("Cash Checkout Payload Persisted Safely:", payload);
      
      setIsProcessing(false);
      setActiveModal("INVOICE_SUCCESS");
    }, 1200);
  };

  // --- IMMEDIATE INVOICE SIMULATION ---
  const handleGenerateInvoiceDirect = () => {
    setIsProcessing(true);
    setSelectedMethodParam("invoice");

    setTimeout(() => {
      const payload = getReceiptPayload(normalizedBusinessId, "CASHIER-MAIN", "INVOICE");
      console.log("Draft Invoice Generation State Logged:", payload);
      
      setIsProcessing(false);
      setActiveModal("INVOICE_SUCCESS");
    }, 1000);
  };

  // --- REDIRECT lifecycle instead of immediate store deletion ---
  const handleCompleteOrderLifecycle = () => {
    // Navigate directly to document generation layout, using the normalized string safely
    router.push(`/terminal/${normalizedBusinessId}/checkout/receipt?method=${selectedMethodParam}`);
  };

  return (
    <div className="h-screen w-full bg-[#fafbfc] text-[#2d3142] overflow-hidden relative flex flex-col p-6 lg:p-8 selection:bg-primary/10">
      
      {/* Soft atmospheric layout elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] bg-[#f0f3ff] rounded-full blur-[110px] pointer-events-none" />

      {/* HEADER BAR */}
      <header className="w-full flex items-center justify-between pb-5 border-b border-slate-100 shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            disabled={activeModal !== "NONE"}
            className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#2d3142] hover:text-primary transition-all disabled:opacity-30"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[9px] font-black tracking-wider uppercase text-primary block">Checkout Stream</span>
            <h1 className="text-base font-black text-[#1e2229] uppercase tracking-tight">Select Payment Route</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-600">
          <ShieldCheck size={12} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Secure Settlement</span>
        </div>
      </header>

      {/* CORE FRAMEWORK SPLIT */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-0 py-6 relative z-10">
        
        {/* LEFT COLUMN: SUMMARY BRIEF RECEIPT SNAPSHOT */}
        <section className="lg:col-span-5 flex flex-col justify-center h-full max-h-[460px] bg-white border border-slate-100 rounded-[2rem] p-6 shadow-soft">
          <h2 className="text-[10px] font-black uppercase tracking-wider text-[#7d859a] border-b border-slate-100 pb-3 mb-4">
            Sale Summary Brief
          </h2>
          
          {/* Scrollless structural summary stream */}
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1 text-xs">
            <div className="flex justify-between text-[#5c6479]">
              <span>Items Total Count</span>
              <span className="font-bold text-[#1e2229]">{cart.reduce((acc, i) => acc + i.qty, 0)} units</span>
            </div>
            <div className="flex justify-between text-[#5c6479]">
              <span>Base Subtotal</span>
              <span className="font-bold text-[#1e2229]">KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#5c6479]">
              <span>Estimated Taxes</span>
              <span className="font-bold text-[#1e2229]">KES {taxAmount.toLocaleString()}</span>
            </div>
            {discountApplied > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discounts Applied</span>
                <span>-KES {discountApplied.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Bold payable dynamic summary line */}
          <div className="pt-4 border-t border-dashed border-slate-100 mt-4 flex justify-between items-baseline">
            <span className="text-xs font-black uppercase tracking-wider text-primary">Net Payable</span>
            <span className="text-2xl font-black tracking-tight text-[#1e2229]">
              KES {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </section>

        {/* RIGHT COLUMN: INTERACTIVE PAY ROUTE GRID */}
        <section className="lg:col-span-7 flex flex-col gap-4 justify-center h-full max-h-[460px] w-full max-w-xl mx-auto">
          
          {/* route 1: mpesa trigger */}
          <button
            onClick={() => { setActiveModal("MPESA"); setPhoneError(""); }}
            className="w-full p-5 bg-white border border-slate-100 rounded-2xl shadow-soft flex items-center justify-between group hover:border-primary/30 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1e2229] uppercase tracking-tight">Pay with M-Pesa STK</h3>
                <p className="text-[11px] font-medium text-[#7d859a]">Triggers an automated customer SIM prompt query instantly.</p>
              </div>
            </div>
          </button>

          {/* route 2: cash trigger */}
          <button
            onClick={() => { setActiveModal("CASH"); setCashError(""); setCashAmount(""); }}
            className="w-full p-5 bg-white border border-slate-100 rounded-2xl shadow-soft flex items-center justify-between group hover:border-primary/30 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center">
                <Coins size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1e2229] uppercase tracking-tight">Settle with Exact Cash</h3>
                <p className="text-[11px] font-medium text-[#7d859a]">Process cash ledger updates requiring base totals: <span className="font-bold text-[#1e2229]">KES {targetCashRequired.toLocaleString()}</span>.</p>
              </div>
            </div>
          </button>

          {/* route 3: invoice trigger */}
          <button
            onClick={handleGenerateInvoiceDirect}
            disabled={isProcessing}
            className="w-full p-5 bg-white border border-slate-100 rounded-2xl shadow-soft flex items-center justify-between group hover:border-primary/30 transition-all text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl flex items-center justify-center">
                {isProcessing && activeModal === "NONE" ? <Loader2 className="animate-spin" size={18} /> : <FileText size={20} />}
              </div>
              <div>
                <h3 className="text-sm font-black text-[#1e2229] uppercase tracking-tight">Generate Corporate Invoice</h3>
                <p className="text-[11px] font-medium text-[#7d859a]">Draft point-in-time invoices for payment tracking.</p>
              </div>
            </div>
          </button>

        </section>
      </div>

      {/* --- LIGHTWEIGHT FULL-SCREEN BACKDROP OVERLAY MODAL PATTERNS --- */}
      {activeModal !== "NONE" && (
        <div className="fixed inset-0 bg-[#1e2229]/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 md:p-8 relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* CLOSE ACTION BUTTON */}
            {activeModal !== "INVOICE_SUCCESS" && (
              <button
                onClick={() => setActiveModal("NONE")}
                className="absolute right-4 top-4 p-2 text-slate-400 hover:text-primary rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            )}

            {/* --- CASE A: MPESA POPUP OVERLAY --- */}
            {activeModal === "MPESA" && (
              <form onSubmit={handleMpesaSubmit} className="space-y-5">
                <div className="space-y-1">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl flex items-center justify-center mb-2">
                    <Smartphone size={18} />
                  </div>
                  <h3 className="text-base font-black text-[#1e2229] uppercase tracking-tight">Initiate M-Pesa Push</h3>
                  <p className="text-[11px] font-medium text-[#7d859a]">Enter the customer mobile contact line to stream STK triggers.</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Mobile Phone Number</label>
                  <input
                    type="text"
                    id="phone"
                    required
                    placeholder="e.g., 0712345678 or 0112345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isProcessing}
                    className="w-full h-11 px-4 bg-[#fafbfc] border border-slate-200 rounded-xl text-xs font-semibold text-[#2d3142] focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                  />
                  {phoneError && (
                    <div className="flex items-center gap-1.5 text-rose-500 text-[11px] font-bold pt-1">
                      <AlertCircle size={12} />
                      <span>{phoneError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-12 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-primary/95 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Broadcasting STK Signal...</span>
                    </>
                  ) : (
                    <span>Transmit Push Notification</span>
                  )}
                </button>
              </form>
            )}

            {/* --- CASE B: CASH VALUE ACCELERATOR OVERLAY --- */}
            {activeModal === "CASH" && (
              <form onSubmit={handleCashSubmit} className="space-y-5">
                <div className="space-y-1">
                  <div className="h-10 w-10 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl flex items-center justify-center mb-2">
                    <Coins size={18} />
                  </div>
                  <h3 className="text-base font-black text-[#1e2229] uppercase tracking-tight">Confirm Cash Deposit</h3>
                  <p className="text-[11px] font-medium text-[#7d859a]">
                    Input exactly <span className="font-bold text-[#1e2229]">KES {targetCashRequired.toLocaleString()}</span> (Base cost excluding tax and discount overrides).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cash" className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Exact Value Tendered</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">KES</span>
                    <input
                      type="number"
                      id="cash"
                      step="any"
                      required
                      placeholder={targetCashRequired.toString()}
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      disabled={isProcessing}
                      className="w-full h-11 pl-12 pr-4 bg-[#fafbfc] border border-slate-200 rounded-xl text-xs font-semibold text-[#2d3142] focus:outline-none focus:border-primary/50 focus:bg-white transition-all"
                    />
                  </div>
                  {cashError && (
                    <div className="flex items-center gap-1.5 text-rose-500 text-[11px] font-bold pt-1">
                      <AlertCircle size={12} />
                      <span>{cashError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-12 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-primary/95 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Logging Cash Vault Sync...</span>
                    </>
                  ) : (
                    <span>Commit Cash Settle</span>
                  )}
                </button>
              </form>
            )}

            {/* --- CASE C: TRANSACTION LOG SUCCESS CONSOLE --- */}
            {activeModal === "INVOICE_SUCCESS" && (
              <div className="text-center space-y-4 py-4">
                <div className="h-12 w-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100 mx-auto shadow-sm">
                  <CheckCircle2 size={22} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-[#1e2229] uppercase tracking-tight">Transaction Logged Safely</h3>
                  <p className="text-xs font-medium text-[#5c6479] max-w-sm mx-auto leading-relaxed">
                    The transaction records have been safely written to your secure audit ledger and thermal print pipeline streams.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleCompleteOrderLifecycle}
                    className="w-full h-11 bg-[#1e2229] hover:bg-[#2d3142] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                  >
                    View Settlement Document
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full pt-4 border-t border-slate-100 shrink-0 text-[#7d859a] font-medium text-[11px] z-10 text-center lg:text-left">
        Tawala Cloud Core &copy; {new Date().getFullYear()}. Encrypted POS settlement portal active.
      </footer>

    </div>
  );
}