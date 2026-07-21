"use client";

import React, { useState, useEffect, useId } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductSmartRow } from "@/features/inventory/ProductSmartRow";
import { Button } from "@/lib/components/ui/Button";
import {
  Plus,
  PackageSearch,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  RotateCw,
} from "lucide-react";
import { useProducts } from "@/features/store/products/hooks/useProducts";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { ProductSearchBar } from "@/features/store/products/components/ProductSearchBar";
import { cn } from "@/lib/utils";

interface SortState {
  column: string | null;
  direction: "asc" | "desc";
}

interface TableHeaderCellProps {
  children: React.ReactNode;
  className?: string;
  sortKey?: string;
  currentSort?: SortState;
  onSort?: (key: string) => void;
}

const TableHeaderCell = ({
  children,
  className,
  sortKey,
  currentSort,
  onSort,
}: TableHeaderCellProps) => {
  const isSortable = Boolean(sortKey && onSort && currentSort);
  const isActive = isSortable && currentSort?.column === sortKey;

  const ariaSortValue = isActive
    ? currentSort?.direction === "asc"
      ? "ascending"
      : "descending"
    : isSortable
    ? "none"
    : undefined;

  const handleSortClick = () => {
    if (isSortable && sortKey && onSort) {
      onSort(sortKey);
    }
  };

  return (
    <th
      scope="col"
      aria-sort={ariaSortValue}
      onClick={isSortable ? handleSortClick : undefined}
      className={cn(
        "px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted select-none whitespace-nowrap align-middle",
        isSortable && "cursor-pointer hover:text-foreground transition-colors group",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 min-h-[24px]",
          className?.includes("text-right") && "justify-end"
        )}
      >
        <span>{children}</span>
        {isSortable && (
          <span className="text-muted/50 group-hover:text-muted transition-colors" aria-hidden="true">
            {!isActive && <ArrowUpDown size={12} />}
            {isActive && currentSort?.direction === "asc" && (
              <ArrowUp size={12} className="text-brand-primary" />
            )}
            {isActive && currentSort?.direction === "desc" && (
              <ArrowDown size={12} className="text-brand-primary" />
            )}
          </span>
        )}
      </div>
    </th>
  );
};

