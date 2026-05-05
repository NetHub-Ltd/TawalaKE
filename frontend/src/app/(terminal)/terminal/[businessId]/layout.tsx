"use client";

import React, { createContext, useContext } from "react";
import Link from "next/link";
import {
  usePathname,
  useParams,
  useSearchParams,
  useRouter,
} from "next/navigation";
import {
  Package,
  ShoppingCart,
  History,
  Building2,
  Settings,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBusinessContext, BusinessContext } from "@/features/business/hooks/useBusiness";



export default function TerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter(); // Initialize router for the "smart" back action
  const searchParams = useSearchParams();
  const businessName = searchParams.get("name") || "Sales Hub";
  const pathname = usePathname();
  const params = useParams();

  const businessId = params.businessId;

  // Guard: Don't load anything if we don't have the businessId
  if (!businessId) {
    return null;
  }

  const NAV_ITEMS = [
    { icon: Building2, label: "Home", href: `/terminal/${businessId}` },
    { icon: ShoppingCart, label: "Cart", href: `/terminal/${businessId}/cart` },
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
    <BusinessContext.Provider value={{ businessId, businessName }}>
      <div className="fixed inset-0 flex bg-background overflow-hidden select-none">
        {/* 1. PERSISTENT SIDE NAVIGATION */}
        <aside className="w-24 border-r border-border flex flex-col items-center py-8 gap-10 bg-card z-50 shadow-soft">
          <nav className="flex flex-col gap-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "p-4 rounded-2xl transition-all duration-300 group relative",
                    isActive
                      ? "bg-primary text-white shadow-lg scale-110"
                      : "text-secondary hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon size={24} />
                  <span className="absolute left-20 bg-foreground text-background text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 2. MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {/* SMART HEADER */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-8 z-40">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()} // The "Smart" part: uses browser history
                className="flex items-center gap-2 px-3 py-2 -ml-2 rounded-xl hover:bg-muted text-secondary hover:text-foreground transition-all group"
              >
                <ArrowLeft
                  size={20}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span className="">
                  Back
                </span>
              </button>

              <div className="h-4 w-px bg-border mx-2" />

              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground truncate">
                {businessName} <span className="mx-2 opacity-30">//</span>
                <span className="text-foreground">Terminal_01</span>
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Optional: Add a clock or user profile badge here */}
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest">
                System Online
              </div>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className="flex-1 overflow-auto custom-scrollbar relative">
            {children}
          </main>
        </div>
      </div>
    </BusinessContext.Provider>
  );
}