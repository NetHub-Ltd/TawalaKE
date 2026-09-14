"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Building2,
  LayoutDashboard,
  Store,
  Users,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import {
  Permission,
  type PermissionKey,
  canAny,
  permissionsForRole,
} from "@/lib/rbac";
import { cn } from "@/lib/utils";

type OrgNavItem = {
  id: string;
  label: string;
  href: (orgId: string) => string;
  icon: LucideIcon;
  /** Any of these permissions unlocks the link. Empty = all authenticated org members. */
  anyOf?: PermissionKey[];
};

const ORG_NAV: OrgNavItem[] = [
  {
    id: "dashboard",
    label: "Home",
    href: (orgId) => `/org/${orgId}`,
    icon: LayoutDashboard,
    anyOf: [Permission.ORG_READ],
  },
  {
    id: "stores",
    label: "Branches",
    href: (orgId) => `/org/${orgId}/stores`,
    icon: Store,
    anyOf: [Permission.ORG_READ, Permission.ORG_WRITE],
  },
  {
    id: "staff",
    label: "Team",
    href: (orgId) => `/org/${orgId}/staff`,
    icon: Users,
    anyOf: [Permission.ORG_STAFF_MANAGE],
  },
  {
    id: "billing",
    label: "Billing",
    href: (orgId) => `/org/${orgId}/billing`,
    icon: CreditCard,
    anyOf: [Permission.ORG_BILLING],
  },
  {
    id: "settings",
    label: "Settings",
    href: (orgId) => `/org/${orgId}/settings`,
    icon: Settings,
    anyOf: [Permission.ORG_WRITE],
  },
];

/**
 * Organization HQ shell — canonical tokens only (no slate/blue palette utilities).
 */
export function OrgShell({
  organizationId,
  userRole,
  children,
}: {
  organizationId: string;
  userRole: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const role = (userRole || "").toUpperCase().trim();

  const perms = permissionsForRole(role);
  const items = ORG_NAV.filter((item) => {
    if (!item.anyOf || item.anyOf.length === 0) return true;
    return canAny(perms, item.anyOf);
  });

  const displayName =
    session?.user?.name ||
    (session?.user as { full_name?: string } | undefined)?.full_name ||
    session?.user?.email ||
    "User";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          "relative z-40 flex shrink-0 flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
        aria-label="Organization navigation"
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <div className="flex min-w-0 items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-primary font-semibold text-white">
              <Building2 size={18} aria-hidden />
            </div>
            {!collapsed && (
              <div className="min-w-0 truncate">
                <p className="text-sm font-semibold tracking-tight text-foreground">
                  Organization
                </p>
                <p className="truncate font-mono text-xs text-muted">
                  {organizationId.slice(0, 8)}…
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2.5" aria-label="Organization">
          {items.map((item) => {
            const href = item.href(organizationId);
            const active =
              item.id === "dashboard"
                ? pathname === href || pathname === `${href}/`
                : item.id === "staff"
                  ? pathname.includes(`/org/${organizationId}/staff`)
                  : pathname === href || pathname.startsWith(`${href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={href}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
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
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-md border border-border p-2",
              collapsed && "justify-center"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-register text-xs font-semibold text-foreground">
              {String(displayName).slice(0, 1).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted">{role || "Member"}</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-register hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Collapse control — centered on right edge */}
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
          aria-label={collapsed ? "Expand organization nav" : "Collapse organization nav"}
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

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main id="main-content" className="relative min-h-0 min-w-0 flex-1">
          <div className="absolute inset-0 overflow-y-auto overscroll-contain px-3 py-3 focus:outline-none sm:px-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
