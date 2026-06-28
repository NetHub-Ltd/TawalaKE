import React from "react";
import Link from "next/link";
import { Button } from "@/lib/components/ui/Button";

/**
 * NavBar - High-Performance Corporate Navigation System
 * Enhanced to "pop" using your dynamic CSS tokens and text-gradient utility.
 */
export default function NavBar() {
  return (
    <nav 
      aria-label="Main Corporate Navigation" 
      className="w-full h-20 flex items-center justify-between relative z-50 select-none"
    >
      {/* BRAND ARCHITECTURE LOGO NODE */}
      <Link 
        href="/" 
        className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-xl"
        aria-label="Tawala Enterprise Home"
      >
        {/* Logo Badge featuring smooth dimensional scale transition */}
        <div className="h-10 w-10 rounded-xl bg-linear-to-r from-brand-primary to-brand-secondary flex items-center justify-center font-black text-white text-xs shadow-xs transition-transform duration-300 group-hover:scale-105">
          TW
        </div>
        <div className="flex flex-col">
          {/* Utilizing your signature text-gradient utility to make the brand name pop */}
          <span className="font-black text-sm tracking-tight leading-none uppercase text-gradient">
            Tawala Enterprise
          </span>
          <span className="text-[9px] font-mono font-black tracking-widest text-brand-secondary uppercase mt-1 leading-none">
            Operational Hub
          </span>
        </div>
      </Link>

      {/* MID-REGION: INTERACTIVE STRUCTURAL LINKS WITH MICRO-ANIMATIONS */}
      <div className="flex items-center gap-8 font-sans">
        {[
          { name: "Solutions", path: "/features" },
          { name: "Pricing", path: "/billing" },
          { name: "Support", path: "/support" }
        ].map((link) => (
          <Link 
            key={link.name}
            href={link.path} 
            className="relative text-xs font-bold text-muted hover:text-brand-primary transition-colors uppercase tracking-wider py-1 group/link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-md"
          >
            {link.name}
            {/* Sliding structural accent bar providing zero-CLS visual feedback */}
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand-secondary transition-all duration-300 ease-out group-hover/link:w-full" />
          </Link>
        ))}
      </div>

      {/* RIGHT-REGION: HIGH-CONVERSION AUTHENTICATION ACTION CLUSTER */}
      <div className="flex items-center gap-5">
        {/* <Link 
          href="/login" 
          className="text-xs font-bold text-muted hover:text-brand-primary transition-colors uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-md"
        >
          Sign In
        </Link> */}
        
        <Link 
          href="/login"
          tabIndex={-1} // Prevents duplicate tab-stops for clean keyboard access
        >
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-10 px-5 font-black text-xs uppercase tracking-widest bg-linear-to-r from-brand-primary to-brand-secondary text-white border-none hover:shadow-glow transition-all duration-300 ease-out cursor-pointer rounded-xl"
          >
            Sign In
          </Button>
        </Link>
      </div>
    </nav>
  );
}