"use client";

/**
 * Public marketing navbar — conversion-first, canonical tokens only.
 */
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SolutionItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const SOLUTIONS: SolutionItem[] = [
  {
    title: "Retail & minimarts",
    description: "Barcode checkout, stock alerts, cashier PIN logs.",
    href: "/solutions/retail",
    icon: Store,
  },
  {
    title: "Pharmacies",
    description: "FEFO expiry, batches, and margin control.",
    href: "/solutions/pharmacy",
    icon: Pill,
  },
  {
    title: "Hardware",
    description: "Bulk units, credit ledgers, deliveries.",
    href: "/solutions/hardware",
    icon: Wrench,
  },
  {
    title: "Wholesale",
    description: "Multi-branch stock, field reps, tiered pricing.",
    href: "/solutions/wholesale",
    icon: Truck,
  },
];

const NAV_LINKS = [
  { name: "Pricing", href: "/onboarding/plans" },
  { name: "Blog", href: "/blog" },
  { name: "Support", href: "/support" },
] as const;

const TRIAL_HREF = "/onboarding/personal-details";
const LOGIN_HREF = "/login";

export default function NavBar() {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const solutionsRef = useRef<HTMLDivElement>(null);

  const closeSolutions = useCallback(() => setSolutionsOpen(false), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

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

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-md"
          onClick={closeMobile}
        >
          <Image
            src="/logo.svg"
            alt="Tawala"
            width={28}
            height={28}
            className="h-7 w-7"
            priority
          />
          <span className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            Tawala
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          <div className="relative" ref={solutionsRef}>
            <button
              type="button"
              className={cn(
                "inline-flex h-10 items-center gap-1 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
                solutionsOpen
                  ? "bg-register text-foreground"
                  : "text-muted hover:bg-register hover:text-foreground"
              )}
              aria-expanded={solutionsOpen}
              aria-haspopup="true"
              onClick={() => setSolutionsOpen((o) => !o)}
            >
              Solutions
              <ChevronDown
                size={16}
                className={cn("transition-transform", solutionsOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            {solutionsOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-md border border-border bg-card p-2 shadow-glow"
              >
                {SOLUTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={closeSolutions}
                      className="flex gap-3 rounded-md p-3 transition-colors hover:bg-register focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-register text-brand-primary">
                        <Icon size={18} aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  );
                })}
                <Link
                  href="/solutions"
                  onClick={closeSolutions}
                  className="mt-1 block rounded-md px-3 py-2 text-center text-xs font-semibold text-brand-primary hover:bg-register"
                >
                  View all solutions
                </Link>
              </div>
            )}
          </div>

          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-muted transition-colors hover:bg-register hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href={LOGIN_HREF}
            className="inline-flex h-10 items-center rounded-md px-3 text-sm font-semibold text-muted hover:bg-register hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            Log in
          </Link>
          <Link
            href={TRIAL_HREF}
            className="inline-flex h-10 items-center justify-center rounded-md bg-brand-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            Start free trial
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-register md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Mobile">
            <p className="px-2 pb-1 text-xs font-semibold tracking-wide text-muted">
              Solutions
            </p>
            {SOLUTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-register"
                >
                  <Icon size={18} className="text-brand-primary" aria-hidden />
                  <span className="text-sm font-medium text-foreground">
                    {item.title}
                  </span>
                </Link>
              );
            })}
            <div className="my-2 border-t border-border" />
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-foreground hover:bg-register"
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              <Link
                href={LOGIN_HREF}
                onClick={closeMobile}
                className="inline-flex h-12 items-center justify-center rounded-md border border-border text-sm font-semibold text-foreground hover:bg-register"
              >
                Log in
              </Link>
              <Link
                href={TRIAL_HREF}
                onClick={closeMobile}
                className="inline-flex h-12 items-center justify-center rounded-md bg-brand-primary text-sm font-semibold text-white hover:opacity-90"
              >
                Start free trial
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
