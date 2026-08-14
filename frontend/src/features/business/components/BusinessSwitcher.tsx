// "use client";

// import React, { useState, useRef, useEffect, useTransition } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import { useSession } from "next-auth/react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Building2, ChevronsUpDown, Check, Loader2, Store, Search } from "lucide-react";
// import { useBusinessContext } from "@/features/business/hooks/useBusiness";

// interface AssignedBusiness {
//   id: string;
//   name: string;
// }

// interface CustomSessionUser {
//   name?: string | null;
//   email?: string | null;
//   image?: string | null;
//   organization_id?: string;
//   assigned_businesses?: AssignedBusiness[];
// }

// interface BusinessSwitcherProps {
//   isCollapsed?: boolean;
// }

// export function BusinessSwitcher({ isCollapsed = false }: BusinessSwitcherProps) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const { data: session } = useSession();
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   const [isOpen, setIsOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [isPending, startTransition] = useTransition();

//   const { organizationId, businessId, businessName } = useBusinessContext();

//   // Normalize route parameter strings
//   const activeOrgId = Array.isArray(organizationId)
//     ? organizationId[0]
//     : organizationId ?? "";

//   const activeBizId = Array.isArray(businessId)
//     ? businessId[0]
//     : businessId ?? "";

//   // Extract assigned businesses directly from user payload
//   const user = session?.user as CustomSessionUser | undefined;
//   const assignedBusinesses: AssignedBusiness[] = user?.assigned_businesses ?? [];

//   // Filter stores for quick selection if list grows large
//   const filteredBusinesses = assignedBusinesses.filter((biz) =>
//     biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     biz.id.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   // Close popover on outside click
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Close popover on Escape key
//   useEffect(() => {
//     function handleKeyDown(event: KeyboardEvent) {
//       if (event.key === "Escape") {
//         setIsOpen(false);
//       }
//     }
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, []);

//   /**
//    * Path-Preserving Routing Logic:
//    * Retains current sub-route (/inventory, /stock/audit) when switching store contexts.
//    */
//   const handleSelectBusiness = (targetBusiness: AssignedBusiness) => {
//     if (targetBusiness.id === activeBizId) {
//       setIsOpen(false);
//       return;
//     }

//     const currentPrefix = `/org/${activeOrgId}/${activeBizId}`;
//     let subPath = "";

//     if (pathname.startsWith(currentPrefix)) {
//       subPath = pathname.slice(currentPrefix.length);
//     }

//     const targetUrl = `/org/${activeOrgId}/${targetBusiness.id}${subPath || "/overview"}`;

//     startTransition(() => {
//       router.push(targetUrl);
//       setIsOpen(false);
//       setSearchQuery("");
//     });
//   };

//   const activeBusiness = assignedBusinesses.find((b) => b.id === activeBizId);
//   const displayName = activeBusiness?.name || businessName || "Select Store";

//   return (
//     <div className="relative w-full" ref={dropdownRef}>
//       {/* Trigger Button - Fitts's Law Ergonomics (min 48px height target) */}
//       <button
//         type="button"
//         onClick={() => setIsOpen((prev) => !prev)}
//         disabled={isPending}
//         aria-haspopup="listbox"
//         aria-expanded={isOpen}
//         aria-label="Switch business context"
//         className={`
//           w-full rounded-2xl border border-slate-200 dark:border-slate-800
//           bg-white dark:bg-slate-900 flex items-center transition-all duration-200
//           hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/80 dark:hover:bg-slate-800/50
//           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40
//           disabled:opacity-60 disabled:cursor-wait min-h-[48px]
//           ${isCollapsed ? "h-12 w-12 mx-auto justify-center p-0" : "p-2.5 gap-3"}
//         `}
//       >
//         <div
//           className={`
//             rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400
//             flex items-center justify-center shrink-0 transition-all duration-300
//             ${isCollapsed ? "h-9 w-9" : "h-10 w-10"}
//           `}
//         >
//           {isPending ? (
//             <Loader2 size={18} className="animate-spin text-blue-600 dark:text-blue-400" />
//           ) : (
//             <Building2 size={isCollapsed ? 18 : 20} strokeWidth={1.75} />
//           )}
//         </div>

//         {!isCollapsed && (
//           <div className="min-w-0 flex-1 text-left">
//             <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-tight">
//               {displayName}
//             </p>
//             <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
//               {activeBizId ? `#${activeBizId.slice(0, 8)}` : "No Store Selected"}
//             </p>
//           </div>
//         )}

//         {!isCollapsed && (
//           <ChevronsUpDown size={15} className="text-slate-400 shrink-0 ml-auto" />
//         )}
//       </button>

//       {/* Dropdown Menu Popover */}
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             initial={{ opacity: 0, y: isCollapsed ? 0 : -8, x: isCollapsed ? 12 : 0, scale: 0.96 }}
//             animate={{ opacity: 1, y: 0, x: isCollapsed ? 12 : 0, scale: 1 }}
//             exit={{ opacity: 0, scale: 0.96 }}
//             transition={{ duration: 0.15, ease: "easeOut" }}
//             role="listbox"
//             aria-label="Assigned stores list"
//             className={`
//               absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
//               rounded-2xl shadow-xl shadow-black/10 overflow-hidden p-1.5 space-y-1.5
//               ${
//                 isCollapsed
//                   ? "left-full top-0 w-64"
//                   : "top-full left-0 right-0 mt-2 w-full min-w-[240px]"
//               }
//             `}
//           >
//             {/* Header & Disambiguation Filter */}
//             <div className="px-2.5 pt-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 space-y-2">
//               <div className="flex items-center justify-between">
//                 <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
//                   Assigned Stores ({assignedBusinesses.length})
//                 </p>
//               </div>

