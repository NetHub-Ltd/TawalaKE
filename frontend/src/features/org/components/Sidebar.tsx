
// // src/components/Sidebar.tsx
// "use client";

// import React from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useSession, signOut } from "next-auth/react";
// import { 
//   Monitor, 
//   Package, 
//   History, 
//   Settings, 
//   ChevronsUpDown,
//   User,
//   LogOut,
//   Building2,
//   LayoutDashboard,
//   Boxes,
//   Users2,
//   FileSpreadsheet,
//   Store
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
//   icon: ComponentType<{ className?: string }>;
// }

// // 1. Meaningful dedicated icons correctly mapped contextually across links
// const NAVIGATION_SCHEMA: SidebarLink[] = [
//   { label: "Overview", path: "/overview", allowedRoles: ["OWNER"], icon: LayoutDashboard },
//   { label: "Terminal", path: "/terminal", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: Monitor },
//   { label: "Stock Management", path: "/stock/audit", allowedRoles: ["OWNER", "MANAGER"], icon: Package },
//   { label: "Sales History", path: "/sale-history", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: History },
//   { label: "Products", path: "/inventory", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: Boxes },
//   { label: "Staff", path: "/staff", allowedRoles: ["OWNER", "MANAGER"], icon: Users2 },
//   // { label: "Receipts and Invoices", path: "/#", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: FileSpreadsheet },
//   // { label: "Store Settings", path: "/#", allowedRoles: ["OWNER"], icon: Store },
// ];

// export function Sidebar({ organizationId, businessId }: SidebarProps) {
//   const { data: session } = useSession();
//   const pathname = usePathname();
//   const userRole = session?.user?.role || "CASHIER";

//   const visibleLinks = NAVIGATION_SCHEMA.filter((link) => 
//     link.allowedRoles.includes(userRole)
//   );

//   return (
//     <aside 
//       className="w-64 bg-card border-r border-border/60 min-h-screen p-2 flex flex-col justify-between shrink-0 text-foreground select-none"
//       aria-label="Application Sidebar"
//     >
//       <div className="space-y-6">
        
//         {/* Branch Context Workspace Switcher Header - Styled with soft rounded scaling */}
//         <div className="bg-surface/40 border border-border/40 rounded-2xl p-3 flex items-center justify-between gap-2 transition-all hover:bg-surface/60">
//           <div className="flex items-center gap-2.5 min-w-0">
//             <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0 transition-transform hover:rotate-6">
//               <Building2 className="w-4 h-4" />
//             </div>
//             <div className="truncate min-w-0">
//               <h2 className="text-xs font-black uppercase tracking-wider text-foreground truncate leading-none">
//                 Tawala Node
//               </h2>
//               <span className="text-xs font-mono text-muted font-bold block mt-1 tracking-tight">
//                 ID: {businessId?.slice(0, 8)}
//               </span>
//             </div>
//           </div>

//           {(userRole === "OWNER" || userRole === "MANAGER") && (
//             <button
//               onClick={() => console.log("Trigger dynamic modal system")}
//               className="p-1.5 text-muted hover:text-foreground rounded-xl hover:bg-background border border-border/40 transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
//               aria-label="Switch store branch location context"
//             >
//               <ChevronsUpDown className="w-4 h-4" />
//             </button>
//           )}
//         </div>

//         {/* Navigation Section */}
//         <div className="space-y-3">
          
//           {/* Playful, tactile spring-action layout link lists */}
//           <nav className="space-y-1.5" aria-label="Terminal Primary Workspace Navigation">
//             {visibleLinks.map((link) => {
//               const href = `/org/${organizationId}/${businessId}${link.path}`;
              
//               const isActive = link.path === "" 
//                 ? pathname === href 
//                 : pathname.startsWith(href);
                
//               const Icon = link.icon;

//               return (
//                 <Link
//                   key={link.label + link.path}
//                   href={href}
//                   aria-current={isActive ? "page" : undefined}
//                   className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
//                     isActive
//                       ? "bg-brand-primary text-background font-black shadow-md shadow-brand-primary/10 scale-[1.01]"
//                       : "text-muted hover:bg-surface/60 hover:text-foreground hover:translate-x-1"
//                   }`}
//                 >
//                   <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
//                     isActive ? "text-background scale-110" : "text-muted group-hover:text-foreground group-hover:scale-110"
//                   }`} />
//                   <span className="truncate">{link.label}</span>
//                 </Link>
//               );
//             })}
//           </nav>
//         </div>
//       </div>

