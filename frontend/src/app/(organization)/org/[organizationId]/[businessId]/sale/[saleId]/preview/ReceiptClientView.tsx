'use client';

import  {useReceipt} from '@/features/sales/hooks/useReceipts';
import { Loader2, Printer } from 'lucide-react';

interface ReceiptClientViewProps {
  saleId: string;
}

export default function ReceiptClientView({ saleId }: ReceiptClientViewProps) {
  const { data: receipt, isLoading, error } = useReceipt(saleId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-gray-600">Loading receipt...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="text-center py-20 text-red-600">
        Failed to load receipt. Please try again.
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-2xl p-8 max-w-2xl mx-auto print:shadow-none print:p-0">
      {/* Header */}
      <div className="border-b pb-6 mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Tawala POS</h1>
        <p className="text-sm text-gray-500 mt-1">Official Receipt</p>
        <p className="text-xl font-mono mt-4">{receipt.document_number}</p>
      </div>

      {/* Content will go here once you expand it */}
      <pre className="bg-gray-100 p-6 rounded text-sm overflow-auto text-left">
        {JSON.stringify(receipt, null, 2)}
      </pre>

      {/* Print Button */}
      <div className="mt-8 flex justify-center print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-medium transition"
        >
          <Printer className="w-5 h-5" />
          Print Receipt
        </button>
      </div>
    </div>
  );
}