//               {assignedBusinesses.length > 4 && (
//                 <div className="relative flex items-center">
//                   <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
//                   <input
//                     type="text"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     placeholder="Filter store or ID..."
//                     className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Scrollable Store Options List */}
//             <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5 scrollbar-thin">
//               {filteredBusinesses.length === 0 ? (
//                 <div className="p-3 text-center text-xs text-slate-400">
//                   No matching store found
//                 </div>
//               ) : (
//                 filteredBusinesses.map((biz) => {
//                   const isSelected = biz.id === activeBizId;

//                   return (
//                     <button
//                       key={biz.id}
//                       type="button"
//                       role="option"
//                       aria-selected={isSelected}
//                       onClick={() => handleSelectBusiness(biz)}
//                       className={`
//                         w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors text-left min-h-[44px]
//                         ${
//                           isSelected
//                             ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold"
//                             : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80"
//                         }
//                       `}
//                     >
//                       <Store size={16} className="shrink-0 opacity-70" />
//                       <div className="min-w-0 flex-1">
//                         <p className="truncate leading-tight">{biz.name}</p>
//                         <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate mt-0.5">
//                           ID: #{biz.id.slice(0, 8)}
//                         </p>
//                       </div>

//                       {isSelected && (
//                         <Check size={16} className="text-blue-600 dark:text-blue-400 shrink-0 ml-auto" />
//                       )}
//                     </button>
//                   );
//                 })
//               )}
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronsUpDown, Check, Store } from "lucide-react";

interface BusinessSwitcherProps {
  isCollapsed: boolean;
}

export function BusinessSwitcher({ isCollapsed }: BusinessSwitcherProps) {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const rawRole = session?.user?.role;
  const userRole = rawRole ? rawRole.toUpperCase() : "CASHIER";
  const isAuthorized = ["OWNER", "MANAGER"].includes(userRole);

  const assignedBusinesses = session?.user?.assigned_businesses ?? [];
  const currentOrganizationId = (params?.organizationId as string) || session?.user?.organization_id;
  const currentBusinessId = params?.businessId as string;

  const activeBusiness =
    assignedBusinesses.find((b) => b.id === currentBusinessId) ||
    assignedBusinesses[0] ||
    { id: currentBusinessId || "default", name: "Select Business" };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation (Escape key to close)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ---------------------------------------------------------------------------
  // STATE 1: Hydration / Loading (Pulsating Skeleton & Non-Clickable)
  // ---------------------------------------------------------------------------
  if (status === "loading") {
    return (
      <div
        className={`animate-pulse bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 flex items-center gap-2.5 pointer-events-none select-none transition-all ${
          isCollapsed ? "h-12 w-12 mx-auto justify-center" : "h-14 w-full"
        }`}
        aria-busy="true"
        aria-label="Hydrating business context"
      >
        <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
        {!isCollapsed && (
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md w-28" />
            <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-md w-16" />
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STATE 2: Unauthorized / Cashier View (Static Tawala Branding)
  // ---------------------------------------------------------------------------
  if (!isAuthorized) {
    return (
      <div
        className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center transition-all ${
          isCollapsed ? "h-12 w-12 mx-auto justify-center p-2" : "p-2 gap-2.5 h-14"
        }`}
      >
        <div className="relative h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
          <Image
            src="/logo.svg"
            alt="Tawala Logo"
            width={22}
            height={22}
            className="object-contain"
            priority
          />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-snug">
              Tawala
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              POS Terminal
            </span>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STATE 3: Authorized View (Owner / Manager Switcher Menu)
  // ---------------------------------------------------------------------------
  const handleSelectBusiness = (businessId: string) => {
    setIsOpen(false);
    if (!currentOrganizationId || businessId === currentBusinessId) return;

    // Swap businessId in route parameters seamlessly
    const pathSegments = pathname.split("/");
    const orgIndex = pathSegments.indexOf("org");
    
    if (orgIndex !== -1 && pathSegments.length > orgIndex + 2) {
      pathSegments[orgIndex + 2] = businessId;
      router.push(pathSegments.join("/"));
    } else {
      router.push(`/org/${currentOrganizationId}/${businessId}/overview`);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Switch business context"
        className={`w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 flex items-center min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
          isCollapsed ? "h-12 w-12 mx-auto justify-center p-2" : "p-2 gap-2.5 h-14"
        }`}
      >
        <div className="h-9 w-9 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Store size={18} strokeWidth={2} />
        </div>

        {!isCollapsed && (
          <>
            <div className="flex flex-col min-w-0 text-left flex-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-snug">
                {activeBusiness.name}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate capitalize">
                {userRole.toLowerCase()} Mode
              </span>
            </div>
            <ChevronsUpDown size={16} className="text-slate-400 shrink-0 ml-1" />
          </>
        )}
      </button>

      {/* Switcher Dropdown Viewport */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-50 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 space-y-1 overflow-hidden ${
              isCollapsed ? "left-14 top-0 w-56" : "left-0 right-0 w-full"
            }`}
            role="listbox"
            aria-label="Assigned Businesses"
          >
            <div className="px-2 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Assigned Businesses
            </div>

            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {assignedBusinesses.map((b) => {
                const isSelected = b.id === activeBusiness.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectBusiness(b.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 size={15} className="shrink-0 text-slate-400" />
                      <span className="truncate">{b.name}</span>
                    </div>
                    {isSelected && <Check size={15} className="shrink-0 text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}