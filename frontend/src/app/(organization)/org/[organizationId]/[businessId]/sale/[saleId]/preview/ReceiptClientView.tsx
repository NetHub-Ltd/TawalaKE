// 'use client';

// import { useReceipt } from '@/features/sales/hooks/useReceipts';
// import { Loader2, Calendar, User, FileText, Landmark, ShieldCheck, CheckCircle2 } from 'lucide-react';

// interface ReceiptClientViewProps {
//   saleId: string;
// }

// // Define explicit types matching your JSON payload interface
// interface ReceiptItem {
//   item_id: string;
//   product_id: string;
//   sku: string;
//   name: string;
//   quantity: number;
//   unit_price: number;
//   tax_rate: number;
//   tax_amount: number;
//   discount_amount: number;
//   total_price: number;
// }

// interface Payment {
//   payment_id: string;
//   method: string;
//   amount: number;
//   reference: string;
//   processed_at: string;
// }

// interface ReceiptData {
//   document_id: string;
//   document_number: string;
//   document_type: string;
//   issued_at: string;
//   version: string;
//   seller: {
//     business_id: string;
//     business_name: string;
//     address: string | null;
//     phone: string | null;
//     tax_number: string | null;
//     cashier: {
//       id: string;
//       name: string;
//       role: string;
//     };
//   };
//   buyer: {
//     customer_id: string | null;
//     name: string;
//     phone: string | null;
//     email: string | null;
//   };
//   financials: {
//     currency: string;
//     subtotal: number;
//     discount_amount: number;
//     tax_rate_applied: number;
//     tax_amount: number;
//     total_amount: number;
//     amount_paid: number;
//     balance_due: number;
//   };
//   items: ReceiptItem[];
//   payments: Payment[];
//   summary: {
//     total_items: number;
//     payment_count: number;
//     total_quantity: number;
//     total_tax_collected: number;
//   };
//   dispute_and_audit: {
//     parent_sale_id: string;
//     status: string;
//     original_document_hash: string;
//     notes: string;
//   };
// }

// export default function ReceiptClientView({ saleId }: ReceiptClientViewProps) {
//   // Cast useReceipt outcome to our explicit schema structure
//   const { data, isLoading, error } = useReceipt(saleId);
//   const receipt = data as unknown as ReceiptData;

//   if (isLoading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-24 bg-card rounded-3xl border border-border/40">
//         <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
//         <p className="text-xs font-bold uppercase tracking-wider text-muted">Retrieving Ledger Snapshots...</p>
//       </div>
//     );
//   }

//   if (error || !receipt) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-card rounded-3xl border border-border/40 max-w-2xl mx-auto">
//         <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center mb-3">
//           <span className="text-rose-500 font-black text-lg">!</span>
//         </div>
//         <p className="text-sm font-bold text-foreground">Transaction Node Missing</p>
//         <p className="text-xs text-muted max-w-xs mt-1">
//           Unable to locate the active cryptographic receipt ledger. Verify the ID or run system sync.
//         </p>
//       </div>
//     );
//   }

//   const issueDate = new Date(receipt.issued_at);

//   return (
//     <div className="w-full max-w-2xl mx-auto bg-card border border-border/40 rounded-[2rem] shadow-lift overflow-hidden p-8 sm:p-10 font-sans print:shadow-none print:border-none print:p-0 print:bg-white text-foreground">
      
//       {/* 1. BRAND HEADER & META METRICS */}
//       <div className="flex flex-col items-center text-center pb-8 border-b border-border/40">
//         <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-4 print:hidden">
//           <CheckCircle2 className="text-brand-primary h-6 w-6" />
//         </div>
//         <h1 className="text-2xl font-black uppercase tracking-wider">{receipt.seller.business_name}</h1>
//         <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-1">Official Payment Voucher</p>
        
//         {/* Dynamic Status Pill */}
//         <div className="mt-4 flex items-center gap-2">
//           <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
//             {receipt.dispute_and_audit.status}
//           </span>
//           <span className="text-xs font-mono font-bold text-muted-foreground">{receipt.document_number}</span>
//         </div>
//       </div>

