"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Package,
  ShoppingCart,
  History,
  Building2,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function TerminalSidebar({
  businessId,
  organizationId,
}: {
  businessId: string;
  organizationId?: string;
}) {
  const pathname = usePathname();
  // Prefer prop; else parse /org/{orgId}/{businessId}/...
  const orgFromPath = pathname?.match(/^\/org\/([^/]+)/)?.[1];
  const orgId = organizationId || orgFromPath || "";
  const base = orgId ? `/org/${orgId}/${businessId}` : `/org`;

  const NAV_ITEMS = [
    { icon: Building2, label: "Dashboard", href: `${base}/terminal` },
    {
      icon: ShoppingCart,
      label: "Cart",
      href: `${base}/cart`,
    },
    {
      icon: Package,
      label: "Inventory",
      href: `${base}/inventory`,
    },
    {
      icon: History,
      label: "History",
      href: `${base}/sale-history`,
    },
    {
      icon: Settings,
      label: "Settings",
      href: `${base}/settings`,
    },
  ];

  return (
    <aside className="w-20 md:w-24 border-r border-border flex flex-col h-full bg-card z-50 shrink-0 overflow-hidden">
      {/* SCROLLABLE NAV BLOCK: 
        - h-full + overflow-y-auto isolates scrolling to the menu entries.
        - no-scrollbar or custom utility class can hide scroll rails if desired.
      */}
      <nav 
        className="flex-1 flex flex-col items-center gap-5 py-6 overflow-y-auto overflow-x-hidden min-h-0 w-full" 
        aria-label="Terminal Navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // Exact string match or nesting match strategy
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "w-[80%] aspect-square rounded-md transition-all duration-200 group relative flex flex-col items-center justify-center gap-1.5 text-center px-1",
                isActive
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-muted hover:bg-register hover:text-foreground",
              )}
            >
              {/* Dynamic Icon */}
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
              
              {/* CLEAR VISIBLE TEXT LABEL */}
              <span className={cn(
                "text-xs font-bold tracking-tight transition-colors line-clamp-1",
                isActive ? "text-white" : "text-muted group-hover:text-foreground"
              )}>
                {item.label}
              </span>

              {/* PERSISTENT HOVER TOOLTIP (Kept for premium styling context) */}
              <span className="absolute left-full ml-4 z-[70] whitespace-nowrap rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground opacity-0 shadow-sm transition-all group-hover:translate-x-0 group-hover:opacity-100 pointer-events-none -translate-x-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}