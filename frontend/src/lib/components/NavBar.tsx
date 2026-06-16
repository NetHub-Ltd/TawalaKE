import React from "react";
import Link from "next/link";
import { Button } from "@/lib/components/ui/Button";

export default function NavBar() {
  return (
    <nav className="w-full flex items-center justify-between py-2 border-b border-border/40 relative z-50">
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="h-9 w-9 rounded-xl bg-brand-primary flex items-center justify-center font-black text-white text-sm shadow-md shadow-brand-primary/20 transition-all group-hover:bg-brand-primary/90">
          TW
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm tracking-tight text-foreground leading-none">
            Tawala Enterprise
          </span>
          <span className="text-[10px] font-bold tracking-widest text-muted uppercase mt-0.5 leading-none">
            Operational Hub
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-4">
        <Link href="#features" className="hidden sm:inline-block text-xs font-bold text-muted hover:text-foreground transition-colors uppercase tracking-wider">
          Features
        </Link>
        <Link href="#pricing" className="hidden sm:inline-block text-xs font-bold text-muted hover:text-foreground transition-colors uppercase tracking-wider">
          Pricing
        </Link>
        <Link href="/org">
          <Button variant="primary" size="sm" className="shadow-xs font-bold text-[10px]">
            Start Free Trial
          </Button>
        </Link>
      </div>
    </nav>
  );
}