//       {/* 2. TRANSACTION PARAMETERS GRID */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8 border-b border-border/40 text-xs">
//         {/* Left Hand Entity Metadata */}
//         <div className="space-y-3.5">
//           <div className="flex items-center gap-2 text-muted">
//             <Landmark size={13} className="opacity-60" />
//             <span className="font-bold uppercase tracking-wider text-[10px]">Merchant Segment</span>
//           </div>
//           <div className="space-y-1 pl-5">
//             <p className="font-bold text-foreground">{receipt.seller.business_name}</p>
//             <p className="text-muted text-[11px]">Cashier: {receipt.seller.cashier.name} ({receipt.seller.cashier.role})</p>
//             {receipt.seller.tax_number && (
//               <p className="text-muted font-mono text-[11px]">PIN: {receipt.seller.tax_number}</p>
//             )}
//           </div>
//         </div>

//         {/* Right Hand Entity Metadata */}
//         <div className="space-y-3.5">
//           <div className="flex items-center gap-2 text-muted">
//             <User size={13} className="opacity-60" />
//             <span className="font-bold uppercase tracking-wider text-[10px]">Recipient Node</span>
//           </div>
//           <div className="space-y-1 pl-5">
//             <p className="font-bold text-foreground">{receipt.buyer.name}</p>
//             {receipt.buyer.phone && <p className="text-muted text-[11px]">{receipt.buyer.phone}</p>}
//             {receipt.buyer.email && <p className="text-muted text-[11px]">{receipt.buyer.email}</p>}
//             <div className="flex items-center gap-1.5 text-muted text-[11px] pt-1 font-mono">
//               <Calendar size={11} className="opacity-40" />
//               <span>
//                 {issueDate.toLocaleDateString(undefined, {
//                   year: "numeric", month: "short", day: "numeric",
//                   hour: "2-digit", minute: "2-digit", second: "2-digit"
//                 })}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* 3. LINE ITEMS LEDGER */}
//       <div className="py-8 border-b border-border/40">
//         <h3 className="text-[10px] font-black uppercase tracking-wider text-muted mb-4 font-mono">Purchased Instances</h3>
        
//         <div className="overflow-x-auto no-scrollbar">
//           <table className="w-full min-w-[500px] border-collapse text-left text-xs font-mono">
//             <thead>
//               <tr className="border-b border-border/20 text-[10px] font-black uppercase tracking-wider text-muted">
//                 <th className="pb-3 w-[45%]">Item / SKU</th>
//                 <th className="pb-3 text-right w-[15%]">Qty</th>
//                 <th className="pb-3 text-right w-[20%]">Unit Cost</th>
//                 <th className="pb-3 text-right w-[20%]">Net Price</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-border/20 text-muted font-medium">
//               {receipt.items.map((item) => (
//                 <tr key={item.item_id} className="align-top">
//                   <td className="py-3.5 pr-4">
//                     <p className="font-bold text-foreground font-sans text-xs">{item.name}</p>
//                     <span className="text-[10px] text-muted tracking-tight">SKU: {item.sku}</span>
//                   </td>
//                   <td className="py-3.5 text-right font-bold text-foreground">
//                     {item.quantity}
//                   </td>
//                   <td className="py-3.5 text-right">
//                     {item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                   </td>
//                   <td className="py-3.5 text-right font-bold text-foreground">
//                     {receipt.financials.currency} {item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* 4. BALANCES AND FINANCIAL RESOLUTIONS */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 text-xs font-mono">
//         {/* Verification and audit checksum markers */}
//         <div className="space-y-4 rounded-2xl bg-surface/40 p-4 border border-border/20 self-start print:hidden">
//           <div className="flex items-center gap-1.5 text-muted">
//             <ShieldCheck size={13} className="text-brand-primary" />
//             <span className="font-bold uppercase tracking-wider text-[9px]">Receipt Integrity Proof</span>
//           </div>
//           <div className="space-y-1">
//             <p className="text-[9px] uppercase font-black text-muted tracking-tight">SHA256 Anchor Node</p>
//             <p className="text-[10px] font-mono break-all leading-normal text-foreground opacity-90">
//               {receipt.dispute_and_audit.original_document_hash}
//             </p>
//           </div>
//         </div>

