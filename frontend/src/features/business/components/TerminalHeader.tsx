"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, User, Search } from "lucide-react";

interface TerminalHeaderProps {
  businessName: string;
}

export function TerminalHeader({ businessName }: TerminalHeaderProps) {
  const router = useRouter();

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 z-[60] shrink-0">
      <div className="flex items-center gap-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-muted text-secondary hover:text-foreground transition-all group"
          aria-label="Go back"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
        </button>

        <div className="flex flex-col">
          <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary leading-none mb-1">
            {businessName}
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">
              Terminal_01 // Online
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center bg-muted/50 rounded-2xl px-4 py-2 gap-3 mr-2 border border-transparent focus-within:border-primary/20 transition-all">
          <Search size={14} className="text-secondary" />
          <input
            type="text"
            placeholder="Search orders..."
            className="bg-transparent border-none outline-none text-[11px] font-medium w-40 placeholder:text-secondary/50"
          />
        </div>

        <button className="p-3 rounded-2xl hover:bg-muted text-secondary relative transition-colors">
          <Bell size={20} />
          <span className="absolute top-3 right-3 h-2 w-2 bg-primary rounded-full border-2 border-card" />
        </button>

        <div className="h-8 w-px bg-border mx-1" />

        <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-muted transition-colors">
          <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block text-secondary">
            Operator
          </span>
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <User size={18} />
          </div>
        </button>
      </div>
    </header>
  );
}
