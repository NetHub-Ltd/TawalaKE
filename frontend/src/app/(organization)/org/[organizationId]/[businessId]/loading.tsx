"use client";

import React from "react";
import { Loader2 } from "lucide-react";

/**
 * LoadingScreen: Performance-first transition state.
 * Optimized to minimize Main Thread work by avoiding JS-heavy animation libraries.
 */
const LoadingScreen = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-white dark:bg-slate-950"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner: Uses hardware-accelerated CSS animations */}
        <div className="relative animate-in fade-in zoom-in duration-300">
          <Loader2
            className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>

        {/* Text: Delayed fade-in via CSS to prevent flicker on fast loads */}
        <p className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 text-sm font-medium tracking-tight text-slate-600 dark:text-slate-300">
          Securing your connection...
        </p>
      </div>

      {/* Screen Reader Only */}
      <span className="sr-only">Loading content, please wait.</span>
    </div>
  );
};

export default LoadingScreen;
