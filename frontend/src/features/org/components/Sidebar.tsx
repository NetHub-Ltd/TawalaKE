// "use client";

// import Link from "next/link";
// import { useParams, usePathname } from "next/navigation";
// import { useSession } from "next-auth/react";
// import { 
//   Monitor, 
//   Package, 
//   History, 
//   Settings, 
//   ChevronLeft,
//   User
// } from "lucide-react";
// import { ComponentType } from "react";

// interface SidebarLink {
//   label: string;
//   path: string;
//   allowedRoles: string[];
//   icon: ComponentType<{ className?: string }>;
// }

// // 1. Clean, Flat Schema completely stripped of Organization scopes
// const NAVIGATION_SCHEMA: SidebarLink[] = [
//   { label: "POS Terminal", path: "", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: Monitor },
//   { label: "Inventory & Stock", path: "/inventory", allowedRoles: ["OWNER", "MANAGER"], icon: Package },
//   { label: "Sales History", path: "/history", allowedRoles: ["OWNER", "MANAGER", "CASHIER"], icon: History },
//   { label: "Store Settings", path: "/settings", allowedRoles: ["OWNER"], icon: Settings },
// ];

// export function Sidebar() {
//   const { data: session } = useSession();
//   const pathname = usePathname();
//   const params = useParams();

//   const organizationId = params.organizationId as string;
//   const businessId = params.businessId as string; 
//   const userRole = session?.user?.role || "CASHIER";

//   // 2. Simple Role Filtering Guardrail
//   const visibleLinks = NAVIGATION_SCHEMA.filter((link) => 
//     link.allowedRoles.includes(userRole)
//   );

//   return (
//     <aside className="w-56 md:w-60 bg-[#f8fafc] border-r border-slate-200 min-h-screen p-4 flex flex-col justify-between shrink-0 selection:bg-blue-500 selection:text-white">
//       <div className="space-y-5">
        
//         {/* Simplified Business Terminal Branding Header */}
//         <div className="pb-3 border-b border-slate-200/60">
//           <h2 className="text-sm font-black italic uppercase tracking-tighter text-slate-900">
//             Tawala Terminal
//           </h2>
//           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 font-mono">
//             NODE // {businessId?.slice(0, 8)}
//           </p>
//         </div>

//         {/* Dynamic Context Switcher Placeholder (Visible to Owners/Managers for future scaling) */}
//         {(userRole === "OWNER" || userRole === "MANAGER") && (
//           <button
//             onClick={() => console.log("Future Context Switcher Modal Trigger")}
//             className="flex items-center justify-center gap-1.5 w-full py-2 px-3 text-[11px] font-bold text-blue-600 bg-blue-50/60 hover:bg-blue-100/80 active:bg-blue-100 rounded-xl transition-all border border-blue-100/50 group shadow-2xs cursor-pointer"
//           >
//             <ChevronLeft className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform" />
//             <span>Switch Store Branch</span>
//           </button>
//         )}

//         {/* Flat Business Navigation Stack */}
//         <nav className="space-y-1" aria-label="Terminal Navigation">
//           {visibleLinks.map((link) => {
//             // All href calculations are explicitly bound to the active terminal node path
//             const href = `/org/${organizationId}/terminal/${businessId}${link.path}`;
            
//             // Sub-path activation check (keeps link active on child sub-routes)
//             const isActive = link.path === "" 
//               ? pathname === href 
//               : pathname.startsWith(href);
              
//             const Icon = link.icon;

//             return (
//               <Link
//                 key={link.label + link.path}
//                 href={href}
//                 aria-current={isActive ? "page" : undefined}
//                 className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-tight transition-all duration-150 group ${
//                   isActive
//                     ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-[1.02]"
//                     : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 hover:translate-x-0.5"
//                 }`}
//               >
//                 <Icon className={`w-4 h-4 shrink-0 transition-colors ${
//                   isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
//                 }`} />
//                 <span className="truncate">{link.label}</span>
//               </Link>
//             );
//           })}
//         </nav>
//       </div>

//       {/* Operator Account Verification Profile Footer */}
//       <div className="bg-white border border-slate-200/60 p-2.5 rounded-xl flex items-center gap-2.5 shadow-2xs">
//         <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
//           {session?.user?.name ? (
//             session.user.name[0].toUpperCase()
//           ) : (
//             <User className="w-4 h-4" />
//           )}
//         </div>
//         <div className="truncate flex-1 min-w-0">
//           <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">
//             {session?.user?.name || "Terminal Operator"}
//           </p>
//           <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-[8px] font-black text-slate-500 rounded uppercase tracking-wider scale-95 origin-left mt-0.5">
//             {userRole}
//           </span>
//         </div>
//       </div>
//     </aside>
//   );
// }

// app/(organization)/org/[organizationId]/components/Sidebar.tsx
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
    <aside className="w-60 bg-slate-900 border-r border-slate-800 min-h-screen p-4 flex flex-col justify-between shrink-0 text-slate-200 select-none">
      <div className="space-y-6">
        
        {/* Branch Context Workspace Switcher Header */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 shadow-inner flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 shadow-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="truncate min-w-0">
              <h2 className="text-xs font-black uppercase tracking-wider text-white truncate leading-none">
                Tawala Node
              </h2>
              <span className="text-[10px] font-mono text-slate-500 font-bold block mt-1 tracking-tight">
                ID: {businessId?.slice(0, 8)}
              </span>
            </div>
          </div>

          {/* Trigger Node for future dropdown matrix component placement */}
          {(userRole === "OWNER" || userRole === "MANAGER") && (
            <button
              onClick={() => console.log("Trigger dynamic modal system")}
              className="p-1 text-slate-500 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Switch store branch location context"
            >
              <ChevronsUpDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dynamic Nav link section partition label */}
        <div className="px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            Operation Management
          </p>
          
          {/* Navigation Matrix */}
          <nav className="space-y-1 mt-2.5" aria-label="Terminal Primary Workspace Navigation">
            {visibleLinks.map((link) => {
              const href = `/org/${organizationId}/terminal/${businessId}${link.path}`;
              
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
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-[1.01]"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-white hover:translate-x-0.5"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
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
        <div className="bg-slate-950/40 border border-slate-800/40 p-2.5 rounded-xl flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-700/50 shadow-inner">
              {session?.user?.name ? (
                session.user.name[0].toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="truncate min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate leading-tight">
                {session?.user?.name || "Terminal User"}
              </p>
              <span className="inline-block px-1.5 py-0.5 bg-slate-800 text-[8px] font-black text-slate-400 rounded uppercase tracking-wider scale-95 origin-left mt-0.5 border border-slate-700/40">
                {userRole}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer group"
            title="Terminate operator system access session"
          >
            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}