// // "use client";

// // import React, { useState } from "react";
// // import Link from "next/link";
// // import { usePathname } from "next/navigation";
// // import { useSession, signOut } from "next-auth/react";
// // import {
// //   Monitor,
// //   Package,
// //   History,
// //   ChevronsUpDown,
// //   User,
// //   LogOut,
// //   Building2,
// //   LayoutDashboard,
// //   Boxes,
// //   Users2,
// //   ChevronLeft,
// //   type LucideIcon,
// // } from "lucide-react";

// // interface SidebarProps {
// //   organizationId: string;
// //   businessId: string;
// // }

// // interface SidebarLink {
// //   label: string;
// //   path: string;
// //   allowedRoles: string[];
// //   icon: LucideIcon;
// // }

// // const NAVIGATION_SCHEMA: SidebarLink[] = [
// //   {
// //     label: "Overview",
// //     path: "/overview",
// //     allowedRoles: ["OWNER"],
// //     icon: LayoutDashboard,
// //   },
// //   {
// //     label: "Terminal",
// //     path: "/terminal",
// //     allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
// //     icon: Monitor,
// //   },
// //   {
// //     label: "Stock",
// //     path: "/stock/audit",
// //     allowedRoles: ["OWNER", "MANAGER"],
// //     icon: Package,
// //   },
// //   {
// //     label: "Sales History",
// //     path: "/sale-history",
// //     allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
// //     icon: History,
// //   },
// //   {
// //     label: "Products",
// //     path: "/inventory",
// //     allowedRoles: ["OWNER", "MANAGER", "CASHIER"],
// //     icon: Boxes,
// //   },
// //   {
// //     label: "Staff",
// //     path: "/staff",
// //     allowedRoles: ["OWNER", "MANAGER"],
// //     icon: Users2,
// //   },
// // ];

// // /** Soft pulse block used while session / nav is resolving */
// // function Skeleton({ className = "" }: { className?: string }) {
// //   return (
// //     <div
// //       className={`animate-pulse rounded-xl bg-slate-100 ${className}`}
// //       aria-hidden="true"
// //     />
// //   );
// // }

// // /** Full sidebar chrome in skeleton form — never a blank white column */
// // function SidebarSkeleton() {
// //   return (
// //     <aside
// //       className="w-60 min-h-screen bg-white border-r border-border/50 flex flex-col shrink-0 p-2.5 gap-4"
// //       aria-label="Sidebar loading"
// //       aria-busy="true"
// //     >
// //       <div className="rounded-2xl border border-border/40 p-2.5 flex items-center gap-3">
// //         <Skeleton className="h-10 w-10 shrink-0" />
// //         <div className="flex-1 space-y-2">
// //           <Skeleton className="h-3.5 w-20" />
// //           <Skeleton className="h-3 w-14" />
// //         </div>
// //       </div>

// //       <div className="flex-1 space-y-2 pt-1">
// //         {Array.from({ length: 5 }).map((_, i) => (
// //           <div key={i} className="flex items-center gap-3 px-3 py-2.5">
// //             <Skeleton className="h-5 w-5 shrink-0 rounded-lg" />
// //             <Skeleton className="h-3.5 flex-1 max-w-[7rem]" />
// //           </div>
// //         ))}
// //       </div>

// //       <div className="pt-2 border-t border-border/40">
// //         <div className="rounded-2xl border border-border/40 p-2 flex items-center gap-2.5">
// //           <Skeleton className="h-9 w-9 shrink-0" />
// //           <div className="flex-1 space-y-2">
// //             <Skeleton className="h-3.5 w-24" />
// //             <Skeleton className="h-3 w-12" />
// //           </div>
// //           <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
// //         </div>
// //       </div>
// //     </aside>
// //   );
// // }

// // export function Sidebar({ organizationId, businessId }: SidebarProps) {
// //   const { data: session, status } = useSession();
// //   const pathname = usePathname();
// //   const [isCollapsed, setIsCollapsed] = useState(false);

// //   // Normalize role (API / JWT sometimes differ in casing)
// //   const userRole = (
// //     session?.user as { role?: string } | undefined
// //   )?.role?.toUpperCase();

// //   /**
// //    * Session still hydrating OR authenticated but role not on the client
// //    * token yet → keep skeletons. Do not show "no access" here; layout
// //    * guards already ensured this user can open the workspace.
// //    */
// //   const isResolving =
// //     status === "loading" ||
// //     (status === "authenticated" && !userRole) ||
// //     (status !== "unauthenticated" && !session);

