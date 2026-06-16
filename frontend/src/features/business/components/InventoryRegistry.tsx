"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ProductSmartRow } from "@/features/inventory/ProductSmartRow";
import { Button } from "@/lib/components/ui/Button";
import {
  Plus,
  PackageSearch,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useProducts } from "@/features/business/hooks/useProducts";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { cn } from "@/lib/utils";

// Localizing TableHeader for alignment synchronization
const TableHeaderCell = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <th
    className={cn(
      "px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted select-none",
      className,
    )}
  >
    {children}
  </th>
);

export function InventoryRegistry() {
  const { businessId, organizationId } = useBusinessContext();
  const { products, isLoading, deleteProduct } = useProducts(
    businessId as string,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredItems = useMemo(() => {
    if (!products) return [];
    return products.filter(
      (p) =>
        p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.attributes?.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [products, searchQuery]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handleEditRedirect = (id: string) => {
    window.location.href = `/org/${organizationId}/${businessId}/inventory/${id}`;
  };

  const handleDelete = (id: string) => {
    const targetProduct = products?.find((p) => p.id === id);
    const productName = targetProduct ? targetProduct.label : "Unknown Asset";

    if (confirm(`Delete Product: ${productName}? This action is logged.`)) {
      deleteProduct.mutate(id);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 font-sans overflow-hidden">
      
      {/* Header Panel Surface Container */}
      <header className="border-b border-border/80 bg-card/95 px-8 py-4 flex items-center justify-between shrink-0 z-20 backdrop-blur-xs">
        <div className="flex items-center gap-4">
          <Link href={`/org/${organizationId}/${businessId}/stock/audit`} passHref legacyBehavior>
            <Button variant="primary" size="sm">
              <Plus size={14} strokeWidth={3} className="shrink-0" /> 
              <span>Audit Stock</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Database Layer */}
      <div className="flex-1 p-8 min-h-0 overflow-hidden flex flex-col">
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
          
          {/* Scrollable Viewport Table */}
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full border-collapse text-left table-fixed min-w-[800px]">
              <thead className="bg-background/40 border-b border-border sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  <TableHeaderCell className="min-w-[300px]">
                    Product Details
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[180px] text-right">
                    Selling Price
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[200px]">
                    Stock
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[140px] text-right">
                    Actions
                  </TableHeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <SkeletonRows />
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-24 text-center text-muted"
                    >
                      <PackageSearch size={48} className="mx-auto mb-4 opacity-30 text-brand-primary" strokeWidth={1} />
                      <h3 className="uppercase tracking-tight text-foreground font-bold">
                        No Database Records Found
                      </h3>
                      <p className="text-muted mt-1 text-xs">
                        Adjust your search parameters or register a new asset entry.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((product) => (
                    <ProductSmartRow
                      key={product.id}
                      product={product}
                      onEdit={handleEditRedirect}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Navigation Panel */}
          <footer className="border-t border-border bg-background/30 px-6 py-4 flex items-center justify-between shrink-0">
            <span className="text-xs font-medium text-muted tabular-nums">
              Showing{" "}
              <span className="text-foreground font-bold">
                {paginatedItems.length}
              </span>{" "}
              of{" "}
              <span className="text-foreground font-bold">
                {filteredItems.length.toLocaleString()}
              </span>{" "}
              database records
            </span>
            
            <div className="flex items-center gap-4">
              <div className="text-xs font-bold tracking-tight text-foreground tabular-nums">
                Page {currentPage} of {totalPages || 1}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1 || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="w-10 !px-0"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="w-10 !px-0"
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

function SkeletonRows() {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td colSpan={4} className="px-6 py-4 h-[68px] border-b border-border/70 align-middle">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted/20 rounded-xs w-1/3" />
                <div className="h-3 bg-muted/20 rounded-xs w-1/5" />
              </div>
              <div className="h-4 bg-muted/20 rounded-xs w-[100px] mr-12" />
              <div className="h-6 bg-muted/20 rounded-xs w-[80px] mr-12" />
              <div className="flex gap-2">
                <div className="h-10 w-10 bg-muted/20 rounded-xl" />
                <div className="h-10 w-10 bg-muted/20 rounded-xl" />
              </div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}