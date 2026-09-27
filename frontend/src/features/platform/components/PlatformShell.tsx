"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ScrollText,
  ChevronLeft,
  LogOut,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { clearPlatformSession } from "@/lib/platform/auth";
import { cn } from "@/lib/utils";

type PlatformNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Exact match for overview; prefix match for nested routes. */
  match: "exact" | "prefix";
};

const PLATFORM_NAV: PlatformNavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/platform",
    icon: LayoutDashboard,
    match: "exact",
  },
  {
    id: "orgs",
    label: "Organizations",
    href: "/platform/orgs",
    icon: Building2,
    match: "prefix",
  },
  {
    id: "users",
    label: "Operators",
    href: "/platform/users",
    icon: Users,
    match: "prefix",
  },
  {
    id: "plans",
    label: "Plans",
    href: "/platform/plans",
    icon: CreditCard,
    match: "prefix",
  },
  {
    id: "audit",
    label: "Audit",
    href: "/platform/audit",
    icon: ScrollText,
    match: "prefix",
  },
];

function isActive(pathname: string | null, item: PlatformNavItem): boolean {
  if (!pathname) return false;
  if (item.match === "exact") {
    return pathname === item.href || pathname === `${item.href}/`;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Platform operator chrome: header + collapsible sidebar + main window.
 * Login route stays minimal (no sidebar). Isolated from tenant/marketing chrome.
 */
export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const isLogin =
    pathname === "/platform/login" ||
    Boolean(pathname?.startsWith("/platform/login/"));

  if (isLogin) {
    return (
      <div
        data-shell="platform-login"
        className="flex min-h-dvh w-full flex-col bg-background text-foreground antialiased"
      >
        <header className="border-b border-border/80 bg-card">
          <div className="mx-auto flex h-14 w-full max-w-lg items-center gap-3 px-4">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-primary text-sm font-bold text-white"
              aria-hidden
            >
              <Shield size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                Tawala Platform
              </p>
              <p className="text-xs text-muted">Operator sign-in</p>
            </div>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-10">
          {children}
        </main>
        <footer className="border-t border-border/60 py-3 text-center text-xs text-muted">
          Platform console · NetHub · Not for store staff
        </footer>
      </div>
    );
  }

  return (
    <div
      data-shell="platform"
      className="flex h-dvh w-full overflow-hidden bg-background text-foreground antialiased"
    >
      {/* Sidebar */}
      <aside
        className={cn(
          "relative z-40 flex shrink-0 flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
        aria-label="Platform navigation"
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-3 sm:h-16 sm:px-4">
          <Link
            href="/platform"
            className="flex min-w-0 items-center gap-3 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-md"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-primary font-semibold text-white">
              <Shield size={18} aria-hidden />
            </span>
            {!collapsed && (
              <span className="min-w-0 truncate">
                <span className="block text-sm font-semibold tracking-tight text-foreground">
                  Tawala Platform
                </span>
                <span className="block truncate text-xs text-muted">
                  Operator console
                </span>
              </span>
            )}
          </Link>
        </div>

        <nav
          className="flex flex-1 flex-col gap-1 overflow-y-auto p-2.5"
          aria-label="Platform"
        >
          {PLATFORM_NAV.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
                  active
                    ? "bg-brand-primary/10 text-brand-primary ring-1 ring-inset ring-brand-primary/20"
                    : "text-muted hover:bg-register hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
                aria-current={active ? "page" : undefined}
                title={item.label}
              >
                <Icon size={18} className="shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-2.5">
          <button
            type="button"
            onClick={() => {
              clearPlatformSession();
              router.replace("/platform/login");
            }}
            className={cn(
              "flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-register hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
              collapsed && "justify-center px-2"
            )}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} className="shrink-0" aria-hidden />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "absolute top-1/2 z-50 flex h-8 w-8 -translate-y-1/2 items-center justify-center",
            "rounded-full border border-border bg-card text-muted shadow-sm",
            "transition-all duration-300 hover:border-brand-primary/30 hover:bg-register hover:text-brand-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
            "right-0 translate-x-1/2"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          <span
            className={cn(
              "inline-flex transition-transform duration-300 ease-out",
              collapsed ? "rotate-180" : "rotate-0"
            )}
          >
            <ChevronLeft size={16} aria-hidden />
          </span>
        </button>
      </aside>

      {/* Main column: top header + scrollable window */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:h-16 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {PLATFORM_NAV.find((i) => isActive(pathname, i))?.label ??
                "Platform"}
            </p>
            <p className="truncate text-xs text-muted">
              Cross-tenant operations · NetHub
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
            <span className="rounded-md border border-border bg-background px-2 py-1 font-medium">
              Platform JWT
            </span>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>

        <footer className="shrink-0 border-t border-border/60 px-4 py-2 text-center text-xs text-muted sm:px-6">
          Platform console · Not for store staff
        </footer>
      </div>
    </div>
  );
}