// //   if (isResolving) {
// //     return <SidebarSkeleton />;
// //   }

// //   // Unauthenticated on this tree is unexpected; still avoid a blank rail
// //   if (status === "unauthenticated" || !session) {
// //     return <SidebarSkeleton />;
// //   }

// //   const visibleLinks = NAVIGATION_SCHEMA.filter((link) =>
// //     link.allowedRoles.includes(userRole!)
// //   );

// //   return (
// //     <aside
// //       className={`bg-white border-r border-border/50 min-h-screen flex flex-col shrink-0 transition-[width] duration-300 ease-out relative ${
// //         isCollapsed ? "w-[76px]" : "w-60"
// //       }`}
// //       aria-label="Sidebar"
// //     >
// //       <button
// //         onClick={() => setIsCollapsed(!isCollapsed)}
// //         className="absolute top-1/2 -right-3 -translate-y-1/2 z-20 h-7 w-7 rounded-full
// //                    bg-white border border-border/70 text-muted
// //                    hover:text-brand-primary hover:border-brand-primary/30 hover:shadow-sm
// //                    flex items-center justify-center transition-all duration-200
// //                    active:scale-90"
// //         aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
// //       >
// //         <ChevronLeft
// //           size={14}
// //           strokeWidth={2.25}
// //           className={`transition-transform duration-300 ease-out ${
// //             isCollapsed ? "rotate-180" : ""
// //           }`}
// //         />
// //       </button>

// //       <div className="flex-1 flex flex-col p-2.5 gap-4 overflow-hidden">
// //         <div
// //           className={`rounded-2xl border border-border/40 flex items-center transition-all duration-300 ${
// //             isCollapsed ? "h-12 w-12 mx-auto justify-center" : "p-2.5 gap-3"
// //           }`}
// //         >
// //           <div
// //             className={`rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 transition-all duration-300 ${
// //               isCollapsed ? "h-9 w-9" : "h-10 w-10"
// //             }`}
// //           >
// //             <Building2 size={isCollapsed ? 18 : 20} strokeWidth={1.75} />
// //           </div>

// //           {!isCollapsed && (
// //             <div className="min-w-0 flex-1 animate-in fade-in duration-200">
// //               <p className="text-sm font-medium text-foreground truncate leading-tight">
// //                 Tawala
// //               </p>
// //               <p className="text-[11px] text-muted truncate mt-0.5">
// //                 {businessId?.slice(0, 8)}
// //               </p>
// //             </div>
// //           )}

// //           {!isCollapsed &&
// //             (userRole === "OWNER" || userRole === "MANAGER") && (
// //               <button
// //                 onClick={() => console.log("Switch branch")}
// //                 className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-slate-50 transition"
// //                 aria-label="Switch store"
// //               >
// //                 <ChevronsUpDown size={15} />
// //               </button>
// //             )}
// //         </div>

// //         <nav className="flex-1 space-y-1" aria-label="Main">
// //           {visibleLinks.map((link) => {
// //             const href = `/org/${organizationId}/${businessId}${link.path}`;
// //             const isActive =
// //               link.path === ""
// //                 ? pathname === href
// //                 : pathname.startsWith(href);
// //             const Icon = link.icon;

// //             return (
// //               <Link
// //                 key={link.path}
// //                 href={href}
// //                 title={isCollapsed ? link.label : undefined}
// //                 aria-current={isActive ? "page" : undefined}
// //                 className={`
// //                   group relative flex items-center rounded-xl text-sm font-medium
// //                   transition-all duration-200 ease-out
// //                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40
// //                   ${
// //                     isCollapsed
// //                       ? "h-12 w-12 mx-auto justify-center"
// //                       : "gap-3 px-3 py-2.5"
// //                   }
// //                   ${
// //                     isActive
// //                       ? isCollapsed
// //                         ? "bg-brand-primary text-white shadow-md shadow-brand-primary/25"
// //                         : "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
// //                       : "text-muted hover:text-foreground hover:bg-slate-50"
// //                   }
// //                 `}
// //               >
// //                 <Icon
// //                   size={isCollapsed ? 22 : 20}
// //                   strokeWidth={isActive ? 2.1 : 1.75}
// //                   className={`shrink-0 transition-transform duration-200 ${
// //                     !isActive && "group-hover:scale-105"
// //                   }`}
// //                 />