//         {/* Dynamic Financial Computations */}
//         <div className="space-y-3 pl-4 sm:pl-0">
//           <div className="flex justify-between text-muted font-medium">
//             <span>Aggregated Subtotal</span>
//             <span className="text-foreground font-bold">
//               {receipt.financials.currency} {receipt.financials.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//             </span>
//           </div>
          
//           <div className="flex justify-between text-muted font-medium">
//             <span>Deducted Discounts</span>
//             <span className={receipt.financials.discount_amount > 0 ? "text-brand-accent font-bold" : "text-foreground"}>
//               -{receipt.financials.currency} {receipt.financials.discount_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//             </span>
//           </div>

//           <div className="flex justify-between text-muted font-medium">
//             <span>VAT System Taxes</span>
//             <span className="text-foreground">
//               +{receipt.financials.currency} {receipt.financials.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//             </span>
//           </div>

//           <div className="border-t border-border/40 pt-3 flex justify-between text-foreground font-black text-sm">
//             <span className="font-sans uppercase text-[11px] tracking-wide">Total Authorized</span>
//             <span>
//               {receipt.financials.currency} {receipt.financials.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//             </span>
//           </div>

//           <div className="border-t border-dashed border-border/30 pt-3 space-y-2 text-[11px]">
//             {receipt.payments.map((payment) => (
//               <div key={payment.payment_id} className="flex justify-between text-muted">
//                 <span className="flex items-center gap-1.5">
//                   <FileText size={11} className="opacity-40" />
//                   <span>Settled via {payment.method}</span>
//                 </span>
//                 <span className="font-bold text-foreground">
//                   {receipt.financials.currency} {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//     </div>
//   );
// }

// 'use client';

// import { useReceipt } from '@/features/sales/hooks/useReceipts';
// import { Loader2, Printer } from 'lucide-react';

// interface ReceiptClientViewProps {
//   saleId: string;
// }

// interface ReceiptItem {
//   item_id: string;
//   product_id: string;
//   sku: string;
//   name: string;
//   quantity: number;
//   unit_price: number;
//   tax_rate: number;
//   tax_amount: number;
//   discount_amount: number;
//   total_price: number;
// }

// interface Payment {
//   payment_id: string;
//   method: string;
//   amount: number;
//   reference: string;
//   processed_at: string;
// }

// interface ReceiptData {
//   document_id: string;
//   document_number: string;
//   document_type: string;
//   issued_at: string;
//   version: string;
//   seller: {
//     business_id: string;
//     business_name: string;
//     address: string | null;
//     phone: string | null;
//     tax_number: string | null;
//     cashier: {
//       id: string;
//       name: string;
//       role: string;
//     };
//   };
//   buyer: {
//     customer_id: string | null;
//     name: string;
//     phone: string | null;
//     email: string | null;
//   };
//   financials: {
//     currency: string;
//     subtotal: number;
//     discount_amount: number;
//     tax_rate_applied: number;
//     tax_amount: number;
//     total_amount: number;
//     amount_paid: number;
//     balance_due: number;
//   };
//   items: ReceiptItem[];
//   payments: Payment[];
//   summary: {
//     total_items: number;
//     payment_count: number;
//     total_quantity: number;
//     total_tax_collected: number;
//   };
//   dispute_and_audit: {
//     parent_sale_id: string;
//     status: string;
//     original_document_hash: string;
//     notes: string;
//   };
// }

// export default function ReceiptClientView({ saleId }: ReceiptClientViewProps) {
//   const { data, isLoading, error } = useReceipt(saleId);
//   const receipt = data as unknown as ReceiptData;

