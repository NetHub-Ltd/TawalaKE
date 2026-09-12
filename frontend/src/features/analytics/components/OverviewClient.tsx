"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import { DashboardTabs, type DashboardTab } from "./DashboardTabs";
import { PeriodPills } from "./PeriodPills";
import { SalesPanel } from "./SalesPanel";
import { ProductsPanel } from "./ProductsPanel";
import { StaffPanel } from "./StaffPanel";
import {
  useSalesDashboard,
  useHourlyReport,
  useProductsReport,
  useStaffReport,
} from "@/features/analytics/hooks/useDashboardData";
import type { AnalyticsRange } from "@/features/analytics/lib/fetchReport";

export function OverviewClient({
  organizationId,
  businessId,
}: {
  organizationId: string;
  businessId: string;
}) {
  const normalizedOrgId = organizationId;
  const normalizedBusinessId = businessId;

  const [tab, setTab] = useState<DashboardTab>("sales");
  const [period, setPeriod] = useState<AnalyticsRange>("today");
  const [customDate, setCustomDate] = useState<string | undefined>();

  const dateArg = period === "custom" ? customDate : undefined;
  const hourlyGrain =
    period === "today" || period === "yesterday" || period === "custom";

  const dash = useSalesDashboard(normalizedBusinessId, period, dateArg);
  const hourly = useHourlyReport(
    normalizedBusinessId,
    period,
    tab === "sales" && hourlyGrain,
    dateArg
  );
  const products = useProductsReport(
    normalizedBusinessId,
    period,
    tab === "products",
    dateArg
  );
  const staff = useStaffReport(
    normalizedBusinessId,
    period,
    tab === "staff",
    dateArg
  );

  const anyError = dash.isError || hourly.isError || products.isError || staff.isError;
  const errorMessage = useMemo(() => {
    const e =
      (dash.error as Error) ||
      (hourly.error as Error) ||
      (products.error as Error) ||
      (staff.error as Error);
    return e?.message || "Failed to load report";
  }, [dash.error, hourly.error, products.error, staff.error]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-6 pt-2 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DashboardTabs value={tab} onChange={setTab} />
        <div className="flex items-center gap-2">
          <PeriodPills
            value={period}
            customDate={customDate}
            onChange={(p, d) => {
              setPeriod(p);
              if (p === "custom" && d) setCustomDate(d);
              if (p !== "custom") setCustomDate(undefined);
            }}
          />
          <button
            type="button"
            onClick={() => {
              dash.refetch();
              hourly.refetch();
              products.refetch();
              staff.refetch();
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
            period={period}
            loading={dash.isLoading || (hourlyGrain && hourly.isLoading)}
          />
        )}
        {tab === "products" && (
          <ProductsPanel
            dashboard={dash.data}
            products={products.data}
            loading={products.isLoading}
          />
        )}
        {tab === "staff" && (
          <StaffPanel
            dashboard={dash.data}
            staff={staff.data}
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
