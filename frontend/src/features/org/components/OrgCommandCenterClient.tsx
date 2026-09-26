"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Store,
  Plus,
  ArrowRight,
  ShieldCheck,
  Pencil,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  HelpCircle,
  Users,
} from "lucide-react";
import { canAny, Permission, permissionsForRole } from "@/lib/rbac";

export interface BusinessItem {
  id: string;
  name: string;
  code?: string;
  status?: string;
  todaySales?: string;
  activeRegisters?: number;
}

export interface OrgCommandCenterClientProps {
  orgId: string;
  userRole: string;
  userName: string;
  businesses: BusinessItem[];
}

export function OrgCommandCenterClient({
  orgId,
  userRole,
  userName,
  businesses,
}: OrgCommandCenterClientProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Mock license utilization calculation
  const maxLicenses = 5;
  const activeCount = businesses.length;
  const licensePercentage = Math.round((activeCount / maxLicenses) * 100);

  // Permission-based nav (aligned with OrgShell / backend ROLE_PERMISSIONS).
  // Do not hard-code role name lists — OWNER must see Team via org:staff:manage.
  const perms = permissionsForRole(userRole);
  const navItems: Array<{
    id: string;
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    badge?: string;
    anyOf: string[];
  }> = [
    {
      id: "overview",
      label: "Dashboard",
      href: `/org`,
      icon: LayoutDashboard,
      anyOf: [Permission.ORG_READ],
    },
    {
      id: "stores",
      label: "Branches",
      href: `/org/${orgId}/stores`,
      icon: Store,
      badge: `${activeCount}`,
      anyOf: [Permission.ORG_READ, Permission.ORG_WRITE],
    },
    {
      id: "staff",
      label: "Team",
      href: `/org/${orgId}/staff`,
      icon: Users,
      anyOf: [Permission.ORG_STAFF_MANAGE],
    },
    {
      id: "settings",
      label: "Organization Settings",
      href: `/org/${orgId}/settings`,
      icon: Settings,
      anyOf: [Permission.ORG_WRITE],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    canAny(perms, item.anyOf as Parameters<typeof canAny>[1]),
  );

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`relative flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out z-40 ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
        aria-label="Organization Navigation"
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-md bg-brand-primary text-white flex items-center justify-center shrink-0 font-bold shadow-sm shadow-none">
              <Building2 size={18} />
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  TAWALA
                </h2>
                <p className="text-xs font-mono text-muted truncate">
                  ID: {orgId.substring(0, 8)}...
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="h-8 w-8 rounded-lg bg-register hover:opacity-90 text-muted flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]"
            aria-label={
              isSidebarCollapsed
                ? "Expand sidebar navigation"
                : "Collapse sidebar navigation"
            }
            aria-expanded={!isSidebarCollapsed}
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Dynamic Nav Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Main Navigation">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full min-h-[44px] px-3 py-2.5 rounded-md text-xs font-semibold transition-all duration-150 flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                  isActive
                    ? "bg-brand-primary text-white font-bold"
                    : "text-muted hover:bg-register hover:text-foreground dark:hover:text-foreground"
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    size={18}
                    className={`shrink-0 ${
                      isActive
                        ? "text-white"
                        : "text-muted dark:text-foreground group-hover:text-brand-primary dark:group-hover:text-brand-primary"
                    }`}
                  />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isSidebarCollapsed && item.badge && (
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                      isActive
                        ? "bg-card/20 text-white"
                        : "bg-register text-muted"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Capacity Indicator */}
        {!isSidebarCollapsed && (
          <div className="p-3 m-3 rounded-md bg-register/70 dark:bg-register border border-border space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-foreground dark:text-muted">Store Capacity</span>
              <span className="font-mono text-brand-primary font-bold">
                {activeCount} / {maxLicenses}
              </span>
            </div>
            <div className="h-1.5 w-full bg-register rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-primary rounded-full transition-all duration-500"
                style={{ width: `${licensePercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* User Profile Footer */}
        <div className="p-3 border-t border-border flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 flex items-center justify-center font-bold shrink-0 text-xs">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          {!isSidebarCollapsed && (
            <div className="truncate min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {userName}
              </p>
              <div className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-brand-primary shrink-0" />
                <span className="text-xs font-mono uppercase text-muted truncate">
                  {userRole}
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main id="main-content" className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* HEADER */}
        <header className="h-16 w-full bg-card/80 dark:bg-card/80 backdrop-blur-md border-b border-border px-6 flex items-center justify-between shrink-0 z-30">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              Organization Command Center
            </h1>
            <p className="text-xs text-foreground dark:text-muted hidden sm:block">
              Centralized multi-tenant footprint & governance console
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/support"
              className="hidden md:flex min-h-[44px] px-3 py-2 rounded-md text-xs font-semibold text-muted hover:bg-register transition-colors items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <HelpCircle size={16} />
              <span>Docs & Support</span>
            </Link>

            <Link
              href={`/org/${orgId}/stores/new`}
              className="min-h-[44px] px-4 py-2 rounded-md bg-brand-primary hover:opacity-90 text-white text-xs font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">New branch</span>
              <span className="sm:hidden">New Store</span>
            </Link>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="max-w-7xl mx-auto space-y-8">
          
            {/* ACTIVE STORES GRID */}
            <section aria-label="Assigned Branches" className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground dark:text-muted flex items-center gap-2">
                  <Store size={14} className="text-brand-primary" />
                  Active Branches ({businesses.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                {businesses.map((business) => (
                  <article
                    key={business.id}
                    className="group bg-card border border-border rounded-md p-6 shadow-sm hover:shadow-md hover:border-brand-primary/40 transition-all duration-200 flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-10 w-10 rounded-md bg-brand-primary/10 text-brand-primary border border-brand-primary/20 flex items-center justify-center shrink-0">
                          <Store size={20} strokeWidth={2} />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)] uppercase">
                            Active
                          </span>

                          <Link
                            href={`#`}
                            aria-label={`Edit ${business.name} settings`}
                            className="h-8 w-8 rounded-lg bg-register hover:opacity-90 text-muted flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                          >
                            <Pencil size={14} />
                          </Link>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-foreground group-hover:text-brand-primary dark:group-hover:text-brand-primary transition-colors truncate">
                          {business.name}
                        </h3>
                        {business.code && (
                          <p className="text-xs font-mono text-foreground dark:text-muted mt-0.5">
                            Code: {business.code}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 rounded-md bg-register dark:bg-register border border-border text-xs">
                        <div>
                          <p className="text-xs text-muted">Today&apos;s Revenue</p>
                          <p className="font-mono font-bold text-foreground">
                            {business.todaySales || "$4,120.00"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted">Registers Online</p>
                          <p className="font-mono font-bold text-[var(--success)]">
                            {business.activeRegisters || 3} Terminals
                          </p>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/org/${orgId}/${business.id}/overview`}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-md bg-register hover:bg-brand-primary hover:text-white dark:hover:bg-brand-primary text-foreground text-xs font-bold transition-all duration-200 flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    >
                      <span>Launch Store Terminal</span>
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </article>
                ))}

                <article className="group bg-register/40 dark:bg-card/40 border-2 border-dashed border-border dark:border-border rounded-md p-6 hover:border-brand-primary transition-all duration-200 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="h-10 w-10 rounded-md bg-register text-muted border border-border/60 dark:border-border flex items-center justify-center shrink-0 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                      <Plus size={20} strokeWidth={2} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-brand-primary dark:group-hover:text-brand-primary transition-colors">
                        New branch
                      </h3>
                      <p className="text-xs text-foreground dark:text-muted mt-1 leading-relaxed">
                        Expand your retail footprint by provisioning an additional store location or outlet.
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/org/${orgId}/stores/new`}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-md bg-brand-primary hover:opacity-90 text-white text-xs font-bold transition-all duration-200 flex items-center justify-between shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                  >
                    <span>New branch</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </article>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}