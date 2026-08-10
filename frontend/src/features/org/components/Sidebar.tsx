// "use client";

// import React, { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useSession, signOut } from "next-auth/react";
// import {
//   Monitor,
//   Package,
//   History,
//   ChevronsUpDown,
//   User,
//   LogOut,
//   Building2,
//   LayoutDashboard,
//   Boxes,
//   Users2,
//   ChevronLeft,
//   ShieldAlert,
// } from "lucide-react";
// import { ComponentType } from "react";

// interface SidebarProps {
//   organizationId: string;
//   businessId: string;
// }

// interface SidebarLink {
//   label: string;
//   path: string;
//   allowedRoles: string[];
//   icon: ComponentType<{ className?: string; size?: number }>;
// }

// const NAVIGATION_SCHEMA: SidebarLink[] = [
//   {
//     label: "Overview",
//     path: "/overview",
//     allowedRoles: ["OWNER"],
//     icon: LayoutDashboard,
//   },
//   {
//     label: "Terminal",
//     path: "/terminal",
//     allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
//     icon: Monitor,
//   },
//   {
//     label: "Stock",
//     path: "/stock/audit",
//     allowedRoles: ["OWNER", "MANAGER"],
//     icon: Package,
//   },
//   {
//     label: "Sales History",
//     path: "/sale-history",
//     allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
//     icon: History,
//   },
//   {
//     label: "Products",
//     path: "/inventory",
//     allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
//     icon: Boxes,
//   },
//   {
//     label: "Staff",
//     path: "/staff",
//     allowedRoles: ["OWNER", "MANAGER"],
//     icon: Users2,
//   },
// ];

// export function Sidebar({ organizationId, businessId }: SidebarProps) {
//   const { data: session, status } = useSession();
//   const pathname = usePathname();
//   const [isCollapsed, setIsCollapsed] = useState(false);

//   const userRole = session?.user?.role as string | undefined;

//   // ── No role → block everything ──────────────────────────────────
//   if (status === "authenticated" && !userRole) {
//     return (
//       <aside className="w-64 min-h-screen bg-background border-r border-border/50 p-6 flex flex-col items-center justify-center text-center gap-4">
//         <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
//           <ShieldAlert size={22} />
//         </div>
//         <div>
//           <p className="text-sm font-medium text-foreground">
//             No role assigned
//           </p>
//           <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
//             Your account doesn’t have access to this workspace yet.
//           </p>
//         </div>
//         <button
//           onClick={() => signOut({ callbackUrl: "/login" })}
//           className="mt-2 h-9 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
//         >
//           Sign out
//         </button>
//       </aside>
//     );
//   }

//   // Still loading session
//   if (status === "loading" || !session) {
//     return (
//       <aside className="w-64 min-h-screen bg-background border-r border-border/50" />
//     );
//   }

//   const visibleLinks = NAVIGATION_SCHEMA.filter((link) =>
//     link.allowedRoles.includes(userRole!)
//   );

//   return (
//     <aside
//       className={`bg-background border-r border-border/50 min-h-screen flex flex-col shrink-0 transition-all duration-300 ease-in-out relative ${
//         isCollapsed ? "w-[72px]" : "w-60"
//       }`}
//       aria-label="Sidebar"
//     >
//       {/* Collapse handle */}
//       <button
//         onClick={() => setIsCollapsed(!isCollapsed)}
//         className="absolute top-1/2 -right-3 -translate-y-1/2 z-20 h-6 w-6 rounded-full bg-background border border-border/60 text-muted-foreground hover:text-foreground flex items-center justify-center shadow-sm transition"
//         aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
//       >
//         <ChevronLeft
//           size={14}
//           className={`transition-transform duration-300 ${
//             isCollapsed ? "rotate-180" : ""
//           }`}
//         />
//       </button>

//       <div className="flex-1 flex flex-col p-3 gap-5 overflow-hidden">
//         {/* Workspace header */}
//         <div
//           className={`rounded-xl  flex items-center gap-3 ${
//             isCollapsed ? "p-2 justify-center" : "p-2.5"
//           }`}
//         >
//           <div className="h-10 w-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
//             <Building2 size={20} />
//           </div>

//           {!isCollapsed && (
//             <div className="min-w-0 flex-1">
//               <p className="text-sm font-medium text-foreground truncate">
//                 Tawala
//               </p>
//               <p className="text-xs text-muted-foreground truncate">
//                 {businessId?.slice(0, 8)}
//               </p>
//             </div>
//           )}

