// app/(organization)/org/[organizationId]/components/Sidebar.tsx
"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Monitor, 
  Package, 
  History, 
  Settings, 
  ChevronLeft,
  User
} from "lucide-react";
import { ComponentType } from "react";

interface SidebarLink {
  label: string;
  path: string;
  allowedRoles: string[];
  scope: "organization" | "business";
  icon: ComponentType<{ className?: string }>;
}

const NAVIGATION_SCHEMA: SidebarLink[] = [
  // --- ORGANIZATION LEVEL SCOPE ---
  { label: "Overview", path: "", allowedRoles: ["OWNER", "MANAGER"], scope: "organization", icon: LayoutDashboard },
  { label: "Stores & Registers", path: "/terminal", allowedRoles: ["OWNER"], scope: "organization", icon: Store },
  { label: "Staff Members", path: "/staff", allowedRoles: ["OWNER", "MANAGER"], scope: "organization", icon: Users },
  
  // --- BUSINESS TERMINAL LEVEL SCOPE ---
  { label: "POS Terminal", path: "", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], scope: "business", icon: Monitor },
  { label: "Inventory & Stock", path: "/inventory", allowedRoles: ["OWNER", "MANAGER"], scope: "business", icon: Package },
  { label: "Sales History", path: "/history", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], scope: "business", icon: History },
  { label: "Store Settings", path: "/settings", allowedRoles: ["OWNER"], scope: "business", icon: Settings },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const params = useParams();

  const organizationId = params.organizationId as string;
  const businessId = params.businessId as string;
  
  const userRole = session?.user?.role || "CASHIER";

  const visibleLinks = NAVIGATION_SCHEMA.filter((link) => {
    if (!link.allowedRoles.includes(userRole)) return false;
    if (link.scope === "business" && !businessId) return false;
    if (link.scope === "organization" && businessId && userRole === "CASHIER") return false;
    return true;
  });

  const getHref = (link: SidebarLink) => {
    if (link.scope === "business") {
      return `/org/${organizationId}/terminal/${businessId}${link.path}`;
    }
    return `/org/${organizationId}${link.path}`;
  };

  return (
    <aside className="w-56 md:w-60 bg-[#f8fafc] border-r border-slate-200 min-h-screen p-4 flex flex-col justify-between shrink-0 selection:bg-blue-500 selection:text-white">
      <div className="space-y-5">
        {/* Context-Aware Header */}
        <div className="pb-3 border-b border-slate-200/60">
          <h2 className="text-sm font-bold text-slate-800 truncate tracking-tight">
            {businessId ? "Store Terminal Node" : "Tawala HQ Admin"}
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 font-mono">
            {businessId ? `CTX: ${businessId.slice(0, 8)}` : "GLOBAL CONTROL"}
          </p>
        </div>

        {/* Dynamic Context Escape Button */}
        {businessId && (userRole === "OWNER" || userRole === "MANAGER") && (
          <Link
            href={`/org/${organizationId}/terminal`}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 text-[11px] font-bold text-blue-600 bg-blue-50/60 hover:bg-blue-100/80 active:bg-blue-100 rounded-lg transition-colors border border-blue-100/50 group"
          >
            <ChevronLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform" />
            <span>Switch Workspace</span>
          </Link>
        )}

        {/* Navigation Link Stack */}
        <nav className="space-y-0.5" aria-label="Main Navigation">
          {visibleLinks.map((link) => {
            const href = getHref(link);
            const isActive = pathname === href;
            const Icon = link.icon;

            return (
              <Link
                key={link.label + link.path}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/10"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                }`} />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Profile & Security Context Footer */}
      <div className="bg-white border border-slate-200/60 p-2.5 rounded-xl flex items-center gap-2.5 shadow-xs">
        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
          {session?.user?.name ? (
            session.user.name[0].toUpperCase()
          ) : (
            <User className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="truncate flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">
            {session?.user?.name || "Terminal User"}
          </p>
          <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-[8px] font-bold text-slate-500 rounded uppercase tracking-wider scale-95 origin-left mt-0.5">
            {userRole}
          </span>
        </div>
      </div>
    </aside>
  );
}