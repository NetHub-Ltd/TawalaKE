"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearPlatformSession } from "@/lib/platform/auth";
import { cn } from "@/lib/utils";

/**
 * Operator chrome for /platform/* — no marketing nav/footer.
 */
export function PlatformShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/platform/login" || pathname?.startsWith("/platform/login/");

  return (
    <div
      data-shell="platform"
      className="flex min-h-dvh w-full flex-col bg-background text-foreground antialiased"
    >
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href={isLogin ? "/platform/login" : "/platform"}
              className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
            >
              <span
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-primary text-sm font-bold text-white"
                aria-hidden
              >
                T
              </span>
              <span className="hidden sm:inline">
                Tawala{" "}
                <span className="font-medium text-muted">Platform</span>
              </span>
            </Link>
            {!isLogin ? (
              <nav className="flex items-center gap-1" aria-label="Platform">
                <NavLink href="/platform" active={pathname === "/platform"}>
                  Overview
                </NavLink>
                <NavLink
                  href="/platform/orgs"
                  active={Boolean(pathname?.startsWith("/platform/orgs"))}
                >
                  Organizations
                </NavLink>
                <NavLink
                  href="/platform/users"
                  active={Boolean(pathname?.startsWith("/platform/users"))}
                >
                  Operators
                </NavLink>
                <NavLink
                  href="/platform/plans"
                  active={Boolean(pathname?.startsWith("/platform/plans"))}
                >
                  Plans
                </NavLink>
                <NavLink
                  href="/platform/audit"
                  active={Boolean(pathname?.startsWith("/platform/audit"))}
                >
                  Audit
                </NavLink>
              </nav>
            ) : null}
          </div>
          {!isLogin ? (
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
              onClick={() => {
                clearPlatformSession();
                router.replace("/platform/login");
              }}
            >
              Sign out
            </button>
          ) : (
            <span className="text-xs text-muted">Operator sign-in</span>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-border/60 py-4 text-center text-xs text-muted">
        Platform console · NetHub · Not for store staff
      </footer>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-brand-primary/10 text-brand-primary"
          : "text-muted hover:bg-background hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}
