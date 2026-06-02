"use client";

import {
  Store,
  ChevronRight,
  Lock,
  Loader2,
  Sparkles,
  ShieldCheck,
  PlusCircle,
  Heart,
  Smile
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTenantProfile } from "@/features/auth/hooks/useTenant";
import { useBusiness } from "@/features/business/hooks/useBusiness";
import CreateWorkspaceModal from "@/features/business/components/CreateWorkspaceModal";

export default function TerminalSwitchboard() {
  const { data: user, isLoading: isLoadingProfile } = useTenantProfile();
  const { businesses, isLoading: isLoadingBusinesses } = useBusiness();

  // Dynamically compute open/active stores
  const activeCount = businesses.filter(b => b.active).length;

  return (
    <section className="h-screen w-full flex flex-col bg-[#fafbfc] text-[#2d3142] overflow-hidden relative selection:bg-primary/20">
      
      <main className="flex-1 w-full mx-auto flex flex-col pt-10 pb-6 px-8 overflow-hidden relative z-10">
        
        {/* --- HUMAN-CENTRIC WELCOME & LIVE METRIC STRIP --- */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 shrink-0">

          {/* Real-time Humanized Branch/Tenant Metrics Tracker */}
          <div className="flex items-center gap-5 bg-white border border-slate-100 p-3 rounded-2xl shadow-soft self-start lg:self-center">
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-600 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck size={14} className="shrink-0" />
              <span>{activeCount} Active Storefronts</span>
            </div>
            <div className="text-xs font-bold text-[#7d859a] pr-2">
              Total Locations: <span className="text-[#1e2229] tabular-nums">{businesses.length}</span>
            </div>
          </div>
        </div>

        {/* --- ACTIVE BUSINESS SHOPS SWITCHBOARD GRID --- */}
        {/* Keeps vertical scroll locked strictly to the inner list boundary container, avoiding parent overflow */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
          {isLoadingBusinesses ? (
            <div className="flex flex-col items-center justify-center h-full max-h-[400px] bg-white border border-dashed border-slate-200 rounded-[2rem] p-8 text-center space-y-3">
              <div className="h-12 w-12 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#7d859a]">
                Gathering your latest biashara updates securely...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
              {businesses.map((biz) => (
                <Link
                  key={biz.id}
                  href={biz.active ? `/org/${biz.tenant_id}/terminal/${biz.id}` : "#"}
                  className={cn(
                    "group relative flex flex-col p-6 rounded-[2rem] transition-all duration-300 bg-white border border-slate-100 shadow-soft hover:border-primary/30 hover:shadow-md",
                    !biz.active && "opacity-45 grayscale cursor-not-allowed hover:border-slate-100 hover:shadow-soft"
                  )}
                >
                  {/* Gentle Gradient Reveal Pattern on active hover */}
                  {biz.active && (
                    <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
                  )}

                  <div className="flex justify-between items-start mb-10 z-10">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center border transition-all duration-300",
                      biz.active 
                        ? "bg-white border-slate-100 text-primary group-hover:bg-primary group-hover:text-white group-hover:border-transparent group-hover:shadow-sm" 
                        : "bg-[#fafbfc] border-transparent text-slate-400"
                    )}>
                      {biz.active ? <Store size={22} className="transition-transform duration-200 group-hover:scale-105" /> : <Lock size={18} />}
                    </div>
                    {biz.active ? (
                      <div className="h-7 w-7 rounded-full bg-[#fafbfc] border border-slate-100 flex items-center justify-center transition-all duration-200 group-hover:bg-primary/5 group-hover:border-primary/10">
                        <ChevronRight size={15} className="text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md text-slate-400">Locked Access</span>
                    )}
                  </div>

                  <div className="z-10 mt-auto space-y-1.5">
                    <h3 className="text-lg font-black text-[#1e2229] tracking-tight group-hover:text-primary transition-colors">
                      {biz.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-[#7d859a]">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#fafbfc] px-2 py-0.5 rounded-md border border-slate-100/60 font-mono">
                        ID: {biz.id.substring(0, 5)}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-200" aria-hidden="true" />
                      <span className="text-[11px] font-medium">
                        Since {format(new Date(biz.created_at), "MMM yyyy")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {/* INTEGRATED INLINE MODAL TRIGGER ISLAND */}
              <CreateWorkspaceModal />
            </div>
          )}
        </div>
      </main>
    </section>
  );
}