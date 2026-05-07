"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  User,
  Search,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";

interface TerminalHeaderProps {
  businessName: string;
}

/**
 * @Scribe_Audit
 * UI/UX: Softened aesthetics using 2xl/3xl radii and subtle backgrounds.
 * Navigation: Added explicit 'Switch Workspace' trigger for context switching.
 * Performance: Minimal client-side logic; purely functional triggers.
 */

export function TerminalHeader({ businessName }: TerminalHeaderProps) {
  const router = useRouter();

  return (
    <header className="h-20 border-b border-border/40 bg-card/60 backdrop-blur-xl flex items-center justify-between px-8 z-[60] shrink-0 mb-1">
      <div className="flex items-center gap-8">
        {/* Workspace Switcher Button */}
        <button
          onClick={() => router.push("/terminal")}
          className="flex items-center gap-3 px-4 py-2.5 bg-muted/40 hover:bg-muted rounded-2xl transition-all group border border-border/20 shadow-sm"
          aria-label="Switch business context"
        >
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <LayoutGrid size={16} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary leading-none mb-1">
              Workspace
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Switch</span>
              <ChevronDown size={12} className="text-secondary opacity-50" />
            </div>
          </div>
        </button>

        <div className="h-8 w-px bg-border/40" />

        {/* Business Identity */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="h-10 w-10 flex items-center justify-center rounded-2xl bg-background border border-border/30 hover:border-primary/30 text-secondary hover:text-primary transition-all shadow-sm group"
            aria-label="Go back"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
          </button>

          <div className="flex flex-col">
            <h1 className="text-xs font-black uppercase tracking-[0.2em] text-foreground leading-none mb-1.5">
              {businessName}
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-[10px] font-bold text-secondary/70 uppercase tracking-tighter">
                Terminal_01 <span className="mx-1 opacity-30">//</span> Online
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Soft Search Bar */}
        <div className="hidden lg:flex items-center bg-muted/30 rounded-2xl px-5 py-2.5 gap-3 border border-border/10 focus-within:border-primary/20 focus-within:bg-muted/50 transition-all w-72 shadow-inner">
          <Search size={14} className="text-secondary/60" />
          <input
            type="text"
            placeholder="Search orders, SKU..."
            className="bg-transparent border-none outline-none text-xs font-medium w-full placeholder:text-secondary/40"
          />
        </div>

        {/* Notification Bell */}
        <button className="h-11 w-11 flex items-center justify-center rounded-2xl bg-muted/40 hover:bg-muted text-secondary relative transition-all border border-transparent hover:border-border/40">
          <Bell size={20} strokeWidth={2} />
          <span className="absolute top-3 right-3 h-2.5 w-2.5 bg-primary rounded-full border-2 border-card" />
        </button>

        <div className="h-8 w-px bg-border/40 mx-1" />

        {/* Operator Profile */}
        <button className="flex items-center gap-4 p-1.5 pr-4 rounded-2xl bg-muted/20 hover:bg-muted/40 border border-border/10 transition-all group">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary shadow-sm group-hover:scale-105 transition-transform">
            <User size={20} />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary leading-none mb-1">
              Operator
            </p>
            <p className="text-xs font-bold text-foreground">D. Karanja</p>
          </div>
        </button>
      </div>
    </header>
  );
}