// //                 {!isCollapsed && (
// //                   <span className="truncate animate-in fade-in duration-150">
// //                     {link.label}
// //                   </span>
// //                 )}

// //                 {isCollapsed && isActive && (
// //                   <span className="absolute -left-[7px] top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-brand-primary" />
// //                 )}
// //               </Link>
// //             );
// //           })}
// //         </nav>
// //       </div>

// //       <div className="p-2.5 border-t border-border/40">
// //         <div
// //           className={`rounded-2xl border border-border/40 flex items-center transition-all duration-300 ${
// //             isCollapsed
// //               ? "h-12 w-12 mx-auto justify-center flex-col"
// //               : "p-2 gap-2.5"
// //           }`}
// //         >
// //           <div className="h-9 w-9 rounded-xl bg-slate-50 border border-border/50 flex items-center justify-center text-sm font-medium text-foreground shrink-0">
// //             {session.user?.name?.[0]?.toUpperCase() ?? <User size={16} />}
// //           </div>

// //           {!isCollapsed && (
// //             <div className="min-w-0 flex-1">
// //               <p className="text-sm font-medium text-foreground truncate leading-tight">
// //                 {session.user?.name || "User"}
// //               </p>
// //               <p className="text-[11px] text-muted capitalize mt-0.5">
// //                 {userRole?.toLowerCase()}
// //               </p>
// //             </div>
// //           )}

// //           {!isCollapsed && (
// //             <button
// //               onClick={() => signOut({ callbackUrl: "/login" })}
// //               className="p-2 rounded-xl text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition active:scale-95"
// //               title="Sign out"
// //               aria-label="Sign out"
// //             >
// //               <LogOut size={17} strokeWidth={1.75} />
// //             </button>
// //           )}
// //         </div>

// //         {isCollapsed && (
// //           <button
// //             onClick={() => signOut({ callbackUrl: "/login" })}
// //             className="mt-2 h-10 w-12 mx-auto flex items-center justify-center rounded-xl text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition active:scale-95"
// //             title="Sign out"
// //             aria-label="Sign out"
// //           >
// //             <LogOut size={18} strokeWidth={1.75} />
// //           </button>
// //         )}
// //       </div>
// //     </aside>
// //   );
// // }

// "use client";

// import React, { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useSession, signOut } from "next-auth/react";
// import { motion, AnimatePresence } from "framer-motion";
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
//   type LucideIcon,
// } from "lucide-react";

// interface SidebarProps {
//   organizationId: string;
//   businessId: string;
// }

// interface SidebarLink {
//   label: string;
//   path: string;
//   allowedRoles: string[];
//   icon: LucideIcon;
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

// /** Soft pulse block used while session / nav is resolving */
// function Skeleton({ className = "" }: { className?: string }) {
//   return (
//     <div
//       className={`animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800 ${className}`}
//       aria-hidden="true"
//     />
//   );
// }

// /** Full sidebar chrome in skeleton form — never a blank white column */
// function SidebarSkeleton() {
//   return (
//     <aside
//       className="w-60 min-h-screen bg-white dark:bg-slate-900 border-r border-border/50 flex flex-col shrink-0 p-2.5 gap-4"
//       aria-label="Sidebar loading"
//       aria-busy="true"
//     >
//       <div className="rounded-2xl border border-border/40 p-2.5 flex items-center gap-3">
//         <Skeleton className="h-10 w-10 shrink-0" />
//         <div className="flex-1 space-y-2">
//           <Skeleton className="h-3.5 w-20" />
//           <Skeleton className="h-3 w-14" />
//         </div>
//       </div>

//       <div className="flex-1 space-y-2 pt-1">
//         {Array.from({ length: 5 }).map((_, i) => (
//           <div key={i} className="flex items-center gap-3 px-3 py-2.5">
//             <Skeleton className="h-5 w-5 shrink-0 rounded-lg" />
//             <Skeleton className="h-3.5 flex-1 max-w-[7rem]" />
//           </div>
//         ))}
//       </div>

//       <div className="pt-2 border-t border-border/40">
//         <div className="rounded-2xl border border-border/40 p-2 flex items-center gap-2.5">
//           <Skeleton className="h-9 w-9 shrink-0" />
//           <div className="flex-1 space-y-2">
//             <Skeleton className="h-3.5 w-24" />
//             <Skeleton className="h-3 w-12" />
//           </div>
//           <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
//         </div>
//       </div>
//     </aside>
//   );
// }