//       {/* Operator Session Context Footer */}
//       <div className="pt-4 border-t border-border/40">
//         <div className="bg-surface/40 border border-border/40 p-2.5 rounded-2xl flex items-center justify-between gap-2.5 transition-all hover:bg-surface/60">
//           <div className="flex items-center gap-2.5 min-w-0">
//             <div className="w-9 h-9 rounded-xl bg-background text-foreground flex items-center justify-center font-bold text-xs shrink-0 border border-border/60 shadow-sm transition-transform hover:scale-105 hover:-rotate-3">
//               {session?.user?.name ? (
//                 session.user.name[0].toUpperCase()
//               ) : (
//                 <User className="w-4 h-4" />
//               )}
//             </div>
//             <div className="truncate min-w-0">
//               <p className="text-xs font-bold text-foreground truncate leading-tight">
//                 {session?.user?.name || "Terminal User"}
//               </p>
//               <span className="inline-block px-1.5 py-0.5 bg-background text-[10px] font-black text-brand-accent rounded uppercase tracking-wider mt-1 border border-border/40 shadow-xs">
//                 {userRole}
//               </span>
//             </div>
//           </div>

//           <button
//             onClick={() => signOut({ callbackUrl: "/login" })}
//             className="p-2 text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all cursor-pointer group active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
//             title="Terminate operator system access session"
//             aria-label="Sign out of system session"
//           >
//             <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
//           </button>
//         </div>
//       </div>
//     </aside>
//   );
// }

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
//   ChevronRight
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
//   icon: ComponentType<{ className?: string }>;
// }

// const NAVIGATION_SCHEMA: SidebarLink[] = [
//   { label: "Overview", path: "/overview", allowedRoles: ["OWNER"], icon: LayoutDashboard },
//   { label: "Terminal", path: "/terminal", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: Monitor },
//   { label: "Stock Management", path: "/stock/audit", allowedRoles: ["OWNER", "MANAGER"], icon: Package },
//   { label: "Sales History", path: "/sale-history", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: History },
//   { label: "Products", path: "/inventory", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: Boxes },
//   { label: "Staff", path: "/staff", allowedRoles: ["OWNER", "MANAGER"], icon: Users2 },
// ];

// export function Sidebar({ organizationId, businessId }: SidebarProps) {
//   const { data: session } = useSession();
//   const pathname = usePathname();
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const userRole = session?.user?.role || "CASHIER";

//   const visibleLinks = NAVIGATION_SCHEMA.filter((link) => 
//     link.allowedRoles.includes(userRole)
//   );

//   return (
//     <aside 
//       className={`bg-card border-r border-border/60 min-h-screen p-3 flex flex-col justify-between shrink-0 text-foreground select-none transition-all duration-300 ease-in-out relative ${
//         isCollapsed ? "w-20" : "w-64"
//       }`}
//       aria-label="Application Sidebar"
//     >
//       {/* Structural Upper Section Container */}
//       <div className="space-y-6">
        
//         {/* Branch Context Workspace Switcher Header Panel */}
//         <div className={`bg-surface/40 border border-border/40 rounded-2xl flex items-center gap-2 transition-all hover:bg-surface/60 ${
//           isCollapsed ? "p-2 justify-center" : "p-3 justify-between"
//         }`}>
//           <div className="flex items-center gap-2.5 min-w-0">
//             <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0 transition-transform hover:rotate-6">
//               <Building2 className="w-4 h-4" />
//             </div>
            
//             {!isCollapsed && (
//               <div className="truncate min-w-0 animate-in fade-in duration-200">
//                 <h2 className="text-xs font-black uppercase tracking-wider text-foreground truncate leading-none">
//                   Tawala Node
//                 </h2>
//                 <span className="text-xs font-mono text-muted font-bold block mt-1 tracking-tight">
//                   ID: {businessId?.slice(0, 8)}
//                 </span>
//               </div>
//             )}
//           </div>

//           {!isCollapsed && (userRole === "OWNER" || userRole === "MANAGER") && (
//             <button
//               onClick={() => console.log("Trigger dynamic modal system")}
//               className="p-1.5 text-muted hover:text-foreground rounded-xl hover:bg-background border border-border/40 transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
//               aria-label="Switch store branch location context"
//             >
//               <ChevronsUpDown className="w-4 h-4" />
//             </button>
//           )}
//         </div>

