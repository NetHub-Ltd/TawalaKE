// app/components/inventory/AuditForm.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { Scale, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ProductContext {
  id: string;
  label: string;
  currentStock: number;
}

export default function AuditForm({ product }: { product: ProductContext }) {
  const [isPending, startTransition] = useTransition();
  const [physicalCount, setPhysicalCount] = useState<number | ''>('');
  const [reasonCode, setReasonCode] = useState<string>('DATA_ENTRY_ERROR');
  const [notes, setNotes] = useState<string>('');

  // Critical Calculation: Variance Delta logic used to communicate to your backend system
  const variance = physicalCount !== '' ? physicalCount - product.currentStock : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (physicalCount === '') {
      alert('Please enter a valid physical count number.');
      return;
    }

    const payload = {
      business_id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      performed_by: "ca7b3a11-8231-4a1e-8133-72bb9443216c", 
      items: [
        {
          product_id: product.id,
          movement_type: "RECONCILIATION",
          quantity: Number(variance), // The calculated safe delta (+ or -)
          buying_price: null,
          selling_price: null,
          reference_type: "MANUAL_AUDIT",
          reference_id: null,
          reason_code: reasonCode,
          notes: notes || null
        }
      ]
    };

    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.log('📋 [Backend Payload Sent] -> POST /api/v1/inventory/transactions', JSON.stringify(payload, null, 2));
      alert(`Reconciliation complete! System variance adjusted by ${variance} units. Check code execution console.`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System State vs Physical Realization Entry Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-800 dark:border-slate-700">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Theoretical Expected System Stock</span>
            <span className="text-2xl font-mono font-bold text-slate-700 dark:text-slate-300">{product.currentStock} Units</span>
          </div>

          <div>
            <label htmlFor="physical_count" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Actual Count Found On Shelf *
            </label>
            <input
              id="physical_count"
              type="number"
              required
              value={physicalCount}
              onChange={(e) => setPhysicalCount(e.target.value !== '' ? parseFloat(e.target.value) : '')}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none dark:bg-slate-900 dark:border-slate-700 dark:focus:bg-slate-900"
              placeholder="Enter observed number"
            />
          </div>
        </div>

        {/* Live Computational Audit Variance Indicator */}
        <div className={`p-6 rounded-xl border flex flex-col justify-between transition-colors ${
          variance === 0 
            ? 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-400' 
            : variance > 0
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400'
              : 'bg-rose-50/50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400'
        }`}>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Calculated System Discrepancy Variance</span>
            <span className="text-4xl font-black font-mono block mt-1">
              {variance > 0 ? `+${variance}` : variance}
            </span>
          </div>

          {variance !== 0 && (
            <div className="flex items-start gap-2 text-xs mt-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {variance < 0 
                  ? 'Warning: Submission logs negative shrinkage context. This acts as a standard inventory inventory correction deduction adjustment.' 
                  : 'Notice: This creates an incoming positive adjustment entry on your centralized ledger.'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Audit Meta Context Form Rows */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Reconciliation Reason Mapping</h3>
        
        <div>
          <label htmlFor="reason" className="block text-xs font-semibold mb-1">Primary Reason Discrepancy Code *</label>
          <select
            id="reason"
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700"
          >
            <option value="DATA_ENTRY_ERROR">Human Data Entry Error (Correction)</option>
            <option value="STOCK_DAMAGE">Physical Damage / Spoilage</option>
            <option value="THEFT_SHRINKAGE">Unexplained Shrinkage / Theft</option>
            <option value="FOUND_ITEM">Misplaced Stock Recovered</option>
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-xs font-semibold mb-1">Human Sign-off Explanatory Notes</label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe findings during count (e.g. Broken packaging discovered behind pallet row 4)..."
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg dark:bg-slate-900 dark:border-slate-700"
          />
        </div>
      </div>

      {/* Button Tray */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link 
          href={`/products/${product.id}`}
          className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px] inline-flex items-center dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending || physicalCount === ''}
          className="px-5 py-2 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all shadow-sm min-h-[44px] inline-flex items-center justify-center disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
        >
          {isPending ? 'Processing Adjustment...' : 'Authorize Balance Correction'}
        </button>
      </div>
    </form>
  );
}