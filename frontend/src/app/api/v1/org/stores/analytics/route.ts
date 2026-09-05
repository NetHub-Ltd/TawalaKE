// // src/app/api/v1/org/stores/analytics/route.ts
// import { NextResponse, NextRequest } from "next/server";
// import { auth } from "@/auth";

// type MockRow = {
//   created_at: string;
//   id: string;
//   deleted_at: null;
//   total_tax_collected: number;
//   net_revenue_collected: number;
//   total_completed_orders_count: number;
//   updated_at: string;
//   business_id: string;
//   date_dimension: string;
//   gross_sales_volume: number;
//   total_discounts_granted: number;
//   refund_deductions_volume: number;
// };

// function startOfDayUTC(d: Date) {
//   return new Date(
//     Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
//   );
// }

// function isoDay(d: Date) {
//   return d.toISOString();
// }

// function dayMetrics(dayIndex: number) {
//   const baseOrders = 3 + ((dayIndex * 5) % 9);
//   const avgTicket = 1200 + ((dayIndex * 370) % 2800);
//   const gross = baseOrders * avgTicket;
//   const discount = dayIndex % 4 === 0 ? Math.round(gross * 0.05) : 0;
//   const tax = 0;
//   const net = gross - discount + tax;

//   return { orders: baseOrders, gross, discount, tax, net };
// }

// export async function GET(req: NextRequest) {
//   const session = await auth();
//   if (!session?.user) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   // Optional: ?businessId=... from the client
//   const businessId =
//     req.nextUrl.searchParams.get("businessId") ??
//     "18ac4424-6660-42d1-8983-13e37bc3dc75";

//   const today = startOfDayUTC(new Date());
//   const rows: MockRow[] = [];

//   for (let i = 34; i >= 0; i--) {
//     const d = new Date(today);
//     d.setUTCDate(d.getUTCDate() - i);

//     const m = dayMetrics(i);
//     const ts = isoDay(d);

//     rows.push({
//       id: `mock-${d.toISOString().slice(0, 10)}`,
//       business_id: businessId,
//       date_dimension: ts,
//       created_at: ts,
//       updated_at: ts,
//       deleted_at: null,
//       gross_sales_volume: m.gross,
//       total_tax_collected: m.tax,
//       total_discounts_granted: m.discount,
//       net_revenue_collected: m.net,
//       refund_deductions_volume:
//         i % 11 === 0 ? Math.round(m.net * 0.02) : 0,
//       total_completed_orders_count: m.orders,
//     });
//   }

//   return NextResponse.json(rows);
// }

// src/app/api/v1/org/stores/analytics/route.ts
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";

/**
 * Allowed period values must match the backend AnalyticsPeriod enum.
 */
const ALLOWED_PERIODS = new Set(["today", "3d", "7d", "month"]);

/**
 * Proxies dashboard analytics to the FastAPI backend.
 *
 * Query:
 * - businessId (required) – business UUID
 * - period (optional) – today | 3d | 7d | month (default 7d)
 *
 * Forwards the session access token as Bearer auth.
 */
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessId = req.nextUrl.searchParams.get("businessId");
  const periodParam = req.nextUrl.searchParams.get("period") ?? "7d";
  const period = ALLOWED_PERIODS.has(periodParam) ? periodParam : "7d";

  if (!businessId) {
    return NextResponse.json(
      { error: "businessId is required" },
      { status: 400 }
    );
  }

  const backendBase = process.env.BACKEND_URL;
  if (!backendBase) {
    return NextResponse.json(
      { error: "BACKEND_URL is not configured" },
      { status: 500 }
    );
  }

  const url = new URL(`/api/v1/reports/${businessId}/dashboard`, backendBase);
  url.searchParams.set("period", period);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            body.detail ||
            body.message ||
            body.error ||
            "Failed to load analytics",
        },
        { status: res.status }
      );
    }

    // Backend shape: { period, window, previous_window, summary, previous_summary, series }
    return NextResponse.json(body);
  } catch (err) {
    console.error("[analytics proxy]", err);
    return NextResponse.json(
      { error: "Analytics service unavailable" },
      { status: 502 }
    );
  }
}