//           {!isCollapsed &&
//             (userRole === "OWNER" || userRole === "MANAGER") && (
//               <button
//                 onClick={() => console.log("Switch branch")}
//                 className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 transition"
//                 aria-label="Switch store"
//               >
//                 <ChevronsUpDown size={16} />
//               </button>
//             )}
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 space-y-1" aria-label="Main">
//           {visibleLinks.map((link) => {
//             const href = `/org/${organizationId}/${businessId}${link.path}`;
//             const isActive =
//               link.path === ""
//                 ? pathname === href
//                 : pathname.startsWith(href);
//             const Icon = link.icon;

//             return (
//               <Link
//                 key={link.path}
//                 href={href}
//                 title={isCollapsed ? link.label : undefined}
//                 aria-current={isActive ? "page" : undefined}
//                 className={`flex items-center rounded-xl text-sm font-medium transition-colors ${
//                   isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
//                 } ${
//                   isActive
//                     ? "bg-brand-primary text-white"
//                     : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
//                 }`}
//               >
//                 <Icon
//                   size={20}
//                   className="shrink-0"
//                 />
//                 {!isCollapsed && (
//                   <span className="truncate">{link.label}</span>
//                 )}
//               </Link>
//             );
//           })}
//         </nav>
//       </div>

//       {/* User footer */}
//       <div className="p-3 border-t border-border/50">
//         <div
//           className={`rounded-xl bg-muted/30 flex items-center ${
//             isCollapsed ? "p-2 justify-center flex-col gap-2" : "p-2 gap-2.5"
//           }`}
//         >
//           <div className="h-9 w-9 rounded-lg bg-background border border-border/50 flex items-center justify-center text-sm font-medium text-foreground shrink-0">
//             {session.user?.name?.[0]?.toUpperCase() ?? (
//               <User size={16} />
//             )}
//           </div>

//           {!isCollapsed && (
//             <div className="min-w-0 flex-1">
//               <p className="text-sm font-medium text-foreground truncate">
//                 {session.user?.name || "User"}
//               </p>
//               <p className="text-xs text-muted-foreground capitalize">
//                 {userRole?.toLowerCase()}
//               </p>
//             </div>
//           )}

//           <button
//             onClick={() => signOut({ callbackUrl: "/login" })}
//             className={`rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 transition ${
//               isCollapsed ? "p-2" : "p-2"
//             }`}
//             title="Sign out"
//             aria-label="Sign out"
//           >
//             <LogOut size={18} />
//           </button>
//         </div>
//       </div>
//     </aside>
//   );
// }

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Monitor,
  Package,
  History,
  ChevronsUpDown,
  User,
  LogOut,
  Building2,
  LayoutDashboard,
  Boxes,
  Users2,
  ChevronLeft,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { ComponentType } from "react";

interface SidebarProps {
  organizationId: string;
  businessId: string;
}

interface SidebarLink {
  label: string;
  path: string;
  allowedRoles: string[];
  icon: LucideIcon;  // ← use this instead of ComponentType<...>
}

const NAVIGATION_SCHEMA: SidebarLink[] = [
  {
    label: "Overview",
    path: "/overview",
    allowedRoles: ["OWNER"],
    icon: LayoutDashboard,
  },
  {
    label: "Terminal",
    path: "/terminal",
    allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
    icon: Monitor,
  },
  {
    label: "Stock",
    path: "/stock/audit",
    allowedRoles: ["OWNER", "MANAGER"],
    icon: Package,
  },
  {
    label: "Sales History",
    path: "/sale-history",
    allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
    icon: History,
  },
  {
    label: "Products",
    path: "/inventory",
    allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
    icon: Boxes,
  },
  {
    label: "Staff",
    path: "/staff",
    allowedRoles: ["OWNER", "MANAGER"],
    icon: Users2,
  },
];