// export function Sidebar({ organizationId, businessId }: SidebarProps) {
//   const { data: session, status } = useSession();
//   const pathname = usePathname();
//   const [isCollapsed, setIsCollapsed] = useState(false);

//   // Normalize role with safe fallback (prevents infinite skeleton lockups if JWT role is undefined)
//   const rawRole = (session?.user as { role?: string } | undefined)?.role;
//   const userRole = rawRole ? rawRole.toUpperCase() : "CASHIER";

//   /**
//    * ONLY block rendering while NextAuth is actively initializing session state.
//    * Deadlock fix: Once status resolves out of "loading", render immediately.
//    */
//   if (status === "loading") {
//     return <SidebarSkeleton />;
//   }

//   // Filter links safely according to assigned or fallback role
//   const visibleLinks = NAVIGATION_SCHEMA.filter((link) =>
//     link.allowedRoles.includes(userRole)
//   );

//   return (
//     <motion.aside
//       initial={false}
//       animate={{ width: isCollapsed ? 76 : 240 }}
//       transition={{ type: "spring", stiffness: 300, damping: 30 }}
//       className="bg-white dark:bg-slate-900 border-r border-border/50 min-h-screen flex flex-col shrink-0 relative z-20"
//       aria-label="Main Navigation"
//     >
//       {/* Collapse Toggle Control (Fitts's Law Optimized Touch Target) */}
//       <button
//         type="button"
//         onClick={() => setIsCollapsed(!isCollapsed)}
//         className="absolute top-1/2 -right-3.5 -translate-y-1/2 z-30 h-7 w-7 rounded-full
//                    bg-white dark:bg-slate-800 border border-border/70 text-muted
//                    hover:text-brand-primary hover:border-brand-primary/30 hover:shadow-sm
//                    flex items-center justify-center transition-colors duration-200
//                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
//         aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
//         aria-expanded={!isCollapsed}
//       >
//         <ChevronLeft
//           size={14}
//           strokeWidth={2.25}
//           className={`transition-transform duration-300 ease-out ${
//             isCollapsed ? "rotate-180" : ""
//           }`}
//         />
//       </button>

//       <div className="flex-1 flex flex-col p-2.5 gap-4 overflow-hidden">
//         {/* Business Header Unit */}
//         <div
//           className={`rounded-2xl border border-border/40 flex items-center transition-all duration-300 ${
//             isCollapsed ? "h-12 w-12 mx-auto justify-center" : "p-2.5 gap-3"
//           }`}
//         >
//           <div
//             className={`rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 transition-all duration-300 ${
//               isCollapsed ? "h-9 w-9" : "h-10 w-10"
//             }`}
//           >
//             <Building2 size={isCollapsed ? 18 : 20} strokeWidth={1.75} />
//           </div>

//           {!isCollapsed && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="min-w-0 flex-1"
//             >
//               <p className="text-sm font-medium text-foreground truncate leading-tight">
//                 Tawala
//               </p>
//               <p className="text-[11px] text-muted truncate mt-0.5">
//                 {businessId ? businessId.slice(0, 8) : "Console"}
//               </p>
//             </motion.div>
//           )}

//           {!isCollapsed &&
//             (userRole === "OWNER" || userRole === "MANAGER") && (
//               <button
//                 type="button"
//                 onClick={() => console.log("Switch branch")}
//                 className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800 transition min-h-[32px] min-w-[32px] flex items-center justify-center"
//                 aria-label="Switch store"
//               >
//                 <ChevronsUpDown size={15} />
//               </button>
//             )}
//         </div>

//         {/* Dynamic Navigation Viewport */}
//         <nav className="flex-1 space-y-1" aria-label="Sidebar Links">
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
//                 className={`
//                   group relative flex items-center rounded-xl text-sm font-medium
//                   transition-all duration-200 ease-out min-h-[44px]
//                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40
//                   ${
//                     isCollapsed
//                       ? "h-12 w-12 mx-auto justify-center"
//                       : "gap-3 px-3 py-2.5"
//                   }
//                   ${
//                     isActive
//                       ? isCollapsed
//                         ? "bg-brand-primary text-white shadow-md shadow-brand-primary/25"
//                         : "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
//                       : "text-muted hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/60"
//                   }
//                 `}
//               >
//                 <Icon
//                   size={isCollapsed ? 22 : 20}
//                   strokeWidth={isActive ? 2.1 : 1.75}
//                   className={`shrink-0 transition-transform duration-200 ${
//                     !isActive && "group-hover:scale-105"
//                   }`}
//                 />

