"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Monitor,
  Package,
  History,
  User,
  LogOut,
  LayoutDashboard,
  ChevronLeft,
  Users,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { BusinessSwitcher } from "@/features/business/components/BusinessSwitcher";
import {
  Permission,
  type PermissionKey,
  canAny,
  permissionsForRole,
} from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { Skeleton as UiSkeleton } from "@/lib/components/ui";

interface SidebarProps {
  organizationId: string;
  /** When omitted (org-level surfaces), business links use session fallback */
  businessId?: string;
  /** Prefer from server layout / page — avoids useSession race */
  userRole?: string;
}

interface SidebarLink {
  label: string;
  path: string;
  anyOf: PermissionKey[];
  icon: LucideIcon;
  orgLevel?: boolean;
}

const NAVIGATION_SCHEMA: SidebarLink[] = [
  {
    label: "Overview",
    path: "/overview",
    anyOf: [Permission.REPORTS_READ],
    icon: LayoutDashboard,
  },
  {
    label: "Terminal",
    path: "/terminal",
    anyOf: [Permission.SALES_WRITE],
    icon: Monitor,
  },
  {
    label: "Stock",
    path: "/inventory",
    anyOf: [
      Permission.CATALOG_READ,
      Permission.STOCK_READ,
      Permission.STOCK_ADJUST,
    ],
    icon: Package,
  },
  {
    label: "Sales History",
    path: "/sale-history",
    anyOf: [Permission.SALES_READ_OWN, Permission.SALES_READ_BUSINESS],
    icon: History,
  },
  {
    label: "Customers",
    path: "/customers",
    anyOf: [Permission.SALES_READ_BUSINESS, Permission.REPORTS_READ],
    icon: Users,
  },
  {
    label: "Expenses",
    path: "/expenses",
    anyOf: [Permission.REPORTS_READ],
    icon: Wallet,
  },
  {
    label: "Settings",
    path: "/settings",
    anyOf: [Permission.STOCK_ADJUST, Permission.ORG_WRITE],
    icon: Settings,
  },
];

function SidebarSkeleton() {
  return (
    <aside
      className="flex min-h-screen w-60 shrink-0 flex-col gap-4 border-r border-border bg-card p-2.5"
      aria-label="Sidebar loading"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 rounded-md border border-border p-2.5">
        <UiSkeleton className="h-10 w-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <UiSkeleton className="h-3.5 w-20" />
          <UiSkeleton className="h-3 w-14" />
        </div>
      </div>
      <div className="flex-1 space-y-2 pt-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <UiSkeleton className="h-5 w-5 shrink-0 rounded-md" />
            <UiSkeleton className="h-3.5 max-w-[7rem] flex-1" />
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-2">
        <div className="flex items-center gap-2.5 rounded-md border border-border p-2">
          <UiSkeleton className="h-9 w-9 shrink-0" />
          <div className="flex-1 space-y-2">
            <UiSkeleton className="h-3.5 w-24" />
            <UiSkeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * Business-level navigation — canonical tokens + kit Skeleton.
 * Behavior (RBAC, routes, business switcher) unchanged.
 */
export function Sidebar({
  organizationId,
  businessId,
  userRole: userRoleProp,
}: SidebarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const rawRole =
    userRoleProp ||
    (session?.user as { role?: string } | undefined)?.role ||
    "";
  const userRole = rawRole.toUpperCase().trim();

  const roleReady = Boolean(userRole);
  const sessionPending = status === "loading" && !userRoleProp;

  if (sessionPending || !roleReady) {
    return <SidebarSkeleton />;
  }

  if (status === "unauthenticated" && !userRoleProp) {
    return <SidebarSkeleton />;
  }

  const perms = permissionsForRole(userRole);
  const visibleLinks = NAVIGATION_SCHEMA.filter((link) =>
    canAny(perms, link.anyOf)
  );

  const assigned =
    (session?.user as { assigned_businesses?: { id: string }[] } | undefined)
      ?.assigned_businesses ?? [];
  const effectiveBusinessId = businessId || assigned[0]?.id || undefined;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 76 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="relative z-20 flex min-h-screen shrink-0 flex-col border-r border-border bg-card"
      aria-label="Business navigation"
    >
      <div className="flex items-center gap-2 border-b border-border p-2.5">
        <div className={cn("min-w-0 flex-1", isCollapsed && "flex justify-center")}>
          <BusinessSwitcher isCollapsed={isCollapsed} />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden p-2.5">
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Branch">
          {visibleLinks.map((link) => {
            const href = link.orgLevel
              ? `/org/${organizationId}${link.path}`
              : effectiveBusinessId
                ? `/org/${organizationId}/${effectiveBusinessId}${link.path}`
                : `/org/${organizationId}`;
            const isActive =
              pathname === href ||
              (link.path !== "/overview" && pathname?.startsWith(href));
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                href={href}
                className={cn(
                  "group flex min-h-12 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
                  isActive
                    ? "bg-brand-primary/10 text-brand-primary ring-1 ring-inset ring-brand-primary/20"
                    : "text-muted hover:bg-register hover:text-foreground",
                  isCollapsed && "justify-center px-2"
                )}
                aria-current={isActive ? "page" : undefined}
                title={link.label}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.1 : 1.75}
                  className="shrink-0"
                  aria-hidden
                />
                {!isCollapsed && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border p-2.5">
        <div
          className={cn(
            "flex items-center rounded-md border border-border transition-all",
            isCollapsed ? "mx-auto h-12 w-12 justify-center" : "gap-2.5 p-2"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-register text-sm font-medium text-foreground">
            {session?.user?.name?.[0]?.toUpperCase() ?? <User size={16} />}
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight text-foreground">
                {session?.user?.name || "User"}
              </p>
              <p className="mt-0.5 capitalize text-xs text-muted">
                {userRole.toLowerCase()}
              </p>
            </div>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-md p-2 text-muted hover:bg-register hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={17} strokeWidth={1.75} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mx-auto mt-2 flex h-10 w-12 items-center justify-center rounded-md text-muted hover:bg-register hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} strokeWidth={1.75} />
          </button>
        )}
      </div>
    
      <button
        type="button"
        onClick={() => setIsCollapsed((c) => !c)}
        className={cn(
          "absolute top-1/2 z-50 flex h-8 w-8 -translate-y-1/2 items-center justify-center",
          "rounded-full border border-border bg-card text-muted shadow-sm",
          "transition-all duration-300 hover:border-brand-primary/30 hover:bg-register hover:text-brand-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
          "right-0 translate-x-1/2"
        )}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!isCollapsed}
      >
        <span
          className={cn(
            "inline-flex transition-transform duration-300 ease-out",
            isCollapsed ? "rotate-180" : "rotate-0"
          )}
        >
          <ChevronLeft size={16} aria-hidden />
        </span>
      </button>
    </motion.aside>
  );
}
