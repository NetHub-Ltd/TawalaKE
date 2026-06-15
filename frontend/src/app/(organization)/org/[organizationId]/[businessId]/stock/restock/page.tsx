import RestockForm from '@/features/stock/RestockForm';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Receive New Stock | Inventory System',
  description: 'Log and append inbound items from purchase orders and vendors to track historical cost snapshots.',
  alternates: { canonical: 'https://tawala.nethub.co.ke/products/restock' }
};


interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RestockPage({ params }: PageProps) {
  const { id } = await params;
  
  // Simulated Product State Fetch representing live master state
  const mockProduct = {
    id: id,
    label: "Premium Wireless Headphones",
    currentStock: 42.0,
    currentBuyingPrice: 12.50,
    currentSellingPrice: 24.99
  };

  return (
    <main id="main-content" className="min-h-screen bg-slate-50 p-4 sm:p-8 dark:bg-slate-900 dark:text-slate-100">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6">
          <Link href={`/products/${id}`} className="text-sm font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 dark:text-slate-400 dark:hover:text-slate-200">
            <ArrowLeft className="w-4 h-4" /> Back to Product
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight dark:text-white">
            Receive New Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Target Item: <span className="font-semibold text-slate-800 dark:text-slate-200">{mockProduct.label}</span>
          </p>
        </header>

        <RestockForm product={mockProduct} />
      </div>
    </main>
  );
}