//                 {!isCollapsed && (
//                   <span className="truncate">{link.label}</span>
//                 )}

//                 {isCollapsed && isActive && (
//                   <motion.span
//                     layoutId="activeIndicator"
//                     className="absolute -left-[7px] top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-brand-primary"
//                   />
//                 )}
//               </Link>
//             );
//           })}
//         </nav>
//       </div>

//       {/* User Session Footer */}
//       <div className="p-2.5 border-t border-border/40">
//         <div
//           className={`rounded-2xl border border-border/40 flex items-center transition-all duration-300 ${
//             isCollapsed
//               ? "h-12 w-12 mx-auto justify-center flex-col"
//               : "p-2 gap-2.5"
//           }`}
//         >
//           <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-border/50 flex items-center justify-center text-sm font-medium text-foreground shrink-0">
//             {session?.user?.name?.[0]?.toUpperCase() ?? <User size={16} />}
//           </div>

//           {!isCollapsed && (
//             <div className="min-w-0 flex-1">
//               <p className="text-sm font-medium text-foreground truncate leading-tight">
//                 {session?.user?.name || "User"}
//               </p>
//               <p className="text-[11px] text-muted capitalize mt-0.5">
//                 {userRole.toLowerCase()}
//               </p>
//             </div>
//           )}

//           {!isCollapsed && (
//             <button
//               type="button"
//               onClick={() => signOut({ callbackUrl: "/login" })}
//               className="p-2 rounded-xl text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
//               title="Sign out"
//               aria-label="Sign out"
//             >
//               <LogOut size={17} strokeWidth={1.75} />
//             </button>
//           )}
//         </div>

//         {isCollapsed && (
//           <button
//             type="button"
//             onClick={() => signOut({ callbackUrl: "/login" })}
//             className="mt-2 h-10 w-12 mx-auto flex items-center justify-center rounded-xl text-muted hover:text-brand-primary hover:bg-brand-primary/10 transition active:scale-95"
//             title="Sign out"
//             aria-label="Sign out"
//           >
//             <LogOut size={18} strokeWidth={1.75} />
//           </button>
//         )}
//       </div>
//     </motion.aside>
//   );
// }

// "use client";
// // import { BusinessSwitcher } from "@/features/business/components/BusinessSwitcher";
// import React, { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { useSession, signOut } from "next-auth/react";
// import { motion } from "framer-motion";
// import {
//   Monitor,
//   Package,
//   History,
//   User,
//   LogOut,
//   LayoutDashboard,
//   Boxes,
//   Users2,
//   ChevronLeft,
//   type LucideIcon,
// } from "lucide-react";
// import { BusinessSwitcher } from "@/features/business/components/BusinessSwitcher";

// interface SidebarProps {
//   organizationId: string;
//   businessId: string;
// }

// interface SidebarLink {
//   label: string;
//   path: string;
//   allowedRoles: string[];
//   icon: LucideIcon;
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

// function Skeleton({ className = "" }: { className?: string }) {
//   return (
//     <div
//       className={`animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800 ${className}`}
//       aria-hidden="true"
//     />
//   );
// }

// function SidebarSkeleton() {
//   return (
//     <aside
//       className="w-60 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 p-2.5 gap-4"
//       aria-label="Sidebar loading"
//       aria-busy="true"
//     >
//       <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 flex items-center gap-3">
//         <Skeleton className="h-10 w-10 shrink-0" />
//         <div className="flex-1 space-y-2">
//           <Skeleton className="h-3.5 w-20" />
//           <Skeleton className="h-3 w-14" />
//         </div>
//       </div>

//       <div className="flex-1 space-y-2 pt-1">
//         {Array.from({ length: 5 }).map((_, i) => (
//           <div key={i} className="flex items-center gap-3 px-3 py-2.5">
//             <Skeleton className="h-5 w-5 shrink-0 rounded-lg" />
//             <Skeleton className="h-3.5 flex-1 max-w-[7rem]" />
//           </div>
//         ))}
//       </div>

