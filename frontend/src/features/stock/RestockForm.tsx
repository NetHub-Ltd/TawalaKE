// app/components/inventory/RestockForm.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface ProductContext {
  id: string;
  label: string;
  currentStock: number;
  currentBuyingPrice: number;
  currentSellingPrice: number;
}

export default function RestockForm({ product }: { product: ProductContext }) {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState<number>(0);
  const [buyingPrice, setBuyingPrice] = useState<number>(product.currentBuyingPrice);
  const [sellingPrice, setSellingPrice] = useState<number>(product.currentSellingPrice);
  const [reference, setReference] = useState<string>('');
  const [reasonCode, setReasonCode] = useState<string>('SUPPLIER_DELIVERY');
  const [notes, setNotes] = useState<string>('');

  const totalCost = quantity * buyingPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }

    const payload = {
      business_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", // Mocked globally
      performed_by: "ca7b3a11-8231-4a1e-8133-72bb9443216c", // Mocked operator
      items: [
        {
          product_id: product.id,
          movement_type: "RESTOCK",
          quantity: Number(quantity),
          buying_price: Number(buyingPrice),
          selling_price: Number(sellingPrice),
          reference_type: "PURCHASE_ORDER",
          reference_id: reference || null,
          reason_code: reasonCode,
          notes: notes || null
        }
      ]
    };

    startTransition(async () => {
      // Emulating network delay 
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.log('🚀 [Backend Payload Sent] -> POST /api/v1/inventory/transactions', JSON.stringify(payload, null, 2));
      alert(`Success! Restocked +${quantity} units of ${product.label}. Check console for exact payload.`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1: Quantities */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <label htmlFor="quantity" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Incoming Batch Quantity *
          </label>
          <input
            id="quantity"
            type="number"
            min="1"
            step="any"
            required
            value={quantity || ''}
            onChange={(e) => setQuantity(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none dark:bg-slate-900 dark:border-slate-700 dark:focus:bg-slate-900"
            placeholder="e.g. 50"
          />
          <p className="text-xs text-slate-400 mt-2">
            Projected New Total: <span className="font-bold text-slate-700 dark:text-slate-200">{product.currentStock + quantity}</span> units
          </p>
        </div>

        {/* Step 2: Buying Price */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <label htmlFor="buying_price" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Unit Cost / Buying Price ($) *
          </label>
          <input
            id="buying_price"
            type="number"
            step="0.01"
            required
            value={buyingPrice}
            onChange={(e) => setBuyingPrice(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none dark:bg-slate-900 dark:border-slate-700 dark:focus:bg-slate-900"
          />
          <p className="text-xs text-slate-400 mt-2">
            Total Batch Valuation: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${totalCost.toFixed(2)}</span>
          </p>
        </div>

        {/* Step 3: Base Selling Price update */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <label htmlFor="selling_price" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Active Store Selling Price ($) *
          </label>
          <input
            id="selling_price"
            type="number"
            step="0.01"
            required
            value={sellingPrice}
            onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none dark:bg-slate-900 dark:border-slate-700 dark:focus:bg-slate-900"
          />
          <p className="text-xs text-slate-400 mt-2">
            Current Margin Ratio: <span className="font-semibold text-blue-500">{buyingPrice ? (((sellingPrice - buyingPrice) / buyingPrice) * 100).toFixed(0) : 0}%</span>
          </p>
        </div>
      </div>

      {/* Metadata / Verification Logging Context */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Logistics & Verification</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ref" className="block text-xs font-semibold mb-1">PO / Delivery Reference String</label>
            <input
              id="ref"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO-2026-9921A"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700"
            />
          </div>
          <div>
            <label htmlFor="reason" className="block text-xs font-semibold mb-1">Reason Code Mapping</label>
            <select
              id="reason"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700"
            >
              <option value="SUPPLIER_DELIVERY">Standard Supplier Delivery</option>
              <option value="CONSIGNMENT">Consignment Check-In</option>
              <option value="INTERNAL_TRANSFER">Inbound Branch Transfer</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-xs font-semibold mb-1">Transaction Notes</label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add structural observations (e.g. shelf location, batch expiration dates)..."
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Action Strip */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link 
          href={`/products/${product.id}`}
          className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px] inline-flex items-center dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm min-h-[44px] inline-flex items-center justify-center disabled:opacity-50"
        >
          {isPending ? 'Processing Restock...' : 'Commit Stock to Ledger'}
        </button>
      </div>
    </form>
  );
}