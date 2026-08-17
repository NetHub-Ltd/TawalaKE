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
  Users,
  CreditCard,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  BarChart3,
  Receipt,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react";

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

  const navItems = [
    {
      id: "overview",
      label: "Dashboard",
      href: `/org`,
      icon: LayoutDashboard,
      roles: ["OWNER", "MANAGER"],
    },
    {
      id: "stores",
      label: "Store Locations",
      href: `/org/new-store`,
      icon: Store,
      badge: `${activeCount}`,
      roles: ["OWNER", "MANAGER"],
    },
    // {
    //   id: "staff",
    //   label: "Staff & Permissions",
    //   href: `/org/${orgId}/staff`,
    //   icon: Users,
    //   roles: ["OWNER", "MANAGER"],
    // },
    // {
    //   id: "billing",
    //   label: "Billing & Subscription",
    //   href: `/org/${orgId}/billing`,
    //   icon: CreditCard,
    //   badge: "Pro",
    //   roles: ["OWNER"],
    // },
    // {
    //   id: "analytics",
    //   label: "Cross-Store Analytics",
    //   href: `/org/${orgId}/analytics`,
    //   icon: BarChart3,
    //   roles: ["OWNER", "MANAGER"],
    // },
    // {
    //   id: "tax-compliance",
    //   label: "Tax & E-Invoicing",
    //   href: `/org/${orgId}/tax-compliance`,
    //   icon: Receipt,
    //   roles: ["OWNER"],
    // },
    // {
    //   id: "audit-logs",
    //   label: "Security & Audit Logs",
    //   href: `/org/${orgId}/audit-logs`,
    //   icon: ShieldAlert,
    //   roles: ["OWNER"],
    // },
    {
      id: "settings",
      label: "Organization Settings",
      href: `/org/${orgId}/settings`,
      icon: Settings,
      roles: ["OWNER"],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out z-40 ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
        aria-label="Organization Navigation"
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold shadow-sm shadow-blue-500/20">
              <Building2 size={18} />
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                  TAWALA
                </h2>
                <p className="text-[10px] font-mono text-slate-400 truncate">
                  ID: {orgId.substring(0, 8)}...
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px] min-w-[44px] sm:min-h-[32px] sm:min-w-[32px]"
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
                className={`w-full min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    size={18}
                    className={`shrink-0 ${
                      isActive
                        ? "text-white"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    }`}
                  />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isSidebarCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
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
          <div className="p-3 m-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-slate-500 dark:text-slate-400">Store Capacity</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                {activeCount} / {maxLicenses}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${licensePercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold shrink-0 text-xs">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          {!isSidebarCollapsed && (
            <div className="truncate min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {userName}
              </p>
              <div className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-blue-500 shrink-0" />
                <span className="text-[10px] font-mono uppercase text-slate-400 truncate">
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
        <header className="h-16 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 z-30">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Organization Command Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Centralized multi-tenant footprint & governance console
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/support"
              className="hidden md:flex min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <HelpCircle size={16} />
              <span>Docs & Support</span>
            </Link>

            <Link
              href={`/org/${orgId}/stores/new`}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm shadow-blue-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Provision New Store</span>
              <span className="sm:hidden">New Store</span>
            </Link>
          </div>
        </header>

        {/* DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="max-w-7xl mx-auto space-y-8">
          
            {/* ACTIVE STORES GRID */}
            <section aria-label="Assigned Store Locations" className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Store size={14} className="text-blue-500" />
                  Active Store Locations ({businesses.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                {businesses.map((business) => (
                  <article
                    key={business.id}
                    className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all duration-200 flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <Store size={20} strokeWidth={2} />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                            Active
                          </span>

                          <Link
                            href={`#`}
                            aria-label={`Edit ${business.name} settings`}
                            className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            <Pencil size={14} />
                          </Link>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {business.name}
                        </h3>
                        {business.code && (
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            Code: {business.code}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <p className="text-[10px] text-slate-400">Today's Revenue</p>
                          <p className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {business.todaySales || "$4,120.00"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400">Registers Online</p>
                          <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {business.activeRegisters || 3} Terminals
                          </p>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/org/${orgId}/${business.id}/overview`}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-900 dark:text-slate-100 text-xs font-bold transition-all duration-200 flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <span>Launch Store Terminal</span>
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </article>
                ))}

                <article className="group bg-slate-100/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 hover:border-blue-500 transition-all duration-200 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600/10 group-hover:text-blue-600 transition-colors">
                      <Plus size={20} strokeWidth={2} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Provision New Branch
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Expand your retail footprint by provisioning an additional store location or outlet.
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/org/${orgId}/stores/new`}
                    className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all duration-200 flex items-center justify-between shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span>Provision Location</span>
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