//   if (isLoading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-24 bg-card rounded-3xl border border-border/40">
//         <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
//         <p className="text-xs font-bold uppercase tracking-wider text-muted">Retrieving ETR Ledger...</p>
//       </div>
//     );
//   }

//   if (error || !receipt) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-card rounded-3xl border border-border/40 max-w-sm mx-auto">
//         <p className="text-sm font-bold text-foreground">ETR Error</p>
//         <p className="text-xs text-muted mt-1">Failed to retrieve the active fiscal receipt node.</p>
//       </div>
//     );
//   }

//   const issueDate = new Date(receipt.issued_at);

//   return (
//     /* 
//       Root Container: Simulated 80mm thermal paper roll width (max-w-[380px]).
//       Optimized for high-contrast presentation on-screen and pure monochrome rendering when printed.
//     */
//     <div className="w-full max-w-[380px] mx-auto bg-white text-black border border-neutral-300 rounded-lg p-5 font-mono text-xs shadow-sm print:shadow-none print:border-none print:p-0 print:w-full">
      
//       {/* 1. FISCAL HEADER */}
//       <div className="text-center space-y-1 pb-4">
//         <h1 className="text-sm font-bold uppercase tracking-tight">{receipt.seller.business_name}</h1>
//         {receipt.seller.address && <p className="text-[10px] uppercase">{receipt.seller.address}</p>}
//         {receipt.seller.phone && <p className="text-[10px]">TEL: {receipt.seller.phone}</p>}
//         {receipt.seller.tax_number && (
//           <p className="text-[10px] font-bold">KRA PIN: {receipt.seller.tax_number}</p>
//         )}
//         <p className="text-[10px] border-y border-black border-dashed py-1 my-2 font-bold uppercase tracking-widest">
//           *** FISCAL RECEIPT ***
//         </p>
//       </div>

//       {/* 2. TRANSACTION METADATA */}
//       <div className="space-y-1 text-[11px] pb-4 border-b border-black border-dashed">
//         <div className="flex justify-between">
//           <span>TX DATE:</span>
//           <span>
//             {issueDate.toLocaleDateString("en-GB")} {issueDate.toLocaleTimeString("en-GB", { hour12: false })}
//           </span>
//         </div>
//         <div className="flex justify-between">
//           <span>RECEIPT NO:</span>
//           <span className="font-bold">{receipt.document_number}</span>
//         </div>
//         <div className="flex justify-between">
//           <span>CASHIER:</span>
//           <span className="uppercase">{receipt.seller.cashier.name}</span>
//         </div>
//         <div className="flex justify-between">
//           <span>CUSTOMER:</span>
//           <span className="uppercase">{receipt.buyer.name}</span>
//         </div>
//       </div>

//       {/* 3. LINE ITEMS */}
//       <div className="py-4 border-b border-black border-dashed">
//         <table className="w-full text-[11px] font-mono">
//           <thead>
//             <tr className="border-b border-black font-bold">
//               <th className="text-left pb-1">ITEM DESCRIPTION</th>
//               <th className="text-right pb-1 w-[20%]">QTY</th>
//               <th className="text-right pb-1 w-[30%]">AMOUNT</th>
//             </tr>
//           </thead>
//           <tbody>
//             {receipt.items.map((item, idx) => {
//               // Standard ETR layout prints item name first, then dynamic calculation lines below it
//               return (
//                 <tr key={item.item_id || idx} className="border-b border-neutral-100 last:border-0">
//                   <td className="py-2 pr-2" colSpan={3}>
//                     <div className="font-bold uppercase break-words">{item.name}</div>
//                     <div className="flex justify-between text-[10px] text-neutral-600 mt-0.5">
//                       <span>
//                         {item.quantity} x {item.unit_price.toFixed(2)}
//                       </span>
//                       <span>
//                         ({(item.tax_rate * 100).toFixed(0)}% VAT Included)
//                       </span>
//                       <span>
//                         {receipt.financials.currency} {item.total_price.toFixed(2)}
//                       </span>
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       {/* 4. FINANCIAL LEDGER */}
//       <div className="py-4 space-y-1.5 text-[11px] border-b border-black border-dashed font-mono">
//         <div className="flex justify-between">
//           <span>SUBTOTAL (EXCL. TAX)</span>
//           <span>{receipt.financials.currency} {(receipt.financials.total_amount - receipt.financials.tax_amount).toFixed(2)}</span>
//         </div>
        