//       <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
//         <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-2 flex items-center gap-2.5">
//           <Skeleton className="h-9 w-9 shrink-0" />
//           <div className="flex-1 space-y-2">
//             <Skeleton className="h-3.5 w-24" />
//             <Skeleton className="h-3 w-12" />
//           </div>
//           <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
//         </div>
//       </div>
//     </aside>
//   );
// }

// export function Sidebar({ organizationId, businessId }: SidebarProps) {
//   const { data: session, status } = useSession();
//   const pathname = usePathname();
//   const [isCollapsed, setIsCollapsed] = useState(false);

//   const rawRole = (session?.user as { role?: string } | undefined)?.role;
//   const userRole = rawRole ? rawRole.toUpperCase() : "CASHIER";

//   if (status === "loading") {
//     return <SidebarSkeleton />;
//   }

//   const visibleLinks = NAVIGATION_SCHEMA.filter((link) =>
//     link.allowedRoles.includes(userRole)
//   );

//   return (
//     <motion.aside
//       initial={false}
//       animate={{ width: isCollapsed ? 76 : 240 }}
//       transition={{ type: "spring", stiffness: 300, damping: 30 }}
//       className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 min-h-screen flex flex-col shrink-0 relative z-20"
//       aria-label="Main Navigation"
//     >
//       {/* Collapse Toggle Handle */}
//       <button
//         type="button"
//         onClick={() => setIsCollapsed(!isCollapsed)}
//         className="absolute top-1/2 -right-3.5 -translate-y-1/2 z-30 h-7 w-7 rounded-full
//                    bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500
//                    hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 hover:shadow-sm
//                    flex items-center justify-center transition-colors duration-200
//                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
//         aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
//         aria-expanded={!isCollapsed}
//       >
//         <ChevronLeft
//           size={14}
//           strokeWidth={2.25}
//           className={`transition-transform duration-300 ease-out ${
//             isCollapsed ? "rotate-180" : ""
//           }`}
//         />
//       </button>

//       <div className="flex-1 flex flex-col p-2.5 gap-4 overflow-hidden">
//         {/* PLUGGED IN: Business Switcher replaces the old static header */}
//         <BusinessSwitcher isCollapsed={isCollapsed} />

//         {/* Dynamic Navigation Viewport */}
//         <nav className="flex-1 space-y-1" aria-label="Sidebar Links">
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
//                 className={`
//                   group relative flex items-center rounded-xl text-sm font-medium
//                   transition-all duration-200 ease-out min-h-[44px]
//                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
//                   ${
//                     isCollapsed
//                       ? "h-12 w-12 mx-auto justify-center"
//                       : "gap-3 px-3 py-2.5"
//                   }
//                   ${
//                     isActive
//                       ? isCollapsed
//                         ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
//                         : "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
//                       : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
//                   }
//                 `}
//               >
//                 <Icon
//                   size={isCollapsed ? 22 : 20}
//                   strokeWidth={isActive ? 2.1 : 1.75}
//                   className={`shrink-0 transition-transform duration-200 ${
//                     !isActive && "group-hover:scale-105"
//                   }`}
//                 />

//                 {!isCollapsed && (
//                   <span className="truncate">{link.label}</span>
//                 )}

//                 {isCollapsed && isActive && (
//                   <motion.span
//                     layoutId="activeIndicator"
//                     className="absolute -left-[7px] top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-blue-600"
//                   />
//                 )}
//               </Link>
//             );
//           })}
//         </nav>
//       </div>

//       {/* User Session Footer */}
//       <div className="p-2.5 border-t border-slate-200 dark:border-slate-800">
//         <div
//           className={`rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center transition-all duration-300 ${
//             isCollapsed
//               ? "h-12 w-12 mx-auto justify-center flex-col"
//               : "p-2 gap-2.5"
//           }`}
//         >
//           <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-medium text-slate-900 dark:text-slate-100 shrink-0">
//             {session?.user?.name?.[0]?.toUpperCase() ?? <User size={16} />}
//           </div>

//           {!isCollapsed && (
//             <div className="min-w-0 flex-1">
//               <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate leading-tight">
//                 {session?.user?.name || "User"}
//               </p>
//               <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize mt-0.5">
//                 {userRole.toLowerCase()}
//               </p>
//             </div>
//           )}

//           {!isCollapsed && (
//             <button
//               type="button"
//               onClick={() => signOut({ callbackUrl: "/login" })}
//               className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
//               title="Sign out"
//               aria-label="Sign out"
//             >
//               <LogOut size={17} strokeWidth={1.75} />
//             </button>
//           )}
//         </div>

