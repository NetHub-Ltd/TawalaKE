// src/app/products/[id]/restock/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RestockFormWrapper } from '@/features/stock/RestockFormWrapper';

export const metadata: Metadata = {
  title: 'Receive New Stock | Inventory System',
  description: 'Log and append inbound items from purchase orders and vendors to track historical cost snapshots.',
  alternates: { canonical: 'https://tawala.nethub.co.ke/products/restock' }
};

interface PageProps {
  params: Promise<{ businessId: string, organizationId: string }>;
}

export default async function RestockPage({ params }: PageProps) {
  const { businessId, organizationId } = await params;
  
  // 2. Automated Structured Data Schema Injection for Crawler Indexing Engine Optimization
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Products",
        "item": `https://tawala.nethub.co.ke/products`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Restock",
        "item": `https://tawala.nethub.co.ke/org/${organizationId}/${businessId}/stock/restock`
      }
    ]
  };

  return (
    <>
      {/* Structural Inject for Search Spiders */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main id="main-content" className="">
        <div className="w-full mx-auto">
          
          {/* Navigation Controls Context */}
          <nav className="mb-6" aria-label="Back Navigation Links Path">
            <Link 
              href={`/org/${organizationId}/${businessId}/inventory`} 
              className="text-sm font-medium text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary/40 rounded px-1.5 py-1 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Product
            </Link>
          </nav>

          {/* Render the interactive Client form wrapper holding hook states */}
          <RestockFormWrapper businessId={businessId} />
        </div>
      </main>
    </>
  );
}