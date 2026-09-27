"use client";

/**
 * Replaces the browser default context menu inside the org shell
 * with actions the current role can actually use.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Monitor,
  Package,
  History,
  Users,
  Wallet,
  Settings,
  ExternalLink,
} from "lucide-react";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { Permission, type PermissionKey } from "@/lib/rbac";

type MenuItem = {
  id: string;
  label: string;
  href?: string;
  permission?: PermissionKey | PermissionKey[];
  icon: React.ReactNode;
  dividerAfter?: boolean;
};

export function AppContextMenu({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const { can, canAny, isLoading } = usePermissions();
  const organizationId = String(params?.organizationId || "");
  const businessId = String(params?.businessId || "");

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const base = organizationId && businessId
    ? `/org/${organizationId}/${businessId}`
    : organizationId
      ? `/org/${organizationId}`
      : "";

  const items: MenuItem[] = useMemo(() => {
    if (!base) return [];
    return [
      {
        id: "overview",
        label: "Overview",
        href: `${base}/overview`,
        permission: Permission.REPORTS_READ,
        icon: <LayoutDashboard size={14} />,
      },
      {
        id: "terminal",
        label: "New sale (Terminal)",
        href: `${base}/terminal`,
        permission: Permission.SALES_WRITE,
        icon: <Monitor size={14} />,
        dividerAfter: true,
      },
      {
        id: "stock",
        label: "Stock",
        href: `${base}/stock`,
        permission: [Permission.STOCK_READ, Permission.STOCK_RECEIVE],
        icon: <Package size={14} />,
      },
      {
        id: "sales",
        label: "Sales history",
        href: `${base}/sales`,
        permission: [Permission.SALES_READ_OWN, Permission.SALES_READ_BUSINESS],
        icon: <History size={14} />,
      },
      {
        id: "customers",
        label: "Customers",
        href: `${base}/customers`,
        permission: Permission.CUSTOMERS_READ,
        icon: <Users size={14} />,
      },
      {
        id: "expenses",
        label: "Expenses",
        href: `${base}/expenses`,
        permission: Permission.EXPENSES_READ,
        icon: <Wallet size={14} />,
        dividerAfter: true,
      },
      {
        id: "settings",
        label: "Branch settings",
        href: `${base}/settings`,
        permission: Permission.STORE_WRITE,
        icon: <Settings size={14} />,
      },
    ];
  }, [base]);

  const visible = useMemo(() => {
    if (isLoading) return [];
    return items.filter((item) => {
      if (!item.permission) return true;
      if (Array.isArray(item.permission)) return canAny(item.permission);
      return can(item.permission);
    });
  }, [items, can, canAny, isLoading]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      // Allow native menu on inputs/textareas for copy-paste
      const t = e.target as HTMLElement | null;
      if (
        t?.closest(
          "input, textarea, select, [contenteditable=true], a[href], button",
        )
      ) {
        return;
      }
      if (!visible.length) return;
      e.preventDefault();
      const pad = 8;
      const mw = 220;
      const mh = Math.min(320, visible.length * 36 + 16);
      let x = e.clientX;
      let y = e.clientY;
      if (x + mw > window.innerWidth - pad) x = window.innerWidth - mw - pad;
      if (y + mh > window.innerHeight - pad) y = window.innerHeight - mh - pad;
      setPos({ x, y });
      setOpen(true);
    },
    [visible.length],
  );

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative h-full min-h-0 w-full" onContextMenu={onContextMenu}>
      {children}
      {open && visible.length > 0 && (
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[200] min-w-[200px] overflow-hidden rounded-md border border-border bg-card py-1 shadow-lg"
          style={{ left: pos.x, top: pos.y }}
        >
          {visible.map((item) => (
            <React.Fragment key={item.id}>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-foreground transition-colors hover:bg-register"
                onClick={() => {
                  setOpen(false);
                  if (item.href) router.push(item.href);
                }}
              >
                <span className="text-muted">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                <ExternalLink size={12} className="text-muted opacity-50" />
              </button>
              {item.dividerAfter ? (
                <div className="my-1 border-t border-border/60" />
              ) : null}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