//         {isCollapsed && (
//           <button
//             type="button"
//             onClick={() => signOut({ callbackUrl: "/login" })}
//             className="mt-2 h-10 w-12 mx-auto flex items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition active:scale-95"
//             title="Sign out"
//             aria-label="Sign out"
//           >
//             <LogOut size={18} strokeWidth={1.75} />
//           </button>
//         )}
//       </div>
//     </motion.aside>
//   );
// }

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Package,
  History,
  User,
  LogOut,
  LayoutDashboard,
  Boxes,
  Users2,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { BusinessSwitcher } from "@/features/business/components/BusinessSwitcher";

interface SidebarProps {
  organizationId: string;
  businessId: string;
}

interface SidebarLink {
  label: string;
  path: string;
  allowedRoles: string[];
  icon: LucideIcon;
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

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800 ${className}`}
      aria-hidden="true"
    />
  );
}

function SidebarSkeleton() {
  return (
    <aside
      className="w-60 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 p-2.5 gap-4 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.25)]"
      aria-label="Sidebar loading"
      aria-busy="true"
    >
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>

      <div className="flex-1 space-y-2 pt-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-5 w-5 shrink-0 rounded-lg" />
            <Skeleton className="h-3.5 flex-1 max-w-[7rem]" />
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-2 flex items-center gap-2.5">
          <Skeleton className="h-9 w-9 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-8 w-8 shrink-0 rounded-xl" />
        </div>
      </div>
    </aside>
  );
}

export function Sidebar({ organizationId, businessId }: SidebarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const rawRole = (session?.user as { role?: string } | undefined)?.role;
  const userRole = rawRole ? rawRole.toUpperCase() : "CASHIER";

  if (status === "loading") {
    return <SidebarSkeleton />;
  }

  const visibleLinks = NAVIGATION_SCHEMA.filter((link) =>
    link.allowedRoles.includes(userRole)
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 76 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 min-h-screen flex flex-col shrink-0 relative z-20 shadow-[4px_0_20px_-4px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_24px_-4px_rgba(0,0,0,0.35)]"
      aria-label="Main Navigation"
    >
      {/* Collapse Toggle Handle */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-1/2 -right-3.5 -translate-y-1/2 z-30 h-7 w-7 rounded-full
                   bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500
                   hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 hover:shadow-md
                   flex items-center justify-center transition-colors duration-200
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!isCollapsed}
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
        {/* Plugged Business Switcher Viewport */}
        <BusinessSwitcher isCollapsed={isCollapsed} />

        {/* Dynamic Navigation Viewport */}
        <nav className="flex-1 space-y-1" aria-label="Sidebar Links">
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
                  transition-all duration-200 ease-out min-h-[44px]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
                  ${
                    isCollapsed
                      ? "h-11 w-11 mx-auto justify-center"
                      : "gap-3 px-3 py-2.5"
                  }
                  ${
                    isActive
                      ? isCollapsed
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-blue-600 text-white shadow-xs shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }
                `}
              >
                {/* Strictly bound icon dimensions to guarantee visual consistency */}
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.1 : 1.75}
                    className={`transition-transform duration-200 ${
                      !isActive && "group-hover:scale-105"
                    }`}
                  />
                </div>

                {!isCollapsed && (
                  <span className="truncate">{link.label}</span>
                )}

                {isCollapsed && isActive && (
                  <motion.span
                    layoutId="activeIndicator"
                    className="absolute -left-[7px] top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-blue-600"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Session Footer */}
      <div className="p-2.5 border-t border-slate-200 dark:border-slate-800">
        <div
          className={`rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center transition-all duration-300 ${
            isCollapsed
              ? "h-12 w-12 mx-auto justify-center flex-col"
              : "p-2 gap-2.5"
          }`}
        >
          <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-medium text-slate-900 dark:text-slate-100 shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() ?? <User size={16} />}
          </div>

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate leading-tight">
                {session?.user?.name || "User"}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize mt-0.5">
                {userRole.toLowerCase()}
              </p>
            </div>
          )}

          {!isCollapsed && (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={17} strokeWidth={1.75} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-2 h-10 w-12 mx-auto flex items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition active:scale-95"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={18} strokeWidth={1.75} />
          </button>
        )}
      </div>
    </motion.aside>
  );
}