//         {receipt.financials.discount_amount > 0 && (
//           <div className="flex justify-between text-neutral-600">
//             <span>DISCOUNT ALLOWED</span>
//             <span>-{receipt.financials.currency} {receipt.financials.discount_amount.toFixed(2)}</span>
//           </div>
//         )}

//         <div className="flex justify-between">
//           <span>TOTAL VAT (16%)</span>
//           <span>{receipt.financials.currency} {receipt.financials.tax_amount.toFixed(2)}</span>
//         </div>

//         <div className="flex justify-between text-xs font-bold pt-2 border-t border-black">
//           <span>TOTAL AMOUNT</span>
//           <span>{receipt.financials.currency} {receipt.financials.total_amount.toFixed(2)}</span>
//         </div>
//       </div>

//       {/* 5. PAYMENTS COMPILATION */}
//       <div className="py-4 space-y-1 text-[11px] border-b border-black border-dashed">
//         <span className="font-bold block uppercase tracking-wider text-[10px]">Payment Breakdown:</span>
//         {receipt.payments.map((payment, idx) => (
//           <div key={payment.payment_id || idx} className="flex justify-between">
//             <span className="uppercase">{payment.method} METHOD</span>
//             <span className="font-bold">{receipt.financials.currency} {payment.amount.toFixed(2)}</span>
//           </div>
//         ))}
//         <div className="flex justify-between text-neutral-600">
//           <span>CHANGE DUE:</span>
//           <span>{receipt.financials.currency} {receipt.financials.balance_due.toFixed(2)}</span>
//         </div>
//       </div>

//       {/* 6. SYSTEM SIGNATURE & AUDIT VERIFICATION */}
//       <div className="pt-4 text-center space-y-2">
//         <div className="space-y-0.5 text-[9px] uppercase text-neutral-700">
//           <p className="font-bold">Device Cryptographic Node</p>
//           <p className="font-mono break-all leading-normal px-2 bg-neutral-50 py-1 border border-neutral-200">
//             {receipt.dispute_and_audit.original_document_hash}
//           </p>
//         </div>

//         <div className="pt-2 border-t border-neutral-200">
//           <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
//             Thank you for shopping with us!
//           </p>
//           <p className="text-[9px] text-neutral-400 font-sans mt-0.5">Powered by Tawala POS</p>
//         </div>
//       </div>

//     </div>
//   );
// }

'use client';

import { useReceipt } from '@/features/sales/hooks/useReceipts';
import { Loader2, Printer } from 'lucide-react';
import QRCode from 'react-qr-code';

interface ReceiptClientViewProps {
  saleId: string;
}

// Based on your actual JSON structure
interface ReceiptData {
  document_id: string;
  document_number: string;
  document_type: string;
  issued_at: string;
  seller: {
    business_name: string;
    address?: string;
    phone?: string;
    tax_number?: string;
    cashier: {
      name: string;
    };
  };
  buyer?: {
    name?: string;
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
  items: Array<{
    item_id?: string;
    name: string;
    sku?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  payments?: Array<{
    method: string;
    amount: number;
  }>;
  dispute_and_audit?: {
    original_document_hash?: string;
  };
}

export default function ReceiptClientView({ saleId }: ReceiptClientViewProps) {
  const { data, isLoading, error } = useReceipt(saleId);
  const receipt = data as ReceiptData | undefined;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-sm font-medium text-muted">Loading receipt...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="text-center py-16 px-6">
        <p className="text-red-600 font-medium">Failed to load receipt</p>
        <p className="text-sm text-muted mt-2">Please try again.</p>
      </div>
    );
  }

  const issueDate = new Date(receipt.issued_at);

