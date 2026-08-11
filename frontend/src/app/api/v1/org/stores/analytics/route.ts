// // app/api/v1/org/stores/[businessId]/analytics/summaries/route.ts
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
//   return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
// }

// function isoDay(d: Date) {
//   return d.toISOString(); // e.g. 2026-08-06T00:00:00.000Z
// }

// /** Deterministic-ish daily numbers so the chart isn't flat */
// function dayMetrics(dayIndex: number) {
//   const baseOrders = 3 + ((dayIndex * 5) % 9); // 3–11
//   const avgTicket = 1200 + ((dayIndex * 370) % 2800); // ~1.2k–4k
//   const gross = baseOrders * avgTicket;
//   const discount = dayIndex % 4 === 0 ? Math.round(gross * 0.05) : 0;
//   const tax = Math.round((gross - discount) * 0.0); // keep 0 like your sample, or use 0.16 if you want VAT
//   const net = gross - discount + tax;

//   return {
//     orders: baseOrders,
//     gross,
//     discount,
//     tax,
//     net,
//   };
// }

// export async function GET(
//   _req: NextRequest,
//   context: { params: Promise<{ businessId: string }> }
// ) {
//   const session = await auth();
//   if (!session?.user) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

// //   const { businessId } = await context.params;

//   const today = startOfDayUTC(new Date());
//   const rows: MockRow[] = [];

//   // ~35 days so "month" + prior period comparisons have data
//   for (let i = 34; i >= 0; i--) {
//     const d = new Date(today);
//     d.setUTCDate(d.getUTCDate() - i);

//     const m = dayMetrics(i);
//     const ts = isoDay(d);
//     const id = `mock-${d.toISOString().slice(0, 10)}`;

//     rows.push({
//       id,
//       business_id: "18ac4424-6660-42d1-8983-13e37bc3dc75",
//       date_dimension: ts,
//       created_at: ts,
//       updated_at: ts,
//       deleted_at: null,
//       gross_sales_volume: m.gross,
//       total_tax_collected: m.tax,
//       total_discounts_granted: m.discount,
//       net_revenue_collected: m.net,
//       refund_deductions_volume: i % 11 === 0 ? Math.round(m.net * 0.02) : 0,
//       total_completed_orders_count: m.orders,
//     });
//   }

//   // Optional: include your real sample-shaped day so it feels familiar
//   // (already covered by the loop; no extra push needed)

//   return NextResponse.json(rows);
// }

// src/app/api/v1/org/stores/analytics/route.ts
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/auth";

type MockRow = {
  created_at: string;
  id: string;
  deleted_at: null;
  total_tax_collected: number;
  net_revenue_collected: number;
  total_completed_orders_count: number;
  updated_at: string;
  business_id: string;
  date_dimension: string;
  gross_sales_volume: number;
  total_discounts_granted: number;
  refund_deductions_volume: number;
};

function startOfDayUTC(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

function isoDay(d: Date) {
  return d.toISOString();
}

function dayMetrics(dayIndex: number) {
  const baseOrders = 3 + ((dayIndex * 5) % 9);
  const avgTicket = 1200 + ((dayIndex * 370) % 2800);
  const gross = baseOrders * avgTicket;
  const discount = dayIndex % 4 === 0 ? Math.round(gross * 0.05) : 0;
  const tax = 0;
  const net = gross - discount + tax;

  return { orders: baseOrders, gross, discount, tax, net };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional: ?businessId=... from the client
  const businessId =
    req.nextUrl.searchParams.get("businessId") ??
    "18ac4424-6660-42d1-8983-13e37bc3dc75";

  const today = startOfDayUTC(new Date());
  const rows: MockRow[] = [];

  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);

    const m = dayMetrics(i);
    const ts = isoDay(d);

    rows.push({
      id: `mock-${d.toISOString().slice(0, 10)}`,
      business_id: businessId,
      date_dimension: ts,
      created_at: ts,
      updated_at: ts,
      deleted_at: null,
      gross_sales_volume: m.gross,
      total_tax_collected: m.tax,
      total_discounts_granted: m.discount,
      net_revenue_collected: m.net,
      refund_deductions_volume:
        i % 11 === 0 ? Math.round(m.net * 0.02) : 0,
      total_completed_orders_count: m.orders,
    });
  }

  return NextResponse.json(rows);
}