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
//   Building2
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
//   { label: "POS Terminal", path: "", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: Monitor },
//   { label: "Inventory & Stock", path: "/inventory", allowedRoles: ["OWNER", "MANAGER"], icon: Package },
//   { label: "Sales History", path: "/history", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: History },
//   { label: "Store Settings", path: "/settings", allowedRoles: ["OWNER"], icon: Settings },
// ];

// export function Sidebar({ organizationId, businessId }: SidebarProps) {
//   const { data: session } = useSession();
//   const pathname = usePathname();
//   const userRole = session?.user?.role || "CASHIER";

//   // Filter links safely using authorization rules
//   const visibleLinks = NAVIGATION_SCHEMA.filter((link) => 
//     link.allowedRoles.includes(userRole)
//   );

//   return (
//     <aside className="w-60 bg-slate-900 border-r border-slate-800 min-h-screen p-4 flex flex-col justify-between shrink-0 text-slate-200 select-none">
//       <div className="space-y-6">
        
//         {/* Branch Context Workspace Switcher Header */}
//         <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 shadow-inner flex items-center justify-between gap-2">
//           <div className="flex items-center gap-2.5 min-w-0">
//             <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-sm">
//               <Building2 className="w-4 h-4" />
//             </div>
//             <div className="truncate min-w-0">
//               <h2 className="text-xs font-black uppercase tracking-wider text-white truncate leading-none">
//                 Tawala Node
//               </h2>
//               <span className="text-[10px] font-mono text-slate-500 font-bold block mt-1 tracking-tight">
//                 ID: {businessId?.slice(0, 8)}
//               </span>
//             </div>
//           </div>

//           {/* Trigger Node for future dropdown matrix component placement */}
//           {(userRole === "OWNER" || userRole === "MANAGER") && (
//             <button
//               onClick={() => console.log("Trigger dynamic modal system")}
//               className="p-1 text-slate-500 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
//               aria-label="Switch store branch location context"
//             >
//               <ChevronsUpDown className="w-4 h-4" />
//             </button>
//           )}
//         </div>

//         {/* Dynamic Nav link section partition label */}
//         <div className="px-1">
//           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
//             Operation Management
//           </p>
          
//           {/* Navigation Matrix */}
//           <nav className="space-y-1 mt-2.5" aria-label="Terminal Primary Workspace Navigation">
//             {visibleLinks.map((link) => {
//               const href = `/org/${organizationId}/${businessId}${link.path}`;
              
//               // Dynamic highlighting mapping checks
//               const isActive = link.path === "" 
//                 ? pathname === href 
//                 : pathname.startsWith(href);
                
//               const Icon = link.icon;

//               return (
//                 <Link
//                   key={link.label + link.path}
//                   href={href}
//                   aria-current={isActive ? "page" : undefined}
//                   className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-150 group ${
//                     isActive
//                       ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-[1.01]"
//                       : "text-slate-400 hover:bg-slate-800/60 hover:text-white hover:translate-x-0.5"
//                   }`}
//                 >
//                   <Icon className={`w-4 h-4 shrink-0 transition-colors ${
//                     isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
//                   }`} />
//                   <span className="truncate">{link.label}</span>
//                 </Link>
//               );
//             })}
//           </nav>
//         </div>
//       </div>

//       {/* Operator Session Context Footer */}
//       <div className="space-y-2">
//         <div className="bg-slate-950/40 border border-slate-800/40 p-2.5 rounded-xl flex items-center justify-between gap-2.5">
//           <div className="flex items-center gap-2.5 min-w-0">
//             <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700/50 shadow-inner">
//               {session?.user?.name ? (
//                 session.user.name[0].toUpperCase()
//               ) : (
//                 <User className="w-4 h-4" />
//               )}
//             </div>
//             <div className="truncate min-w-0">
//               <p className="text-xs font-bold text-slate-200 truncate leading-tight">
//                 {session?.user?.name || "Terminal User"}
//               </p>
//               <span className="inline-block px-1.5 py-0.5 bg-slate-800 text-[8px] font-black text-slate-400 rounded uppercase tracking-wider scale-95 origin-left mt-0.5 border border-slate-700/40">
//                 {userRole}
//               </span>
//             </div>
//           </div>

