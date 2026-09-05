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
  const { businessId: ctxBusinessId, organizationId: ctxOrgId, businessName } =
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

  const [period, setPeriod] = useState<AnalyticsRange>("7d");

  const setTab = (next: DashboardTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "sales") params.delete("tab");
    else params.set("tab", next);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const dash = useSalesDashboard(normalizedBusinessId, period);
  const hourly = useHourlyReport(normalizedBusinessId, period, tab === "sales");
  const products = useProductsReport(
    normalizedBusinessId,
    period,
    tab === "products"
  );
  const staff = useStaffReport(normalizedBusinessId, period, tab === "staff");
  const insights = useInsightsReport(normalizedBusinessId, period, true);

  const branchName = businessName || "Business";

  const periodLabel =
    period === "today"
      ? "today"
      : period === "3d"
        ? "last 3 days"
        : period === "month"
          ? "this month"
          : "last 7 days";

  const anyError = dash.isError || products.isError || staff.isError;
  const errorMessage =
    (dash.error as Error)?.message ||
    (products.error as Error)?.message ||
    (staff.error as Error)?.message ||
    "Failed to load dashboard";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Overview
          </p>
          <h1 className="text-xl font-semibold text-slate-900">{branchName}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {tab === "sales" && `Sales snapshot · ${periodLabel}`}
            {tab === "products" && `Product performance · ${periodLabel}`}
            {tab === "staff" && `Staff contribution · ${periodLabel}`}
          </p>
        </div>
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
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

      <DashboardTabs value={tab} onChange={setTab} />

      {anyError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
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
        className="min-h-[320px]"
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

      <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4 text-sm">
        <Link
          href={`/org/${normalizedOrgId}/${normalizedBusinessId}/terminal`}
          className="rounded-lg bg-teal-600 px-3 py-1.5 font-medium text-white hover:bg-teal-700"
        >
          New sale
        </Link>
        <Link
          href={`/org/${normalizedOrgId}/${normalizedBusinessId}/sale-history`}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
        >
          Sale history
        </Link>
      </div>
    </div>
  );
}
