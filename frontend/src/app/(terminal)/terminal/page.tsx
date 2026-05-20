"use client";

import {
  Building2,
  ChevronRight,
  Lock,
  Loader2,
  LayoutGrid,
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

  return (
    <section className="h-screen w-full flex flex-col bg-[#F8F9FC] overflow-hidden selection:bg-primary/30">
      <main className="flex-1 w-full mx-auto flex flex-col pt-12 px-6 overflow-hidden">
        
        {/* HERO SECTION */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em]">
              <LayoutGrid size={14} /> Workspace Selector
            </div>
            <h2 className="font-black tracking-tighter uppercase text-slate-900">
              Welcome back, {isLoadingProfile ? "Loading..." : user?.full_name.split(" ")[0]}!
            </h2>
            <p className="text-slate-500 font-medium max-w-md">
              Select a workspace to manage your business operations, view analytics, and access terminal features. Each workspace represents a different business entity under your account.
            </p>
          </div>
        </div>

        {/* WORKSPACE GRID */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-32">
          {isLoadingBusinesses ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-[2rem] border border-dashed border-gray-200">
              <Loader2 className="animate-spin text-primary mb-4" size={32} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Syncing Assets...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {businesses.map((biz) => (
                <Link
                  key={biz.id}
                  href={biz.active ? `/terminal/${biz.id}` : "#"}
                  className={cn(
                    "group relative flex flex-col p-6 rounded-[2rem] transition-all duration-300 bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/30",
                    !biz.active && "opacity-50 grayscale cursor-not-allowed"
                  )}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                      biz.active ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      {biz.active ? <Building2 size={28} /> : <Lock size={28} />}
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors">
                      {biz.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        ID: {biz.id.substring(0, 5)}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-200" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {format(new Date(biz.created_at), "MMM yyyy")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}

              {/* INTEGRATED SELF-CONTAINED CLIENT MODAL ISLAND */}
              <CreateWorkspaceModal />
            </div>
          )}
        </div>
      </main>
    </section>
  );
}