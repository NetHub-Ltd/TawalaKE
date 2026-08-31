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

type OrgNavItem = {
  id: string;
  label: string;
  href: (orgId: string) => string;
  icon: LucideIcon;
  /** If set, only these roles see the item (uppercase). Empty = all authenticated. */
  roles?: string[];
};

const ORG_NAV: OrgNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: (orgId) => `/org/${orgId}`,
    icon: LayoutDashboard,
  },
  {
    id: "stores",
    label: "Stores",
    href: (orgId) => `/org/${orgId}/stores`,
    icon: Store,
  },
  {
    id: "staff",
    label: "Team",
    href: (orgId) => `/org/${orgId}/staff`,
    icon: Users,
  },
  {
    id: "billing",
    label: "Billing",
    href: (orgId) => `/org/${orgId}/billing`,
    icon: CreditCard,
  },
  {
    id: "settings",
    label: "Settings",
    href: (orgId) => `/org/${orgId}/settings`,
    icon: Settings,
    roles: ["OWNER", "ADMIN"],
  },
];

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

  const items = ORG_NAV.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  const displayName =
    session?.user?.name ||
    (session?.user as { full_name?: string } | undefined)?.full_name ||
    session?.user?.email ||
    "User";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside
        className={`relative z-40 flex shrink-0 flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 ${
          collapsed ? "w-20" : "w-64"
        }`}
        aria-label="Organization navigation"
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
          <div className="flex min-w-0 items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm shadow-blue-500/20">
              <Building2 size={18} aria-hidden />
            </div>
            {!collapsed && (
              <div className="min-w-0 truncate">
                <p className="text-sm font-black tracking-tight">Organization</p>
                <p className="truncate font-mono text-[10px] text-slate-400">
                  {organizationId.slice(0, 8)}…
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label={collapsed ? "Expand organization nav" : "Collapse organization nav"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2.5" aria-label="Organization">
          {items.map((item) => {
            const href = item.href(organizationId);
            const active =
              item.id === "staff"
                ? pathname.includes(`/org/${organizationId}/staff`)
                : pathname === href || pathname.startsWith(`${href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={href}
                className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                } ${collapsed ? "justify-center px-2" : ""}`}
                aria-current={active ? "page" : undefined}
                title={item.label}
              >
                <Icon size={18} className="shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-2.5 dark:border-slate-800">
          <div
            className={`flex items-center gap-2.5 rounded-xl border border-slate-200 p-2 dark:border-slate-800 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
              {String(displayName).slice(0, 1).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="truncate text-[11px] text-slate-500">{role || "Member"}</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
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
