"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  Store,
  Pill,
  Wrench,
  Truck,
  Menu,
  X,
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
    description: "Barcode checkout, stock alerts, and cashier PIN logs.",
    href: "/solutions/retail",
    icon: Store,
  },
  {
    title: "Pharmacies & Chemists",
    description: "FEFO expiry tracking, batches, and margin control.",
    href: "/solutions/pharmacy",
    icon: Pill,
  },
  {
    title: "Hardware & Construction",
    description: "Bulk units, credit ledgers, and deliveries.",
    href: "/solutions/hardware",
    icon: Wrench,
  },
  {
    title: "Wholesale & Distribution",
    description: "Multi-branch stock, field reps, and tiered pricing.",
    href: "/solutions/wholesale",
    icon: Truck,
  },
];

const NAV_LINKS = [
  { name: "Blog", href: "/blog" },
  { name: "Pricing", href: "/onboarding/plans" },
  { name: "Support", href: "/support" },
] as const;

export default function NavBar() {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const solutionsRef = useRef<HTMLDivElement>(null);

  const closeSolutions = useCallback(() => setSolutionsOpen(false), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Close solutions on outside click / Escape
  useEffect(() => {
    if (!solutionsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSolutions();
    };
    const onPointer = (e: MouseEvent) => {
      if (
        solutionsRef.current &&
        !solutionsRef.current.contains(e.target as Node)
      ) {
        closeSolutions();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [solutionsOpen, closeSolutions]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Primary"
          className="flex h-16 items-center justify-between gap-4 sm:h-[4.25rem]"
        >
          {/* Brand */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Tawala home"
          >
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-brand-primary/15 bg-brand-primary/10">
              <Image
                src="/logo.svg"
                alt=""
                width={36}
                height={36}
                priority
                className="object-contain p-1"
              />
            </span>
            <span className="text-base font-bold tracking-tight text-foreground">
              Tawala
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex lg:gap-2">
            <div className="relative" ref={solutionsRef}>
              <button
                type="button"
                onClick={() => setSolutionsOpen((o) => !o)}
                aria-expanded={solutionsOpen}
                aria-haspopup="menu"
                className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                Solutions
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    solutionsOpen ? "rotate-180 text-brand-primary" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {solutionsOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full z-50 mt-1.5 w-[22rem] rounded-2xl border border-border/60 bg-card p-2 shadow-lift"
                >
                  <div className="space-y-0.5">
                    {SOLUTIONS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={closeSolutions}
                          className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-brand-primary/5"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                            <Icon size={16} aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-foreground">
                              {item.title}
                            </span>
                            <span className="mt-0.5 block text-xs leading-snug text-muted">
                              {item.description}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-1 border-t border-border/50 pt-1">
                    <Link
                      href="/solutions"
                      role="menuitem"
                      onClick={closeSolutions}
                      className="flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-primary/5"
                    >
                      <Layers size={16} aria-hidden="true" />
                      All solutions
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Desktop actions — Sign in only (no trial CTA) */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              Sign in
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 text-muted transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X size={20} aria-hidden="true" />
            ) : (
              <Menu size={20} aria-hidden="true" />
            )}
          </button>
        </nav>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-t border-border/60 bg-card md:hidden"
        >
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              Solutions
            </p>
            {SOLUTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-foreground hover:bg-brand-primary/5"
                >
                  <Icon
                    size={16}
                    className="shrink-0 text-brand-primary"
                    aria-hidden="true"
                  />
                  {item.title}
                </Link>
              );
            })}
            <Link
              href="/solutions"
              onClick={closeMobile}
              className="flex min-h-11 items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/5"
            >
              <Layers size={16} aria-hidden="true" />
              All solutions
            </Link>

            <div className="my-2 border-t border-border/50" />

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className="flex min-h-11 items-center rounded-xl px-2 py-2 text-sm font-medium text-foreground hover:bg-brand-primary/5"
              >
                {link.name}
              </Link>
            ))}

            <div className="my-2 border-t border-border/50" />

            <Link
              href="/login"
              onClick={closeMobile}
              className="flex min-h-11 items-center justify-center rounded-xl border border-border/60 px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-background"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
