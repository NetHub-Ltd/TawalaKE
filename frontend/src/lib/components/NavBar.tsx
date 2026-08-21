"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/lib/components/ui/Button";
import {
  ChevronDown,
  ArrowRight,
  Store,
  Pill,
  Wrench,
  Truck,
  Menu,
  X,
  Zap,
  Layers,
} from "lucide-react";

interface SolutionItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const SOLUTIONS: SolutionItem[] = [
  {
    title: "Retail & Minimarts",
    description: "Fast barcode checkout, stock leak alerts, and cashier PIN logs.",
    href: "/solutions#retail",
    icon: Store,
  },
  {
    title: "Pharmacies & Chemists",
    description: "Batch expiration tracking, prescription logs, and margin protection.",
    href: "/solutions#pharmacy",
    icon: Pill,
  },
  {
    title: "Hardware & Construction",
    description: "Bulk inventory units, customer credit ledgers, and delivery receipts.",
    href: "/solutions#hardware",
    icon: Wrench,
  },
  {
    title: "Wholesale & Distribution",
    description: "Multi-warehouse stock sync, field rep ordering, and tiered pricing.",
    href: "/solutions#wholesale",
    icon: Truck,
  },
];

export default function NavBar() {
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSolutions = useCallback(() => {
    setIsSolutionsOpen((prev) => !prev);
  }, []);

  const closeSolutions = useCallback(() => {
    setIsSolutionsOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 shadow-sm backdrop-blur-md transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Main Corporate Navigation"
          className="flex items-center justify-between h-20 select-none"
        >
          {/* BRAND ARCHITECTURE LOGO NODE */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-xl"
              aria-label="Tawala Home"
            >
              <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20 shadow-xs transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo.svg"
                  alt="Tawala Logo"
                  width={40}
                  height={40}
                  priority
                  fetchPriority="high"
                  className="object-contain p-1"
                />
              </div>

              <div className="flex flex-col">
                <span className="font-black text-base tracking-tight leading-none uppercase text-gradient">
                  Tawala
                </span>
                <span className="text-[9px] font-mono font-black tracking-widest text-brand-secondary uppercase mt-1 leading-none">
                  Business Management System
                </span>
              </div>
            </Link>
          </div>

          {/* MID-REGION: DESKTOP NAVIGATION LINKS & MEGA-MENU */}
          <div className="hidden md:flex items-center gap-8 font-sans">
            <div
              className="relative"
              onMouseLeave={closeSolutions}
            >
              <button
                type="button"
                onClick={toggleSolutions}
                onMouseEnter={() => setIsSolutionsOpen(true)}
                aria-expanded={isSolutionsOpen}
                aria-haspopup="true"
                className="flex items-center gap-1 text-xs font-bold text-muted hover:text-brand-primary transition-colors uppercase tracking-wider py-2 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-md cursor-pointer"
              >
                <span>Solutions</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    isSolutionsOpen ? "rotate-180 text-brand-primary" : ""
                  }`}
                />
              </button>

              {isSolutionsOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute top-full -left-4 w-88 mt-1 p-2 bg-card border border-border/50 rounded-2xl shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50"
                >
                  <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">
                      Industry Solution Hubs
                    </p>
                    <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary">
                      All-in-One Page
                    </span>
                  </div>

                  <div className="py-1">
                    {SOLUTIONS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          onClick={closeSolutions}
                          role="menuitem"
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-brand-primary/5 transition group/item"
                        >
                          <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary group-hover/item:bg-brand-primary group-hover/item:text-white transition-colors shrink-0">
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-foreground group-hover/item:text-brand-primary transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-muted leading-snug mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-border/30">
                    <Link
                      href="/solutions"
                      onClick={closeSolutions}
                      role="menuitem"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface/50 hover:bg-brand-primary/10 text-xs font-bold text-brand-primary transition-colors group/all"
                    >
                      <div className="flex items-center gap-2">
                        <Layers size={14} />
                        <span>View All Industry Solutions</span>
                      </div>
                      <ArrowRight size={14} className="transition-transform group-hover/all:translate-x-1" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {[
              { name: "Pricing", path: "/billing" },
              { name: "Support", path: "/support" },
            ].map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className="relative text-xs font-bold text-muted hover:text-brand-primary transition-colors uppercase tracking-wider py-2 min-h-[44px] flex items-center group/link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-md"
              >
                {link.name}
                <span className="absolute bottom-1 left-0 w-0 h-[2px] bg-brand-secondary transition-all duration-300 ease-out group-hover/link:w-full" />
              </Link>
            ))}
          </div>

          {/* RIGHT-REGION: HIGH-CONVERSION CTA CLUSTER */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-bold text-muted hover:text-brand-primary transition-colors uppercase tracking-wider px-3 py-2 min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-md"
            >
              Sign In
            </Link>

            <Link href="/org" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-xl">
              <Button
                variant="secondary"
                size="sm"
                className="h-11 px-5 font-black text-xs uppercase tracking-widest bg-linear-to-r from-brand-primary to-brand-secondary text-white border-none hover:shadow-glow transition-all duration-300 ease-out cursor-pointer rounded-xl flex items-center gap-2 group"
              >
                <span>Start Free Trial</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Button>
            </Link>
          </div>

          {/* MOBILE HAMBURGER TOGGLE */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle Navigation Menu"
              className="p-2.5 rounded-xl text-muted hover:text-foreground hover:bg-card border border-border/40 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </div>

      {/* MOBILE DRAWER NAVIGATION */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-card/95 backdrop-blur-xl px-4 pt-4 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <div className="px-3 flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">
                Solutions Page Anchors
              </p>
              <Link
                href="/solutions"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[10px] font-bold text-brand-primary uppercase"
              >
                View Hub →
              </Link>
            </div>

            {SOLUTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 min-h-[44px] rounded-xl hover:bg-brand-primary/5 text-xs font-bold text-foreground"
                >
                  <Icon size={16} className="text-brand-primary shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border/30 space-y-1">
            <Link
              href="/support"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center p-3 min-h-[44px] rounded-xl text-xs font-bold uppercase tracking-wider text-muted hover:text-foreground hover:bg-brand-primary/5"
            >
              Support
            </Link>
          </div>

          <div className="pt-3 border-t border-border/30 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full h-11 flex items-center justify-center text-xs font-bold uppercase tracking-wider border border-border/60 rounded-xl text-foreground hover:bg-card"
            >
              Sign In
            </Link>
            <Link
              href="/org"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full"
            >
              <Button
                variant="secondary"
                size="sm"
                className="w-full h-11 font-black text-xs uppercase tracking-widest bg-linear-to-r from-brand-primary to-brand-secondary text-white border-none shadow-md rounded-xl flex items-center justify-center gap-2"
              >
                <Zap size={14} />
                <span>Start Free Trial</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}