export function Sidebar({ organizationId, businessId }: SidebarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userRole = session?.user?.role as string | undefined;

  // ── No role → hard stop ─────────────────────────────────────────
  if (status === "authenticated" && !userRole) {
    return (
      <aside className="w-64 min-h-screen bg-background border-r border-border/50 p-6 flex flex-col items-center justify-center text-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <ShieldAlert size={22} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">No role assigned</p>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Your account doesn’t have access to this workspace yet.
          </p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-1 h-9 px-4 rounded-xl text-sm text-muted hover:text-foreground hover:bg-muted/40 transition"
        >
          Sign out
        </button>
      </aside>
    );
  }

  if (status === "loading" || !session) {
    return (
      <aside className="w-60 min-h-screen bg-background border-r border-border/50" />
    );
  }

  const visibleLinks = NAVIGATION_SCHEMA.filter((link) =>
    link.allowedRoles.includes(userRole!)
  );

  return (
    <aside
      className={`bg-background border-r border-border/50 min-h-screen flex flex-col shrink-0 transition-[width] duration-300 ease-out relative ${
        isCollapsed ? "w-[76px]" : "w-60"
      }`}
      aria-label="Sidebar"
    >
      {/* Edge toggle — tactile pill */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-1/2 -right-3 -translate-y-1/2 z-20 h-7 w-7 rounded-full
                   bg-card border border-border/70 text-muted
                   hover:text-brand-primary hover:border-brand-primary/30 hover:shadow-sm
                   flex items-center justify-center transition-all duration-200
                   active:scale-90"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          size={14}
          strokeWidth={2.25}
          className={`transition-transform duration-300 ease-out ${
            isCollapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      <div className="flex-1 flex flex-col p-2.5 gap-4 overflow-hidden">
        {/* Workspace chip */}
        <div
          className={`rounded-2xl  border border-border/40 flex items-center transition-all duration-300 ${
            isCollapsed ? "h-12 w-12 mx-auto justify-center" : "p-2.5 gap-3"
          }`}
        >
          <div
            className={`rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 transition-all duration-300 ${
              isCollapsed ? "h-9 w-9" : "h-10 w-10"
            }`}
          >
            <Building2 size={isCollapsed ? 18 : 20} strokeWidth={1.75} />
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1 animate-in fade-in duration-200">
              <p className="text-sm font-medium text-foreground truncate leading-tight">
                Tawala
              </p>
              <p className="text-[11px] text-muted truncate mt-0.5">
                {businessId?.slice(0, 8)}
              </p>
            </div>
          )}

          {!isCollapsed &&
            (userRole === "OWNER" || userRole === "MANAGER") && (
              <button
                onClick={() => console.log("Switch branch")}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-background/80 transition"
                aria-label="Switch store"
              >
                <ChevronsUpDown size={15} />
              </button>
            )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1" aria-label="Main">
          {visibleLinks.map((link) => {
            const href = `/org/${organizationId}/${businessId}${link.path}`;
            const isActive =
              link.path === ""
                ? pathname === href
                : pathname.startsWith(href);
            const Icon = link.icon;

            return (
              <Link
                key={link.path}
                href={href}
                title={isCollapsed ? link.label : undefined}
                aria-current={isActive ? "page" : undefined}
                className={`
                  group relative flex items-center rounded-xl text-sm font-medium
                  transition-all duration-200 ease-out
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40
                  ${
                    isCollapsed
                      ? "h-12 w-12 mx-auto justify-center"
                      : "gap-3 px-3 py-2.5"
                  }
                  ${
                    isActive
                      ? isCollapsed
                        ? "bg-brand-primary text-white shadow-md shadow-brand-primary/25"
                        : "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
                      : "text-muted hover:text-foreground hover:bg-muted/40"
                  }
                `}
              >
                <Icon
                  size={isCollapsed ? 22 : 20}
                  strokeWidth={isActive ? 2.1 : 1.75}
                  className={`shrink-0 transition-transform duration-200 ${
                    !isActive && "group-hover:scale-105"
                  }`}
                />

                {!isCollapsed && (
                  <span className="truncate animate-in fade-in duration-150">
                    {link.label}
                  </span>
                )}

                {/* Active indicator bar when collapsed */}
                {isCollapsed && isActive && (
                  <span className="absolute -left-[7px] top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-brand-primary" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User footer */}
      <div className="p-2.5 border-t border-border/40">
        <div
          className={`rounded-2xl bg-muted/25 border border-border/40 flex items-center transition-all duration-300 ${
            isCollapsed
              ? "h-12 w-12 mx-auto justify-center flex-col"
              : "p-2 gap-2.5"
          }`}
        >
          <div
            className={`rounded-xl bg-card border border-border/50 flex items-center justify-center text-sm font-medium text-foreground shrink-0 ${
              isCollapsed ? "h-9 w-9" : "h-9 w-9"
            }`}
          >
            {session.user?.name?.[0]?.toUpperCase() ?? <User size={16} />}
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate leading-tight">
                {session.user?.name || "User"}
              </p>
              <p className="text-[11px] text-muted capitalize mt-0.5">
                {userRole?.toLowerCase()}
              </p>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-xl text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition active:scale-95"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={17} strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* Sign out when collapsed — sits under avatar */}
        {isCollapsed && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-2 h-10 w-12 mx-auto flex items-center justify-center rounded-xl text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition active:scale-95"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </aside>
  );
}