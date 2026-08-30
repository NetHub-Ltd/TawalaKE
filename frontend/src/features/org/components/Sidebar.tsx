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
  Users2,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { BusinessSwitcher } from "@/features/business/components/BusinessSwitcher";
import {
  Permission,
  type PermissionKey,
  canAny,
  permissionsForRole,
} from "@/lib/rbac";

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
  /** Any of these permissions unlocks the link (1:1 with API). */
  anyOf: PermissionKey[];
  icon: LucideIcon;
  /** Org-scoped route: /org/{orgId}{path} instead of under businessId */
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
    label: "Team",
    path: "/staff",
    anyOf: [Permission.ORG_STAFF_MANAGE],
    icon: Users2,
    orgLevel: true,
  },
];

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800 ${className}`}
      aria-hidden="true"
    />
  );
}

function SidebarSkeleton() {
  return (
    <aside
      className="w-60 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 p-2.5 gap-4 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.03)]"
      aria-label="Sidebar loading"
      aria-busy="true"
    >
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      <div className="flex-1 space-y-2 pt-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-5 w-5 shrink-0 rounded-lg" />
            <Skeleton className="h-3.5 flex-1 max-w-[7rem]" />
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-2 flex items-center gap-2.5">
          <Skeleton className="h-9 w-9 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    </aside>
  );
}

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
    canAny(perms, link.anyOf),
  );

  // Org-level pages (e.g. Team) may not have businessId in the URL.
  // Prefer explicit prop, else first assigned store from session.
  const assigned =
    (
      session?.user as
        | { assigned_businesses?: { id: string }[] }
        | undefined
    )?.assigned_businesses ?? [];
  const effectiveBusinessId =
    businessId || assigned[0]?.id || undefined;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 76 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 min-h-screen flex flex-col shrink-0 relative z-20 shadow-[4px_0_20px_-4px_rgba(0,0,0,0.04)]"
      aria-label="Main Navigation"
    >
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-1/2 -right-3.5 -translate-y-1/2 z-30 h-7 w-7 rounded-full
                   bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500
                   hover:text-blue-600 hover:border-blue-500/30 hover:shadow-md
                   flex items-center justify-center transition-colors duration-200
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!isCollapsed}
      >
        <ChevronLeft
          size={14}
          strokeWidth={2.25}
          className={`transition-transform duration-300 ease-out ${
            isCollapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      <div className="flex-1 flex flex-col p-2.5 gap-4 overflow-hidden">
        <BusinessSwitcher isCollapsed={isCollapsed} />

        <nav className="flex-1 space-y-1" aria-label="Sidebar Links">
          {visibleLinks.map((link) => {
            const href = link.orgLevel
              ? `/org/${organizationId}${link.path}`
              : effectiveBusinessId
                ? `/org/${organizationId}/${effectiveBusinessId}${link.path}`
                : `/org/${organizationId}`;
            const isActive =
              link.path === ""
                ? pathname === href
                : pathname.startsWith(href);
            const Icon = link.icon;

            return (
              <Link
                key={link.path}
                href={href}
                title={isCollapsed ? link.label : undefined}
                aria-current={isActive ? "page" : undefined}
                className={`
                  group relative flex items-center rounded-xl text-sm font-medium
                  transition-all duration-200 ease-out min-h-[44px]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
                  ${
                    isCollapsed
                      ? "h-11 w-11 mx-auto justify-center"
                      : "gap-3 px-3 py-2.5"
                  }
                  ${
                    isActive
                      ? isCollapsed
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-blue-600 text-white shadow-xs shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }
                `}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.1 : 1.75}
                    className={`transition-transform duration-200 ${
                      !isActive && "group-hover:scale-105"
                    }`}
                  />
                </div>
                {!isCollapsed && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800">
        <div
          className={`rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center transition-all duration-300 ${
            isCollapsed
              ? "h-12 w-12 mx-auto justify-center flex-col"
              : "p-2 gap-2.5"
          }`}
        >
          <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-medium text-slate-900 dark:text-slate-100 shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() ?? <User size={16} />}
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate leading-tight">
                {session?.user?.name || "User"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize mt-0.5">
                {userRole.toLowerCase()}
              </p>
            </div>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition min-h-[36px] min-w-[36px] flex items-center justify-center"
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
            className="mt-2 h-10 w-12 mx-auto flex items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </motion.aside>
  );
}