export function InventoryRegistry() {
  const router = useRouter();
  const limitSelectId = useId();
  const { businessId, organizationId } = useBusinessContext();

  // Local State Matrix for UI Controls & Query Filters
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sort, setSort] = useState<SortState>({ column: "created_at", direction: "desc" });

  // Reset pagination offset on query or page-size adjustments to prevent out-of-bounds empty states
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, itemsPerPage]);

  // Server-paginated & server-searched useProducts hook
  const { products, pagination, isLoading, isFetching, deleteProduct, refresh } = useProducts(
    businessId as string,
    undefined,
    currentPage,
    itemsPerPage,
    sort.column || undefined,
    sort.direction,
    debouncedSearch
  );

  const totalRecords = pagination?.total || 0;
  const totalPages = pagination?.pages || 1;

  const handleSort = (columnKey: string) => {
    setSort((prev) => {
      if (prev.column === columnKey) {
        return {
          column: columnKey,
          direction: prev.direction === "desc" ? "asc" : "desc",
        };
      }
      return { column: columnKey, direction: "desc" };
    });
    setCurrentPage(1);
  };

  const handleEditRedirect = (id: string) => {
    router.push(`/org/${organizationId}/${businessId}/inventory/${id}`);
  };

  const handleDelete = (id: string) => {
    const targetProduct = products?.find((p) => p.id === id);
    const productName = targetProduct ? targetProduct.label : "Unknown Asset";

    if (window.confirm(`Delete Product: "${productName}"? This action is logged.`)) {
      deleteProduct.mutate(id);
    }
  };

  return (
    <main id="main-content" className="flex-1 flex flex-col h-full font-sans overflow-hidden">
      
      {/* Header & Primary Actions */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black uppercase tracking-wider text-foreground">
              Inventory Registry
            </h1>
            {isFetching && !isLoading && (
              <Loader2 size={14} className="animate-spin text-brand-primary" aria-label="Syncing backend records..." />
            )}
          </div>
          <p className="text-xs text-muted font-medium">Distribution node counts & stock monitoring.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={isFetching}
            className="min-h-[44px] min-w-[44px] px-3 gap-2 text-xs font-bold"
            aria-label="Refresh inventory dataset"
          >
            <RotateCw size={14} className={cn(isFetching && "animate-spin")} />
            <span className="hidden sm:inline">Sync</span>
          </Button>

          <Link href={`/org/${organizationId}/${businessId}/inventory/new`} passHref legacyBehavior>
            <a className="inline-flex min-h-[44px] items-center gap-2 px-4 bg-brand-secondary text-background hover:scale-[1.01] active:scale-100 rounded-lg text-xs font-bold transition-all shadow-xs whitespace-nowrap focus:outline-hidden focus:ring-2 focus:ring-brand-primary">
              <Plus size={16} strokeWidth={3} className="shrink-0" />
              <span>Add New Product</span>
            </a>
          </Link>
        </div>
      </header>

      {/* Database Viewport Frame */}
      <section aria-label="Inventory Records Matrix" className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden flex flex-col flex-1 min-h-0">
          
          {/* Integrated Header Controls (Decoupled Search Component & Page Size Selector) */}
          <div className="bg-background/50 border-b border-border/80 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 z-20 backdrop-blur-xs">
            
            {/* Plugged-in Autonomous ProductSearchBar */}
            <ProductSearchBar
              onSearch={setDebouncedSearch}
              isFetching={isFetching}
              placeholder="Search database by name, category, or SKU..."
            />

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <label htmlFor={limitSelectId} className="text-[11px] font-bold uppercase tracking-wider text-muted whitespace-nowrap">
                Show:
              </label>
              <select
                id={limitSelectId}
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="min-h-[44px] rounded-md border border-border bg-card py-1 px-3 text-xs font-semibold text-foreground shadow-2xs focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary cursor-pointer"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} rows
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto scroll-smooth min-h-0">
            <table className="w-full border-collapse text-left table-fixed min-w-[800px]">
              <thead className="bg-background/20 border-b border-border/80 sticky top-0 z-10 backdrop-blur-xs">
                <tr>
                  <TableHeaderCell 
                    className="min-w-[300px]"
                    sortKey="label"
                    currentSort={sort}
                    onSort={handleSort}
                  >
                    Product Details
                  </TableHeaderCell>
                  <TableHeaderCell 
                    className="w-[180px] text-right"
                    sortKey="selling_price"
                    currentSort={sort}
                    onSort={handleSort}
                  >
                    Selling Price
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[200px]">
                    Stock Status
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[140px] text-right">
                    Actions
                  </TableHeaderCell>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <SkeletonRows rows={itemsPerPage > 10 ? 10 : itemsPerPage} />
                ) : products.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-20 text-center text-muted"
                    >
                      <PackageSearch size={40} className="mx-auto mb-3 opacity-30 text-brand-primary" strokeWidth={1.5} />
                      <h2 className="uppercase tracking-wider text-xs text-foreground font-bold">
                        No Assets Match Criteria
                      </h2>
                      <p className="text-muted mt-1 text-[11px]">
                        {debouncedSearch
                          ? `No records matching "${debouncedSearch}" were found in the database.`
                          : "Modify filters or append a new asset catalog token above."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
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

          {/* Table Footer Navigation */}
          <footer className="border-t border-border/80 bg-background/30 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-xs font-medium text-muted tabular-nums">
              Showing{" "}
              <span className="text-foreground font-bold">
                {products.length}
              </span>{" "}
              of{" "}
              <span className="text-foreground font-bold">
                {totalRecords}
              </span>{" "}
              records
            </span>
            
            <div className="flex items-center gap-4">
              <div className="text-xs font-bold tracking-tight text-foreground tabular-nums">
                Page {currentPage} of {totalPages}
              </div>
              
              <nav aria-label="Pagination Navigation" className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1 || totalPages === 0 || isFetching}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="min-h-[44px] min-w-[44px] !px-0 flex items-center justify-center"
                  aria-label="Go to previous page"
                >
                  <ChevronLeft size={16} />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0 || isFetching}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="min-h-[44px] min-w-[44px] !px-0 flex items-center justify-center"
                  aria-label="Go to next page"
                >
                  <ChevronRight size={16} />
                </Button>
              </nav>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}

function SkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td colSpan={4} className="px-6 py-4 h-[64px] border-b border-border/40 align-middle">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-muted/20 rounded-sm w-1/4" />
                <div className="h-2.5 bg-muted/15 rounded-sm w-1/6" />
              </div>
              <div className="h-3.5 bg-muted/20 rounded-sm w-[80px] mr-16" />
              <div className="h-5 bg-muted/20 rounded-sm w-[90px] mr-16" />
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-muted/20 rounded-md" />
                <div className="h-8 w-8 bg-muted/20 rounded-md" />
              </div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}