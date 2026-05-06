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
      label: "Register",
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
    <aside className="w-20 md:w-24 border-r border-border flex flex-col items-center py-8 bg-card z-50 shrink-0">
      <nav className="flex flex-col gap-6" aria-label="Terminal Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "p-4 rounded-2xl transition-all duration-200 group relative flex items-center justify-center",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110"
                  : "text-secondary hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="absolute left-full ml-6 bg-foreground text-background text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-[70] shadow-2xl border border-border">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
