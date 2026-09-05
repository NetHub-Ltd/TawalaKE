"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useBusinessContext } from "@/features/business/hooks/useBusiness";
import { Loader2, RefreshCw } from "lucide-react";
import { PeriodPills } from "./PeriodPills";
import { DashboardTabs, type DashboardTab } from "./DashboardTabs";
import { SalesPanel } from "./SalesPanel";
import { ProductsPanel } from "./ProductsPanel";
import { StaffPanel } from "./StaffPanel";
import {
  useSalesDashboard,
  useHourlyReport,
  useProductsReport,
  useStaffReport,
  useInsightsReport,
} from "@/features/analytics/hooks/useDashboardData";
import type { AnalyticsRange } from "@/features/analytics/lib/fetchReport";

interface OverviewClientProps {
  organizationId: string;
  businessId: string;
}

const VALID_TABS = new Set<DashboardTab>(["sales", "products", "staff"]);

export function OverviewClient({
  organizationId: propOrgId,
  businessId: propBusinessId,
}: OverviewClientProps) {
  const { businessId: ctxBusinessId, organizationId: ctxOrgId } =
    useBusinessContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const normalizedBusinessId =
    propBusinessId ||
    (Array.isArray(ctxBusinessId) ? ctxBusinessId[0] : ctxBusinessId) ||
    "";
  const normalizedOrgId =
    propOrgId || (Array.isArray(ctxOrgId) ? ctxOrgId[0] : ctxOrgId) || "";

  const tabParam = searchParams.get("tab") as DashboardTab | null;
  const tab: DashboardTab =
    tabParam && VALID_TABS.has(tabParam) ? tabParam : "sales";

  const [period, setPeriod] = useState<AnalyticsRange>("today");

  const setTab = (next: DashboardTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "sales") params.delete("tab");
    else params.set("tab", next);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const dash = useSalesDashboard(normalizedBusinessId, period);
  const hourly = useHourlyReport(normalizedBusinessId, period, true);
  const products = useProductsReport(
    normalizedBusinessId,
    period,
    true
  );
  const staff = useStaffReport(normalizedBusinessId, period, true);
  const insights = useInsightsReport(normalizedBusinessId, period, true);

  const anyError = dash.isError || products.isError || staff.isError;
  const errorMessage =
    (dash.error as Error)?.message ||
    (products.error as Error)?.message ||
    (staff.error as Error)?.message ||
    "Failed to load dashboard";

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3 px-1 pb-3 pt-1 sm:px-2">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
        <DashboardTabs value={tab} onChange={setTab} />
        <div className="flex items-center gap-2">
          <PeriodPills value={period} onChange={setPeriod} />
          <button
            type="button"
            onClick={() => {
              dash.refetch();
              hourly.refetch();
              products.refetch();
              staff.refetch();
              insights.refetch();
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card text-muted hover:text-foreground"
            aria-label="Refresh"
          >
            {dash.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {anyError && (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {errorMessage}
          <button
            type="button"
            className="ml-3 font-medium underline"
            onClick={() => dash.refetch()}
          >
            Retry
          </button>
        </div>
      )}

      <div
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="min-h-[480px] flex-1"
      >
        {tab === "sales" && (
          <SalesPanel
            dashboard={dash.data}
            hourly={hourly.data}
            insights={insights.data}
            loading={dash.isLoading}
          />
        )}
        {tab === "products" && (
          <ProductsPanel
            dashboard={dash.data}
            products={products.data}
            insights={insights.data}
            loading={products.isLoading}
          />
        )}
        {tab === "staff" && (
          <StaffPanel
            dashboard={dash.data}
            staff={staff.data}
            insights={insights.data}
            loading={staff.isLoading}
          />
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 border-t border-border/40 pt-3 text-sm">
        <Link
          href={`/org/${normalizedOrgId}/${normalizedBusinessId}/terminal`}
          className="rounded-lg bg-brand-primary px-3 py-1.5 font-medium text-white hover:opacity-90"
        >
          New sale
        </Link>
        <Link
          href={`/org/${normalizedOrgId}/${normalizedBusinessId}/sale-history`}
          className="rounded-lg border border-border/60 bg-card px-3 py-1.5 font-medium text-foreground hover:bg-background"
        >
          Sale history
        </Link>
      </div>
    </div>
  );
}
