"use client";

import React from "react";
import { Loader2 } from "lucide-react";

/**
 * LoadingScreen: Performance-first tokenized transition state.
 * Uses hardware-accelerated backdrop filters and native variables to achieve a modern frosted look.
 */
const LoadingScreen = () => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface/60 backdrop-blur-md transition-all"
    >
      <div className="flex flex-col items-center gap-5">
        
        {/* Hardware-accelerated Spinner Canvas */}
        <div className="relative flex items-center justify-center">
          
          {/* Outer Ambient Glow Ring */}
          <div 
            className="absolute h-14 w-14 rounded-full border-2 border-brand-primary/10 border-t-brand-primary/40 animate-spin"
            style={{ animationDuration: "1.2s" }}
            aria-hidden="true" 
          />
          
          {/* Inner High-Precision Core Icon */}
          <Loader2
            className="h-8 w-8 animate-spin text-brand-primary"
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>

        {/* Status Message matching Global Typography Token Matrix */}
        <div className="text-center space-y-1">
          <p className="text-base font-bold tracking-tight text-foreground animate-pulse">
            Loading Station
          </p>
          <p className="text-[11px] font-bold text-muted uppercase tracking-widest block font-mono">
            Securing Connection Matrix
          </p>
        </div>
      </div>

      {/* Screen Reader Access Layer */}
      <span className="sr-only">Loading secure business terminal, please wait.</span>
    </div>
  );
};

export default LoadingScreen;