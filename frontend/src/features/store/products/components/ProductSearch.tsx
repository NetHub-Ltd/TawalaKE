// Parent File Import: components/products/ProductSearchBar.tsx
"use client";

import React, { useState, useEffect, useId } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface ProductSearchBarProps {
  initialValue?: string;
  onSearchChange: (query: string) => void;
  isFetching?: boolean;
  debounceMs?: number;
}

export function ProductSearchBar({
  initialValue = "",
  onSearchChange,
  isFetching = false,
  debounceMs = 300,
}: ProductSearchBarProps) {
  const searchInputId = useId();
  const [searchTerm, setSearchTerm] = useState(initialValue);

  // Synchronize internal state with external query resets
  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  // Debounce search updates to preserve API rate-limits and database performance
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearchChange(searchTerm.trim());
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [searchTerm, debounceMs, onSearchChange]);

  const handleClear = () => {
    setSearchTerm("");
    onSearchChange("");
  };

  return (
    <div className="w-full max-w-lg" role="search">
      <label htmlFor={searchInputId} className="sr-only">
        Search inventory records
      </label>
      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-slate-400">
          {isFetching ? (
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" aria-hidden="true" />
          ) : (
            <Search className="w-5 h-5" aria-hidden="true" />
          )}
        </div>

        <input
          id={searchInputId}
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products by label or category..."
          className="w-full min-h-[44px] pl-11 pr-11 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition-colors shadow-sm"
          autoComplete="off"
          spellCheck="false"
        />

        {searchTerm.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search input"
            className="absolute right-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 rounded-md transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}