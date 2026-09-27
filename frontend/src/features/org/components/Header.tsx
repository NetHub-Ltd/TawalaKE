"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Bell, HelpCircle, Settings } from "lucide-react";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";

function pageLabel(pathname: string, businessId?: string): string {
  if (!businessId || !pathname.includes(String(businessId))) return "Workspace";
  const after = pathname.split(String(businessId))[1] || "";
  const seg = after.split("/").filter(Boolean)[0] || "overview";
  const map: Record<string, string> = {
    overview: "Overview",
    terminal: "Terminal",
    checkout: "Checkout",
    "complete-sale": "Sale complete",
    stock: "Stock",
    sales: "Sales history",
    customers: "Customers",
    expenses: "Expenses",
    settings: "Settings",
    sale: "Document",
    cart: "Cart",
  };
  return map[seg] || seg.replace(/-/g, " ");
}

export function Header() {
  const params = useParams();
  const pathname = usePathname() || "";
  const { businessId: ctxBiz, organizationId: ctxOrg, businessName: ctxName } =
    useBusinessContext();

  const businessId = String(params?.businessId || ctxBiz || "");
  const organizationId = String(params?.organizationId || ctxOrg || "");

  const [branchName, setBranchName] = useState(
    ctxName && ctxName !== "Terminal Node" ? String(ctxName) : "Branch",
  );

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/v1/org/stores/${businessId}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const body = await res.json();
        const data = body?.data || body;
        const name = data?.name || data?.business_name;
        if (!cancelled && name) setBranchName(String(name));
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const label = pageLabel(pathname, businessId);
  const settingsHref =
    organizationId && businessId
      ? `/org/${organizationId}/${businessId}/settings`
      : "#";

  return (
    <header className="relative z-40 flex h-14 w-full shrink-0 items-center justify-between border-b border-border/50 bg-card px-5">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold tracking-tight text-foreground">
          {branchName}
        </p>
        <p className="truncate text-[11px] text-muted">{label}</p>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-register hover:text-foreground"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={15} />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-register hover:text-foreground"
          title="Help"
          aria-label="Help"
        >
          <HelpCircle size={15} />
        </button>
        <Link
          href={settingsHref}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-register hover:text-foreground"
          title="Branch settings"
          aria-label="Branch settings"
        >
          <Settings size={15} />
        </Link>
      </div>
    </header>
  );
}
