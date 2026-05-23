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

export function TerminalSidebar({ businessId }: { businessId: string }) {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { icon: Building2, label: "Dashboard", href: `/terminal/${businessId}` },
    {
      icon: ShoppingCart,
      label: "Cart",
      href: `/terminal/${businessId}/cart`,
    },
    {
      icon: Package,
      label: "Inventory",
      href: `/terminal/${businessId}/inventory`,
    },
    {
      icon: History,
      label: "History",
      href: `/terminal/${businessId}/history`,
    },
    {
      icon: Settings,
      label: "Settings",
      href: `/terminal/${businessId}/settings`,
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
                "w-[80%] aspect-square rounded-2xl transition-all duration-200 group relative flex flex-col items-center justify-center gap-1.5 text-center px-1",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "text-secondary hover:bg-muted hover:text-foreground",
              )}
            >
              {/* Dynamic Icon */}
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
              
              {/* CLEAR VISIBLE TEXT LABEL */}
              <span className={cn(
                "text-[10px] font-bold tracking-tight transition-colors line-clamp-1",
                isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {item.label}
              </span>

              {/* PERSISTENT HOVER TOOLTIP (Kept for premium styling context) */}
              <span className="absolute left-full ml-4 bg-foreground text-background text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-[70] shadow-2xl border border-border">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}