//         {/* Navigation Core Stream Wrapper */}
//         <div className="space-y-3">
//           <nav className="space-y-1.5" aria-label="Terminal Primary Workspace Navigation">
//             {visibleLinks.map((link) => {
//               const href = `/org/${organizationId}/${businessId}${link.path}`;
//               const isActive = link.path === "" ? pathname === href : pathname.startsWith(href);
//               const Icon = link.icon;

//               return (
//                 <Link
//                   key={link.label + link.path}
//                   href={href}
//                   aria-current={isActive ? "page" : undefined}
//                   title={isCollapsed ? link.label : undefined}
//                   className={`flex items-center rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary group ${
//                     isCollapsed ? "justify-center p-3" : "px-3.5 py-2.5 gap-3"
//                   } ${
//                     isActive
//                       ? "bg-brand-primary text-background font-black shadow-md shadow-brand-primary/10 scale-[1.01]"
//                       : "text-muted hover:bg-surface/60 hover:text-foreground"
//                   }`}
//                 >
//                   <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
//                     isActive ? "text-background scale-110" : "text-muted group-hover:text-foreground group-hover:scale-110"
//                   }`} />
                  
//                   {!isCollapsed && (
//                     <span className="truncate animate-in fade-in slide-in-from-left-1 duration-200">
//                       {link.label}
//                     </span>
//                   )}
//                 </Link>
//               );
//             })}
//           </nav>
//         </div>
//       </div>

//       {/* Operator Session Context Footer Space */}
//       <div className="pt-4 border-t border-border/40 space-y-3">
//         <div className={`bg-surface/40 border border-border/40 rounded-2xl flex items-center transition-all hover:bg-surface/60 ${
//           isCollapsed ? "p-2 justify-center flex-col gap-2" : "p-2.5 justify-between gap-2.5"
//         }`}>
//           <div className="flex items-center gap-2.5 min-w-0">
//             <div className="w-9 h-9 rounded-xl bg-background text-foreground flex items-center justify-center font-bold text-xs shrink-0 border border-border/60 shadow-sm transition-transform hover:scale-105 hover:-rotate-3">
//               {session?.user?.name ? (
//                 session.user.name[0].toUpperCase()
//               ) : (
//                 <User className="w-4 h-4" />
//               )}
//             </div>
            
//             {!isCollapsed && (
//               <div className="truncate min-w-0 animate-in fade-in duration-200">
//                 <p className="text-xs font-bold text-foreground truncate leading-tight">
//                   {session?.user?.name || "Terminal User"}
//                 </p>
//                 <span className="inline-block px-1.5 py-0.5 bg-background text-[10px] font-black text-brand-accent rounded uppercase tracking-wider mt-1 border border-border/40 shadow-xs">
//                   {userRole}
//                 </span>
//               </div>
//             )}
//           </div>

//           <button
//             onClick={() => signOut({ callbackUrl: "/login" })}
//             className={`text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all cursor-pointer group active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
//               isCollapsed ? "p-2.5 w-full flex justify-center" : "p-2"
//             }`}
//             title="Terminate operator system access session"
//             aria-label="Sign out of system session"
//           >
//             <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
//           </button>
//         </div>

//         {/* Interactive Responsive Collapse Control Trigger */}
//         <button
//           onClick={() => setIsCollapsed(!isCollapsed)}
//           className="w-full py-2 bg-surface hover:bg-surface/80 border border-border/40 text-muted hover:text-foreground rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
//           aria-label={isCollapsed ? "Expand sidebar navigation view" : "Collapse sidebar navigation view"}
//           title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
//         >
//           {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
//         </button>
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
  ChevronLeft
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
  icon: ComponentType<{ className?: string }>;
}

const NAVIGATION_SCHEMA: SidebarLink[] = [
  { label: "Overview", path: "/overview", allowedRoles: ["OWNER"], icon: LayoutDashboard },
  { label: "Terminal", path: "/terminal", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: Monitor },
  { label: "Stock Management", path: "/stock/audit", allowedRoles: ["OWNER", "MANAGER"], icon: Package },
  { label: "Sales History", path: "/sale-history", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: History },
  { label: "Products", path: "/inventory", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: Boxes },
  { label: "Staff", path: "/staff", allowedRoles: ["OWNER", "MANAGER"], icon: Users2 },
];

