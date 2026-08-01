// Parent File Import: src/features/business/components/InventoryRegistry.tsx
// File Path: src/features/store/products/components/ProductSearchBar.tsx

"use client";

import React, { useState, useEffect, useId } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductSearchBarProps {
  /** Callback executed with the trimmed, debounced query string ready for backend execution */
  onSearch: (debouncedQuery: string) => void;
  /** Initial query value when mounted */
  defaultValue?: string;
  /** Optional controlled external query string */
  value?: string;
  /** Visual indicator matching React Query's `isFetching` state */
  isFetching?: boolean;
  /** Custom accessible placeholder text */
  placeholder?: string;
  /** Debounce latency threshold in milliseconds (defaults to 300ms) */
  debounceMs?: number;
  /** Additional Tailwind CSS style overrides for container wrapper */
  className?: string;
}

/**
 * Decoupled, highly accessible search bar component designed for data tables and list views.
 * Handles instant local UI input responsiveness while debouncing database query execution.
 */
export function ProductSearchBar({
  onSearch,
  defaultValue = "",
  value: controlledValue,
  isFetching = false,
  placeholder = "Search database by name, category, or SKU...",
  debounceMs = 300,
  className,
}: ProductSearchBarProps) {
  const inputId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);

  // Synchronize controlled external value state if supplied
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Shield database & backend rate limits using internal debounce timing
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(internalValue.trim());
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [internalValue, debounceMs, onSearch]);

  const handleClear = () => {
    setInternalValue("");
    onSearch("");
  };

  return (
    <div className={cn("relative w-full sm:w-[320px]", className)}>
      <label htmlFor={inputId} className="sr-only">
        {placeholder}
      </label>

      {/* Dynamic Status Icon / Spinner */}
      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted">
        {isFetching && internalValue.trim() ? (
          <Loader2
            size={14}
            className="animate-spin text-brand-primary"
            aria-label="Executing backend database query..."
          />
        ) : (
          <Search size={14} />
        )}
      </span>

      {/* Input Field */}
      <input
        id={inputId}
        type="search"
        placeholder={placeholder}
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        className="w-full min-h-[44px] pl-10 pr-10 bg-card border border-border rounded-lg text-xs font-medium text-foreground placeholder-muted/60 focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary transition-all"
        autoComplete="off"
        spellCheck="false"
      />

      {/* Clear Action Button */}
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear database search query"
          className="absolute inset-y-0 right-0 flex items-center justify-center min-h-[44px] min-w-[44px] text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}