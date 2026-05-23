"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ProductSmartRow } from "@/features/inventory/ProductSmartRow";
import {
  Plus,
  Search,
  PackageSearch,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useProducts } from "@/features/business/hooks/useProducts";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { ProductResponse } from "@/lib/api/generated/models";
import { cn } from "@/lib/utils";

/**
 * @Scribe_Audit
 * Visual Hierarchy: Standardized typography and spacing for clarity.
 * Input Design: Refined search and actions.
 * Integration: Wired ProductSmartRow to optimize presentation layer mechanics.
 */

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
      "px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground select-none",
      className,
    )}
  >
    {children}
  </th>
);

export function InventoryRegistry() {
  const { businessId } = useBusinessContext();
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

  // Hooking the presentation layer edit callbacks to mutation parameters
  const handleEditRedirect = (id: string) => {
    // Navigates directly to the structural edit router canvas
    window.location.href = `/terminal/${businessId}/inventory/${id}`;
  };

  const handleDelete = (id: string) => {
    const targetProduct = products?.find((p) => p.id === id);
    const productName = targetProduct ? targetProduct.label : "Unknown Asset";

    if (confirm(`Delete Product: ${productName}? This action is logged.`)) {
      deleteProduct.mutate(id);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 bg-background font-sans overflow-hidden">
      {/* Visual Context Header */}
      <header className="border-b border-border/80 bg-card/95 px-8 py-6 flex items-center justify-between shrink-0 z-20 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <div className="h-12 w-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary border border-primary/10">
            <PackageSearch size={24} strokeWidth={1.5} />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-3xl font-extrabold tracking-tighter text-foreground leading-none">
              Inventory <span className="text-primary">Registry</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by Label or SKU identifier..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
              className="h-11 w-80 bg-card border border-input rounded-lg pl-10 pr-4 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <Link href={`/terminal/${businessId}/inventory/new`}>
            <button className="h-10 px-5 bg-foreground text-background dark:bg-primary dark:text-primary-foreground rounded-md font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
              <Plus size={14} strokeWidth={3} /> Register Asset
            </button>
          </Link>
        </div>
      </header>

      {/* Main Database Layer */}
      <div className="flex-1 p-8 min-h-0 overflow-hidden flex flex-col">
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          
          {/* Scrollable Viewport Wrapper */}
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full border-collapse text-left table-fixed min-w-[800px]">
              <thead className="bg-muted/50 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
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
                      className="px-6 py-24 text-center text-muted-foreground"
                    >
                      <PackageSearch size={48} className="mx-auto mb-6 opacity-30 text-primary" strokeWidth={1} />
                      <p className="text-base font-semibold tracking-tight">
                        No Database Records Found
                      </p>
                      <p className="text-sm font-medium text-muted-foreground/80 mt-1.5">
                        Adjust your search parameters or register a new asset.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((product) => (
                    // Injected high-performance presentation component mapping response schemas cleanly
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

          {/* Database Footer: Control Interface */}
          <footer className="border-t border-border bg-muted/20 px-6 py-4 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              Showing{" "}
              <span className="text-foreground">
                {paginatedItems.length}
              </span>{" "}
              of{" "}
              <span className="text-foreground">
                {filteredItems.length.toLocaleString()}
              </span>{" "}
              database records
            </span>
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold tracking-tight text-foreground/80 tabular-nums">
                Page {currentPage} of {totalPages || 1}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1 || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="h-9 w-9 rounded-lg border border-input bg-card flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="h-9 w-9 rounded-lg border border-input bg-card flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label="Next Page"
                >
                  <ChevronRight size={18} />
                </button>
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
                <div className="h-4 bg-muted rounded-sm w-1/3" />
                <div className="h-3 bg-muted rounded-sm w-1/5" />
              </div>
              <div className="h-4 bg-muted rounded-sm w-[100px] mr-12" />
              <div className="h-6 bg-muted rounded-md w-[80px] mr-12" />
              <div className="flex gap-2">
                <div className="h-9 w-9 bg-muted rounded-xl" />
                <div className="h-9 w-9 bg-muted rounded-xl" />
              </div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