export function Sidebar({ organizationId, businessId }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const userRole = session?.user?.role || "CASHIER";

  const visibleLinks = NAVIGATION_SCHEMA.filter((link) => 
    link.allowedRoles.includes(userRole)
  );

  return (
    <aside 
      className={`bg-card border-r border-border/60 min-h-screen p-3 flex flex-col justify-between shrink-0 text-foreground select-none transition-all duration-300 ease-in-out relative ${
        isCollapsed ? "w-20" : "w-64"
      }`}
      aria-label="Application Sidebar"
    >
      {/* 
        Tactile Edge Toggle Handle:
        - Absolute-centered vertically along the border edge.
        - Rotates the Chevron icon based on collapse status.
      */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-1/2 -right-3.5 -translate-y-1/2 z-50 w-7 h-7 bg-card hover:bg-surface border border-border/60 text-muted hover:text-foreground rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label={isCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <ChevronLeft 
          className={`w-4 h-4 transition-transform duration-300 ${
            isCollapsed ? "rotate-180" : "rotate-0"
          }`} 
        />
      </button>

      {/* Structural Upper Section */}
      <div className="space-y-6">
        
        {/* Branch Context Workspace Switcher Header Panel */}
        <div className={`bg-surface/40 border border-border/40 rounded-2xl flex items-center gap-2 transition-all hover:bg-surface/60 ${
          isCollapsed ? "p-2 justify-center" : "p-3 justify-between"
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0 transition-transform hover:rotate-6">
              <Building2 className="w-4 h-4" />
            </div>
            
            {!isCollapsed && (
              <div className="truncate min-w-0 animate-in fade-in duration-200">
                <h2 className="text-xs font-black uppercase tracking-wider text-foreground truncate leading-none">
                  Tawala Node
                </h2>
                <span className="text-xs font-mono text-muted font-bold block mt-1 tracking-tight">
                  ID: {businessId?.slice(0, 8)}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (userRole === "OWNER" || userRole === "MANAGER") && (
            <button
              onClick={() => console.log("Trigger dynamic modal system")}
              className="p-1.5 text-muted hover:text-foreground rounded-xl hover:bg-background border border-border/40 transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Switch store branch location context"
            >
              <ChevronsUpDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Core Stream */}
        <div className="space-y-3">
          <nav className="space-y-1.5" aria-label="Terminal Primary Workspace Navigation">
            {visibleLinks.map((link) => {
              const href = `/org/${organizationId}/${businessId}${link.path}`;
              const isActive = link.path === "" ? pathname === href : pathname.startsWith(href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.label + link.path}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  title={isCollapsed ? link.label : undefined}
                  className={`flex items-center rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary group ${
                    isCollapsed ? "justify-center p-3" : "px-3.5 py-2.5 gap-3"
                  } ${
                    isActive
                      ? "bg-brand-primary text-background font-black shadow-md shadow-brand-primary/10 scale-[1.01]"
                      : "text-muted hover:bg-surface/60 hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isActive ? "text-background scale-110" : "text-muted group-hover:text-foreground group-hover:scale-110"
                  }`} />
                  
                  {!isCollapsed && (
                    <span className="truncate animate-in fade-in slide-in-from-left-1 duration-200">
                      {link.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Operator Session Context Footer */}
      <div className="pt-4 border-t border-border/40">
        <div className={`bg-surface/40 border border-border/40 rounded-2xl flex items-center transition-all hover:bg-surface/60 ${
          isCollapsed ? "p-2 justify-center flex-col gap-2" : "p-2.5 justify-between gap-2.5"
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-background text-foreground flex items-center justify-center font-bold text-xs shrink-0 border border-border/60 shadow-sm transition-transform hover:scale-105 hover:-rotate-3">
              {session?.user?.name ? (
                session.user.name[0].toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            
            {!isCollapsed && (
              <div className="truncate min-w-0 animate-in fade-in duration-200">
                <p className="text-xs font-bold text-foreground truncate leading-tight">
                  {session?.user?.name || "Terminal User"}
                </p>
                <span className="inline-block px-1.5 py-0.5 bg-background text-[10px] font-black text-brand-accent rounded uppercase tracking-wider mt-1 border border-border/40 shadow-xs">
                  {userRole}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={`text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all cursor-pointer group active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
              isCollapsed ? "p-2.5 w-full flex justify-center" : "p-2"
            }`}
            title="Terminate operator system access session"
            aria-label="Sign out of system session"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}