"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, ChevronsUpDown, Check, Loader2 } from "lucide-react";

export interface AssignedBusiness {
  id: string;
  name: string;
}

export interface BusinessSwitcherProps {
  isCollapsed: boolean;
}

/**
 * Branch switcher for org shell.
 * Loads businesses from GET /api/v1/org/stores (not NextAuth session —
 * assigned_businesses are not on the client session).
 * OWNER/ADMIN see all org branches; cashiers still get the list the API returns
 * for their token (backend scopes if applicable).
 */
export function BusinessSwitcher({ isCollapsed }: BusinessSwitcherProps) {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [businesses, setBusinesses] = useState<AssignedBusiness[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const rawRole = session?.user?.role;
  const userRole = rawRole ? rawRole.toUpperCase() : "CASHIER";
  const isAuthorized = ["OWNER", "ADMIN", "MANAGER"].includes(userRole);

  const currentOrganizationId =
    (params?.organizationId as string) || session?.user?.organization_id;
  const currentBusinessId = params?.businessId as string;

  const loadBusinesses = useCallback(async () => {
    setLoadingList(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/v1/org/stores", {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (body as { error?: string }).error ||
            (body as { message?: string }).message ||
            "Could not load branches",
        );
      }
      const list = Array.isArray(body)
        ? body
        : Array.isArray((body as { data?: unknown }).data)
          ? (body as { data: unknown[] }).data
          : [];
      const mapped: AssignedBusiness[] = list
        .map((b: { id?: string; name?: string }) => ({
          id: String(b.id || ""),
          name: String(b.name || "Branch"),
        }))
        .filter((b) => b.id);
      setBusinesses(mapped);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load branches");
      setBusinesses([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      void loadBusinesses();
    }
    if (status === "unauthenticated") {
      setLoadingList(false);
      setBusinesses([]);
    }
  }, [status, loadBusinesses]);

  const activeBusiness =
    businesses.find((b) => b.id === currentBusinessId) ||
    businesses[0] || {
      id: currentBusinessId || "",
      name: loadingList ? "Loading…" : "Select branch",
    };

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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelectBusiness = useCallback(
    (targetBusinessId: string) => {
      setIsOpen(false);
      if (!currentOrganizationId || targetBusinessId === currentBusinessId) {
        return;
      }

      const pathSegments = pathname.split("/");
      const orgIndex = pathSegments.indexOf("org");

      // /org/[orgId]/[businessId]/...
      if (orgIndex !== -1 && pathSegments.length > orgIndex + 2) {
        pathSegments[orgIndex + 2] = targetBusinessId;
        router.push(pathSegments.join("/"));
        return;
      }
      router.push(
        `/org/${currentOrganizationId}/${targetBusinessId}/overview`,
      );
    },
    [currentOrganizationId, currentBusinessId, pathname, router],
  );

  if (status === "loading") {
    return (
      <div
        className={`animate-pulse rounded-md border border-border bg-register p-2 flex items-center gap-2.5 ${
          isCollapsed ? "h-12 w-12 mx-auto justify-center" : "h-14 w-full"
        }`}
        aria-busy="true"
        aria-label="Loading business context"
      >
        <div className="h-9 w-9 shrink-0 rounded-md bg-register" />
        {!isCollapsed && (
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-28 rounded-md bg-register" />
            <div className="h-2.5 w-16 rounded-md bg-register" />
          </div>
        )}
      </div>
    );
  }

  // Cashiers: show current branch name only (no switch)
  if (!isAuthorized) {
    return (
      <div
        className={`flex items-center gap-2.5 rounded-md border border-border bg-card p-2 ${
          isCollapsed ? "h-12 w-12 mx-auto justify-center" : "h-14 w-full"
        }`}
        title={activeBusiness.name}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-primary/10 text-brand-primary">
          <Building2 size={18} />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {activeBusiness.name}
            </p>
            <p className="text-[11px] text-muted">Your branch</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex w-full items-center gap-2.5 rounded-md border border-border bg-card p-2 text-left transition hover:bg-register focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
          isCollapsed ? "h-12 w-12 mx-auto justify-center" : "h-14"
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-primary/10 text-brand-primary">
          {loadingList ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Building2 size={18} />
          )}
        </div>
        {!isCollapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {activeBusiness.name}
              </p>
              <p className="text-[11px] text-muted">
                {userRole === "OWNER"
                  ? "Owner · switch branch"
                  : "Switch branch"}
              </p>
            </div>
            <ChevronsUpDown size={16} className="shrink-0 text-muted" />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-50 mt-2 space-y-1 overflow-hidden rounded-md border border-border bg-card p-1.5 shadow-xl ${
              isCollapsed ? "left-14 top-0 w-56" : "left-0 right-0 w-full"
            }`}
            role="listbox"
            aria-label="Branches"
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Branches
              </span>
              <button
                type="button"
                onClick={() => void loadBusinesses()}
                className="text-[10px] font-medium text-brand-primary hover:underline"
              >
                Refresh
              </button>
            </div>

            <div className="max-h-56 space-y-0.5 overflow-y-auto">
              {loadingList && businesses.length === 0 ? (
                <p className="px-2.5 py-3 text-xs text-muted">Loading…</p>
              ) : loadError ? (
                <p className="px-2.5 py-3 text-xs text-[var(--error)]">
                  {loadError}
                </p>
              ) : businesses.length === 0 ? (
                <p className="px-2.5 py-3 text-xs text-muted">
                  No branches found for this organization.
                </p>
              ) : (
                businesses.map((business) => {
                  const isSelected = business.id === currentBusinessId;
                  return (
                    <button
                      key={business.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectBusiness(business.id)}
                      className={`flex min-h-[40px] w-full items-center justify-between rounded-md px-2.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                        isSelected
                          ? "bg-brand-primary/10 text-brand-primary"
                          : "text-muted hover:bg-register hover:text-foreground"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2 truncate">
                        <Building2 size={15} className="shrink-0 text-muted" />
                        <span className="truncate">{business.name}</span>
                      </div>
                      {isSelected && (
                        <Check size={15} className="shrink-0 text-brand-primary" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
