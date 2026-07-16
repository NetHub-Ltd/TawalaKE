'use client';

import { useReceipt } from '@/features/sales/hooks/useReceipts';
import { Loader2, Calendar, User, FileText, Landmark, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ReceiptClientViewProps {
  saleId: string;
}

// Define explicit types matching your JSON payload interface
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

export default function ReceiptClientView({ saleId }: ReceiptClientViewProps) {
  // Cast useReceipt outcome to our explicit schema structure
  const { data, isLoading, error } = useReceipt(saleId);
  const receipt = data as unknown as ReceiptData;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-card rounded-3xl border border-border/40">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Retrieving Ledger Snapshots...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-card rounded-3xl border border-border/40 max-w-2xl mx-auto">
        <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center mb-3">
          <span className="text-rose-500 font-black text-lg">!</span>
        </div>
        <p className="text-sm font-bold text-foreground">Transaction Node Missing</p>
        <p className="text-xs text-muted max-w-xs mt-1">
          Unable to locate the active cryptographic receipt ledger. Verify the ID or run system sync.
        </p>
      </div>
    );
  }

  const issueDate = new Date(receipt.issued_at);

  return (
    <div className="w-full max-w-2xl mx-auto bg-card border border-border/40 rounded-[2rem] shadow-lift overflow-hidden p-8 sm:p-10 font-sans print:shadow-none print:border-none print:p-0 print:bg-white text-foreground">
      
      {/* 1. BRAND HEADER & META METRICS */}
      <div className="flex flex-col items-center text-center pb-8 border-b border-border/40">
        <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4 print:hidden">
          <CheckCircle2 className="text-brand-primary h-6 w-6" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-wider">{receipt.seller.business_name}</h1>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-1">Official Payment Voucher</p>
        
        {/* Dynamic Status Pill */}
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            {receipt.dispute_and_audit.status}
          </span>
          <span className="text-xs font-mono font-bold text-muted-foreground">{receipt.document_number}</span>
        </div>
      </div>

      {/* 2. TRANSACTION PARAMETERS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8 border-b border-border/40 text-xs">
        {/* Left Hand Entity Metadata */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 text-muted">
            <Landmark size={13} className="opacity-60" />
            <span className="font-bold uppercase tracking-wider text-[10px]">Merchant Segment</span>
          </div>
          <div className="space-y-1 pl-5">
            <p className="font-bold text-foreground">{receipt.seller.business_name}</p>
            <p className="text-muted text-[11px]">Cashier: {receipt.seller.cashier.name} ({receipt.seller.cashier.role})</p>
            {receipt.seller.tax_number && (
              <p className="text-muted font-mono text-[11px]">PIN: {receipt.seller.tax_number}</p>
            )}
          </div>
        </div>

        {/* Right Hand Entity Metadata */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 text-muted">
            <User size={13} className="opacity-60" />
            <span className="font-bold uppercase tracking-wider text-[10px]">Recipient Node</span>
          </div>
          <div className="space-y-1 pl-5">
            <p className="font-bold text-foreground">{receipt.buyer.name}</p>
            {receipt.buyer.phone && <p className="text-muted text-[11px]">{receipt.buyer.phone}</p>}
            {receipt.buyer.email && <p className="text-muted text-[11px]">{receipt.buyer.email}</p>}
            <div className="flex items-center gap-1.5 text-muted text-[11px] pt-1 font-mono">
              <Calendar size={11} className="opacity-40" />
              <span>
                {issueDate.toLocaleDateString(undefined, {
                  year: "numeric", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit", second: "2-digit"
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LINE ITEMS LEDGER */}
      <div className="py-8 border-b border-border/40">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-muted mb-4 font-mono">Purchased Instances</h3>
        
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[500px] border-collapse text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border/20 text-[10px] font-black uppercase tracking-wider text-muted">
                <th className="pb-3 w-[45%]">Item / SKU</th>
                <th className="pb-3 text-right w-[15%]">Qty</th>
                <th className="pb-3 text-right w-[20%]">Unit Cost</th>
                <th className="pb-3 text-right w-[20%]">Net Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 text-muted font-medium">
              {receipt.items.map((item) => (
                <tr key={item.item_id} className="align-top">
                  <td className="py-3.5 pr-4">
                    <p className="font-bold text-foreground font-sans text-xs">{item.name}</p>
                    <span className="text-[10px] text-muted tracking-tight">SKU: {item.sku}</span>
                  </td>
                  <td className="py-3.5 text-right font-bold text-foreground">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 text-right">
                    {item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 text-right font-bold text-foreground">
                    {receipt.financials.currency} {item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. BALANCES AND FINANCIAL RESOLUTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 text-xs font-mono">
        {/* Verification and audit checksum markers */}
        <div className="space-y-4 rounded-2xl bg-surface/40 p-4 border border-border/20 self-start print:hidden">
          <div className="flex items-center gap-1.5 text-muted">
            <ShieldCheck size={13} className="text-brand-primary" />
            <span className="font-bold uppercase tracking-wider text-[9px]">Receipt Integrity Proof</span>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] uppercase font-black text-muted tracking-tight">SHA256 Anchor Node</p>
            <p className="text-[10px] font-mono break-all leading-normal text-foreground opacity-90">
              {receipt.dispute_and_audit.original_document_hash}
            </p>
          </div>
        </div>

        {/* Dynamic Financial Computations */}
        <div className="space-y-3 pl-4 sm:pl-0">
          <div className="flex justify-between text-muted font-medium">
            <span>Aggregated Subtotal</span>
            <span className="text-foreground font-bold">
              {receipt.financials.currency} {receipt.financials.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex justify-between text-muted font-medium">
            <span>Deducted Discounts</span>
            <span className={receipt.financials.discount_amount > 0 ? "text-brand-accent font-bold" : "text-foreground"}>
              -{receipt.financials.currency} {receipt.financials.discount_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between text-muted font-medium">
            <span>VAT System Taxes</span>
            <span className="text-foreground">
              +{receipt.financials.currency} {receipt.financials.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="border-t border-border/40 pt-3 flex justify-between text-foreground font-black text-sm">
            <span className="font-sans uppercase text-[11px] tracking-wide">Total Authorized</span>
            <span>
              {receipt.financials.currency} {receipt.financials.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="border-t border-dashed border-border/30 pt-3 space-y-2 text-[11px]">
            {receipt.payments.map((payment) => (
              <div key={payment.payment_id} className="flex justify-between text-muted">
                <span className="flex items-center gap-1.5">
                  <FileText size={11} className="opacity-40" />
                  <span>Settled via {payment.method}</span>
                </span>
                <span className="font-bold text-foreground">
                  {receipt.financials.currency} {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