  const qrPayload = JSON.stringify({
    document_number: receipt.document_number,
    sale_id: receipt.document_id || saleId,
    total: receipt.financials.total_amount,
    issued_at: receipt.issued_at,
    business: receipt.seller.business_name,
  });

  return (
    <div className="max-w-[380px] mx-auto bg-white text-black border border-gray-300 rounded-xl overflow-hidden print:shadow-none print:border-none print:rounded-none font-mono text-xs">
      
      {/* HEADER */}
      <div className="border-b border-black p-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="w-20 h-20 border border-dashed border-gray-400 rounded flex items-center justify-center bg-gray-50">
            <span className="text-[10px] text-gray-400 text-center leading-tight">
              BUSINESS<br />LOGO
            </span>
          </div>
        </div>

        <h1 className="font-bold text-lg tracking-tight">
          {receipt.seller.business_name}
        </h1>

        {receipt.seller.address && <p className="text-xs mt-1">{receipt.seller.address}</p>}
        {receipt.seller.phone && <p className="text-xs">Tel: {receipt.seller.phone}</p>}
        {receipt.seller.tax_number && (
          <p className="text-xs font-bold mt-1">KRA PIN: {receipt.seller.tax_number}</p>
        )}

        <div className="mt-5 pt-4 border-t border-dashed border-black">
          <p className="uppercase tracking-widest text-sm font-bold">
            {receipt.document_type === 'INVOICE' ? 'TAX INVOICE' : 'OFFICIAL RECEIPT'}
          </p>
          <p className="font-mono text-base mt-1 tracking-wider">
            {receipt.document_number}
          </p>
        </div>
      </div>

      {/* BODY */}
      <div className="p-6">
        {/* Metadata */}
        <div className="space-y-1.5 text-[11px] pb-5 border-b border-dashed border-black">
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{issueDate.toLocaleString('en-GB')}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span className="uppercase">{receipt.seller.cashier.name}</span>
          </div>
          {receipt.buyer?.name && (
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="uppercase">{receipt.buyer.name}</span>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="py-5">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="text-left pb-2">ITEM</th>
                <th className="text-right pb-2">QTY</th>
                <th className="text-right pb-2">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {receipt.items.map((item, idx) => (
                <tr key={item.item_id || idx} className="py-2">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-[10px] text-gray-500">
                      {item.sku && <span>{item.sku} • </span>}
                      {item.unit_price.toFixed(2)} × {item.quantity}
                    </div>
                  </td>
                  <td className="text-right py-2 align-top">{item.quantity}</td>
                  <td className="text-right py-2 font-medium align-top">
                    {receipt.financials.currency} {item.total_price.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="py-4 space-y-1.5 text-[11px] border-t border-black">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{receipt.financials.currency} {receipt.financials.subtotal.toFixed(2)}</span>
          </div>

          {receipt.financials.discount_amount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount</span>
              <span>- {receipt.financials.currency} {receipt.financials.discount_amount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>VAT</span>
            <span>{receipt.financials.currency} {receipt.financials.tax_amount.toFixed(2)}</span>
          </div>

          <div className="flex justify-between pt-2 border-t border-black font-bold text-sm">
            <span>TOTAL</span>
            <span>{receipt.financials.currency} {receipt.financials.total_amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-black p-6 text-center">
        <div className="flex flex-col items-center mb-6">
          <p className="text-xs font-medium mb-3">Scan for Digital Verification</p>
          <div className="bg-white p-3 border border-gray-300 rounded">
            <QRCode value={qrPayload} size={160} level="H" fgColor="#000000" bgColor="#ffffff" />
          </div>
        </div>

        <div className="text-xs space-y-1">
          <p className="font-bold">Thank you for shopping with us!</p>
          <p className="text-gray-600">Powered by Tawala POS</p>
        </div>
      </div>

      {/* Print Button */}
      <div className="print:hidden px-6 pb-6">
        <button
          onClick={() => window.print()}
          className="w-full bg-black hover:bg-zinc-800 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-medium transition"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
      </div>
    </div>
  );
}