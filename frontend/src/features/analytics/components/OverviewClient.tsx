"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import { DashboardTabs, type DashboardTab } from "./DashboardTabs";
import { PeriodPills } from "./PeriodPills";
import { SalesPanel } from "./SalesPanel";
import { ProductsPanel } from "./ProductsPanel";
import { StaffPanel } from "./StaffPanel";
import { InsightsStrip } from "./InsightsStrip";
import {
  useSalesDashboard,
  useHourlyReport,
  useProductsReport,
  useStaffReport,
  useInsightsReport,
} from "@/features/analytics/hooks/useDashboardData";
import type { AnalyticsRange } from "@/features/analytics/lib/fetchReport";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { Permission } from "@/lib/rbac";
import { MyShiftOverview } from "@/features/analytics/components/MyShiftOverview";
import { Spinner } from "@/lib/components/ui";

export function OverviewClient({
  organizationId,
  businessId,
}: {
  organizationId: string;
  businessId: string;
}) {
  const normalizedOrgId = organizationId;
  const normalizedBusinessId = businessId;

  const { can, isLoading: sessionLoading } = usePermissions();
  const canReports = can(Permission.REPORTS_READ);
  const canOwnSales = can(Permission.SALES_READ_OWN);

  const [tab, setTab] = useState<DashboardTab>("sales");
  const [period, setPeriod] = useState<AnalyticsRange>("today");
  const [customDate, setCustomDate] = useState<string | undefined>();

  const dateArg = period === "custom" ? customDate : undefined;
  const hourlyGrain =
    period === "today" || period === "yesterday" || period === "custom";

  const dash = useSalesDashboard(
    normalizedBusinessId,
    period,
    dateArg,
    canReports
  );
  const hourly = useHourlyReport(
    normalizedBusinessId,
    period,
    canReports && tab === "sales" && hourlyGrain,
    dateArg
  );
  const products = useProductsReport(
    normalizedBusinessId,
    period,
    canReports && tab === "products",
    dateArg
  );
  const staff = useStaffReport(
    normalizedBusinessId,
    period,
    canReports && tab === "staff",
    dateArg
  );
  const insights = useInsightsReport(
    normalizedBusinessId,
    period,
    canReports && tab === "sales",
    dateArg
  );

  const anyError =
    dash.isError || hourly.isError || products.isError || staff.isError;
  const errorMessage = useMemo(() => {
    const e =
      (dash.error as Error) ||
      (hourly.error as Error) ||
      (products.error as Error) ||
      (staff.error as Error);
    return e?.message || "Failed to load report";
  }, [dash.error, hourly.error, products.error, staff.error]);

  const orders = dash.data?.summary?.total_completed_orders_count ?? 0;
  const showFirstUse =
    !dash.isLoading &&
    !dash.isError &&
    Boolean(dash.data) &&
    orders === 0 &&
    tab === "sales";

  if (sessionLoading) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 p-10 text-muted">
        <Spinner /> Loading…
      </div>
    );
  }

  if (!canReports && canOwnSales) {
    return (
      <MyShiftOverview
        organizationId={normalizedOrgId}
        businessId={normalizedBusinessId}
      />
    );
  }

  if (!canReports) {
    return (
      <div className="mx-auto max-w-md p-10 text-center text-sm text-muted">
        <p className="font-medium text-foreground">Overview not available</p>
        <p className="mt-2">
          You do not have permission to view branch reports.
        </p>
      </div>
    );
  }

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
        <div
          className="rounded-md border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--error)",
            backgroundColor: "var(--error-container)",
            color: "var(--error)",
          }}
          role="alert"
        >
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

      {showFirstUse && (
        <div className="rounded-md border border-border/50 bg-card px-4 py-4 text-sm shadow-card">
          <p className="font-medium text-foreground">No completed sales yet</p>
          <p className="mt-1 text-muted">
            This overview fills in after your first completed sale. Start on
            the terminal, or review stock so the next sale is ready.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/org/${normalizedOrgId}/${normalizedBusinessId}/terminal`}
              className="rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Record first sale
            </Link>
            <Link
              href={`/org/${normalizedOrgId}/${normalizedBusinessId}/inventory`}
              className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-card"
            >
              Check inventory
            </Link>
          </div>
        </div>
      )}

      <div
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="min-h-[480px] flex-1"
      >
        {tab === "sales" && (
          <div className="space-y-4">
            <SalesPanel
              dashboard={dash.data}
              hourly={hourly.data}
              period={period}
              loading={dash.isLoading || (hourlyGrain && hourly.isLoading)}
            />
            <InsightsStrip
              insights={insights.data?.insights}
              loading={insights.isLoading}
            />
          </div>
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
