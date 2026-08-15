"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronsUpDown, Check, Store } from "lucide-react";

/* =========================================================
   TYPES & INTERFACES
   ========================================================= */
export interface AssignedBusiness {
  id: string;
  name: string;
}

export interface BusinessSwitcherProps {
  /** Controls compact layout when sidebar is minimized */
  isCollapsed: boolean;
}

/* =========================================================
   COMPONENT IMPLEMENTATION
   ========================================================= */
export function BusinessSwitcher({ isCollapsed }: BusinessSwitcherProps) {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Authorization and role extraction
  const rawRole = session?.user?.role;
  const userRole = rawRole ? rawRole.toUpperCase() : "CASHIER";
  const isAuthorized = ["OWNER", "MANAGER"].includes(userRole);

  // Business Context Extraction
  const assignedBusinesses: AssignedBusiness[] =
    (session?.user as unknown as { assigned_businesses?: AssignedBusiness[] })
      ?.assigned_businesses ?? [];

  const currentOrganizationId =
    (params?.organizationId as string) || session?.user?.organization_id;
  const currentBusinessId = params?.businessId as string;

  // Active Business Resolution
  const activeBusiness =
    assignedBusinesses.find((b) => b.id === currentBusinessId) ||
    assignedBusinesses[0] || {
      id: currentBusinessId || "default",
      name: "Select Business",
    };

  /* =========================================================
     EVENT HANDLERS & ACCESSIBILITY HOOKS
     ========================================================= */

  // Close menu when clicking outside component bounds
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation listener (Escape key dismissal)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Safe dynamic path replacement across tenant routes
  const handleSelectBusiness = useCallback(
    (targetBusinessId: string) => {
      setIsOpen(false);

      if (!currentOrganizationId || targetBusinessId === currentBusinessId) {
        return;
      }

      const pathSegments = pathname.split("/");
      const orgIndex = pathSegments.indexOf("org");

      // Verify layout pattern: /org/[orgId]/[businessId]/...
      if (orgIndex !== -1 && pathSegments.length > orgIndex + 2) {
        pathSegments[orgIndex + 2] = targetBusinessId;
        router.push(pathSegments.join("/"));
      } else {
        // Fallback default routing if outside standard tenant hierarchy
        router.push(`/org/${currentOrganizationId}/${targetBusinessId}/overview`);
      }
    },
    [currentOrganizationId, currentBusinessId, pathname, router]
  );

  /* =========================================================
     RENDER STATE 1: HYDRATION / LOADING (SKELETON)
     ========================================================= */
  if (status === "loading") {
    return (
      <div
        className={`aria-busy:true animate-pulse bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 flex items-center gap-2.5 pointer-events-none select-none transition-all ${
          isCollapsed ? "h-12 w-12 mx-auto justify-center" : "h-14 w-full"
        }`}
        aria-busy="true"
        aria-label="Loading business context"
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

  /* =========================================================
     RENDER STATE 2: UNAUTHORIZED / CASHIER (READ-ONLY BRANDING)
     ========================================================= */
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

  /* =========================================================
     RENDER STATE 3: AUTHORIZED MANAGER / OWNER SWITCHER MENU
     ========================================================= */
  return (
    <div ref={containerRef} className="relative w-full">
      {/* Dropdown Trigger Button */}
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

      {/* Animated Dropdown Menu Panel */}
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
              {assignedBusinesses.map((business) => {
                const isSelected = business.id === activeBusiness.id;
                return (
                  <button
                    key={business.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectBusiness(business.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 size={15} className="shrink-0 text-slate-400" />
                      <span className="truncate">{business.name}</span>
                    </div>
                    {isSelected && (
                      <Check
                        size={15}
                        className="shrink-0 text-blue-600 dark:text-blue-400"
                      />
                    )}
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