//           <button
//             onClick={() => signOut({ callbackUrl: "/login" })}
//             className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer group"
//             title="Terminate operator system access session"
//           >
//             <LogOut className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
//           </button>
//         </div>
//       </div>
//     </aside>
//   );
// }

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  Monitor, 
  Package, 
  History, 
  Settings, 
  ChevronsUpDown,
  User,
  LogOut,
  Building2
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
  { label: "POS Terminal", path: "", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: Monitor },
  { label: "Inventory & Stock", path: "/inventory", allowedRoles: ["OWNER", "MANAGER"], icon: Package },
  { label: "Sales History", path: "/history", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: History },
  { label: "Store Settings", path: "/settings", allowedRoles: ["OWNER"], icon: Settings },
];

export function Sidebar({ organizationId, businessId }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userRole = session?.user?.role || "CASHIER";

  // Filter links safely using authorization rules
  const visibleLinks = NAVIGATION_SCHEMA.filter((link) => 
    link.allowedRoles.includes(userRole)
  );

  return (
    <aside className="w-60 bg-card border-r border-border/40 min-h-screen p-4 flex flex-col justify-between shrink-0 text-foreground select-none">
      <div className="space-y-6">
        
        {/* Branch Context Workspace Switcher Header - Nested Surface Sheet Container */}
        <div className="bg-surface border border-border/40 rounded-xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="truncate min-w-0">
              <h2 className="text-xs font-black uppercase tracking-wider text-foreground truncate leading-none">
                Tawala Node
              </h2>
              <span className="text-[10px] font-mono text-muted font-bold block mt-1 tracking-tight">
                ID: {businessId?.slice(0, 8)}
              </span>
            </div>
          </div>

          {/* Trigger Node for future dropdown matrix component placement */}
          {(userRole === "OWNER" || userRole === "MANAGER") && (
            <button
              onClick={() => console.log("Trigger dynamic modal system")}
              className="p-1 text-muted hover:text-foreground rounded-md hover:bg-background border border-transparent hover:border-border/40 transition-colors cursor-pointer"
              aria-label="Switch store branch location context"
            >
              <ChevronsUpDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dynamic Nav link section partition label */}
        <div className="px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
            Operation Management
          </p>
          
          {/* Navigation Matrix */}
          <nav className="space-y-1 mt-2.5" aria-label="Terminal Primary Workspace Navigation">
            {visibleLinks.map((link) => {
              const href = `/org/${organizationId}/${businessId}${link.path}`;
              
              // Dynamic highlighting mapping checks
              const isActive = link.path === "" 
                ? pathname === href 
                : pathname.startsWith(href);
                
              const Icon = link.icon;

              return (
                <Link
                  key={link.label + link.path}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-150 group ${
                    isActive
                      ? "bg-brand-primary text-background font-black shadow-md shadow-brand-primary/20 scale-[1.01]"
                      : "text-muted hover:bg-surface hover:text-foreground hover:translate-x-0.5"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-background" : "text-muted group-hover:text-foreground"
                  }`} />
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Operator Session Context Footer */}
      <div className="space-y-2">
        <div className="bg-surface border border-border/40 p-2.5 rounded-xl flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-background text-foreground flex items-center justify-center font-bold text-xs shrink-0 border border-border/40 shadow-inner">
              {session?.user?.name ? (
                session.user.name[0].toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-bold text-foreground truncate leading-tight">
                {session?.user?.name || "Terminal User"}
              </p>
              <span className="inline-block px-1.5 py-0.5 bg-background text-[8px] font-black text-brand-accent rounded uppercase tracking-wider scale-95 origin-left mt-0.5 border border-border/40">
                {userRole}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 text-muted hover:text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-all cursor-pointer group"
            title="Terminate operator system access session"
          >
            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}