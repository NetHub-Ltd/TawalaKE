// src/app/not-found.tsx
"use client";

import React from "react";
import Link from "next/link";
import { HelpCircle, ArrowLeft, Radio, Orbit } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-6 select-none antialiased">
      <div className="max-w-md w-full bg-card border border-border/60 rounded-4xl p-8 md:p-10 shadow-xl text-center relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-border/80 group">
        
        {/* Playful Background Decorative Ambient Rings */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-primary/5 rounded-full blur-xl pointer-events-none group-hover:bg-brand-primary/10 transition-colors" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-accent/5 rounded-full blur-xl pointer-events-none group-hover:bg-brand-accent/10 transition-colors" />

        {/* Tactile/Dynamic Icon Stack */}
        <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
          {/* Animated Outer Pulse Ring */}
          <div className="absolute inset-0 rounded-full bg-brand-primary/10 border border-brand-primary/20 animate-ping opacity-40 [animation-duration:3s]" />
          
          {/* Main Visual Frame Container */}
          <div className="w-20 h-20 bg-background border-2 border-dashed border-border rounded-full flex items-center justify-center text-brand-primary relative shadow-md transition-transform duration-500 group-hover:rotate-12">
            <Radio className="w-8 h-8 animate-pulse [animation-duration:2s]" />
            <Orbit className="w-12 h-12 absolute text-brand-secondary/40 animate-spin [animation-duration:8s]" />
          </div>
          
          {/* Little floating question mark badge */}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-secondary text-background font-black rounded-xl flex items-center justify-center border-2 border-card text-xs shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12">
            <HelpCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Semantic Typography Block Header */}
        <div className="space-y-3 mb-8">
          <span className="text-xs font-mono font-black text-brand-secondary bg-brand-secondary/10 px-3 py-1 rounded-full uppercase tracking-widest border border-brand-secondary/20 inline-block">
            Error 404
          </span>
          <h1 className="text-2xl font-black tracking-tight text-foreground leading-tight">
            Node Connection Lost
          </h1>
          <p className="text-sm font-medium text-muted max-w-sm mx-auto leading-relaxed">
            The operational ledger or pipeline view matrix path you requested could not be resolved by the network hub ecosystem context.
          </p>
        </div>

        {/* Action Controls Router Redirect Section */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border border-border bg-background text-foreground hover:bg-surface/50 active:scale-98 transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Go Back
          </button>
          
          <Link
            href="/org"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider rounded-xl bg-brand-primary text-background hover:scale-[1.02] active:scale-100 transition-all shadow-md shadow-brand-primary/10 cursor-pointer"
          >
            Return to Hub
          </Link>
        </div>

        {/* Subtle Node Baseline Status Signature Footer */}
        <div className="mt-8 pt-6 border-t border-dashed border-border/60 flex items-center justify-center gap-2 text-[10px] font-mono font-bold text-muted uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
          Tawala Decentralized Registry
        </div>

      </div>
    </main>
  );
}