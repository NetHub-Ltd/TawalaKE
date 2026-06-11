// app/products/[id]/audit/page.tsx
import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
// import AuditForm from '../../../components/inventory/AuditForm';
import AuditForm from '@/features/stock/AuditForm'

export const metadata: Metadata = {
  title: 'Stock Balancing & Physical Audit | System',
  description: 'Reconcile digital system records against physical shelf inventory counts to compute layout shrinkage variances.',
  alternates: { canonical: 'https://yourdomain.com/products/audit' }
};

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default async function AuditPage({ params }: PageProps) {
  const { productId } = await params;

  // Mocked core product representation from master table state
  const mockProduct = {
    id: productId,
    label: "Premium Wireless Headphones",
    currentStock: 42.0
  };

  return (
    <main id="main-content" className="min-h-screen bg-slate-50 p-4 sm:p-8 dark:bg-slate-900 dark:text-slate-100">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6">
          <Link href={`/products/${productId}`} className="text-sm font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 dark:text-slate-400 dark:hover:text-slate-200">
            <ArrowLeft className="w-4 h-4" /> Cancel Audit
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight dark:text-white">
            Physical Inventory Audit
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Balancing System for: <span className="font-semibold text-slate-800 dark:text-slate-200">{mockProduct.label}</span>
          </p>
        </header>

        <AuditForm product={mockProduct} />
      </div>
    </main>
  );
}