"use client";

import React, { useId, useMemo } from "react";
import { formatPct } from "@/features/analytics/lib/format";

export type MetricPoint = { label: string; value: number };

/** Catmull-Rom → cubic Bezier path through exact points (visual smooth only). */
function smoothPath(coords: { x: number; y: number }[]): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;
  if (coords.length === 2) {
    return `M ${coords[0].x} ${coords[0].y} L ${coords[1].x} ${coords[1].y}`;
  }
  let d = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i === 0 ? 0 : i - 1];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2 < coords.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function toCoords(
  points: MetricPoint[],
  maxV: number,
  w: number,
  h: number,
  padT: number,
  padB: number,
  padX: number
) {
  const innerH = h - padT - padB;
  const n = points.length;
  return points.map((p, i) => {
    const x = n <= 1 ? w / 2 : padX + (i / (n - 1)) * (w - padX * 2);
    const y = padT + innerH - (p.value / maxV) * innerH;
    return { x, y, ...p };
  });
}

/** Single-series line chart for overview metric tabs. */
export function MetricLineChart({
  points,
  comparisonPoints,
  height = 240,
  emptyLabel = "No completed sales in this period",
  deltaPct,
  valueFormatter,
}: {
  points: MetricPoint[];
  /** Previous comparable window (aligned by index when lengths match). */
  comparisonPoints?: MetricPoint[];
  height?: number;
  emptyLabel?: string;
  /** Overall period % change vs previous window (for end callout). */
  deltaPct?: number | null;
  valueFormatter?: (n: number) => string;
}) {
  const gradId = useId().replace(/:/g, "");
  const fmt = valueFormatter ?? ((n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 })
  );

  const geometry = useMemo(() => {
    const vals = points.map((p) => p.value);
    const cmpVals = (comparisonPoints || []).map((p) => p.value);
    const maxV = Math.max(...vals, ...cmpVals, 1);
    const hasData = vals.some((v) => v > 0);
    const w = 640;
    const h = 160;
    const padT = 16;
    const padB = 8;
    const padX = 16;
    const coords = toCoords(points, maxV, w, h, padT, padB, padX);
    const cmpCoords =
      comparisonPoints && comparisonPoints.length > 0
        ? toCoords(comparisonPoints, maxV, w, h, padT, padB, padX)
        : [];
    const path = smoothPath(coords);
    const cmpPath = smoothPath(cmpCoords);
    const areaPath =
      coords.length > 0
        ? `${path} L ${coords[coords.length - 1].x} ${h - padB} L ${coords[0].x} ${h - padB} Z`
        : "";
    return {
      path,
      cmpPath,
      areaPath,
      hasData,
      coords,
      cmpCoords,
      maxV,
      w,
      h,
    };
  }, [points, comparisonPoints]);

  if (!points.length || !geometry.hasData) {
    return <EmptyChart label={emptyLabel} height={height} />;
  }

  const { path, cmpPath, areaPath, coords, maxV, w, h } = geometry;
  const labelEvery = Math.max(1, Math.ceil(points.length / 8));
  const last = coords[coords.length - 1];
  const showDelta =
    deltaPct !== undefined && deltaPct !== null && Number.isFinite(deltaPct);
  const deltaTone =
    showDelta && deltaPct! > 0
      ? "text-[color:var(--success)]"
      : showDelta && deltaPct! < 0
        ? "text-[color:var(--error)]"
        : "text-muted";

  return (
    <div className="flex w-full flex-col" style={{ height }}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded-full bg-brand-primary"
              aria-hidden
            />
            This period
          </span>
          {comparisonPoints && comparisonPoints.length > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-px w-4 border-t border-dashed border-muted"
                aria-hidden
              />
              Previous window
            </span>
          ) : null}
        </div>
        <div className="flex items-baseline gap-2 font-mono tabular-nums">
          <span className="text-sm font-semibold text-foreground">
            {fmt(last.value)}
          </span>
          {showDelta ? (
            <span className={deltaTone}>{formatPct(deltaPct!)}</span>
          ) : (
            <span className="text-muted">vs prior —</span>
          )}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="min-h-0 w-full flex-1"
        role="img"
        aria-label={`Trend, latest ${fmt(last.value)}${
          showDelta ? `, ${formatPct(deltaPct!)} vs previous window` : ""
        }`}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--brand-primary)"
              stopOpacity="0.22"
            />
            <stop
              offset="100%"
              stopColor="var(--brand-primary)"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={12}
            x2={628}
            y1={16 + (160 - 24) * (1 - t)}
            y2={16 + (160 - 24) * (1 - t)}
            stroke="var(--border)"
            strokeWidth={0.75}
            strokeDasharray="4 4"
            opacity={0.65}
          />
        ))}
        {cmpPath ? (
          <path
            d={cmpPath}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 4"
            opacity={0.55}
          />
        ) : null}
        {areaPath ? <path d={areaPath} fill={`url(#${gradId})`} /> : null}
        <path
          d={path}
          fill="none"
          stroke="var(--brand-primary)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={points.length <= 1 ? 4 : i === coords.length - 1 ? 3.5 : 2.5}
            fill="var(--brand-primary)"
          >
            <title>
              {c.label}: {fmt(c.value)}
            </title>
          </circle>
        ))}
        {/* Max guide label */}
        <text
          x={w - 8}
          y={14}
          textAnchor="end"
          fill="var(--muted)"
          style={{ fontSize: 9 }}
        >
          {fmt(maxV)}
        </text>
      </svg>
      <div className="mt-1 flex justify-between gap-1 text-xs text-muted">
        {points.map((p, i) =>
          i % labelEvery === 0 || i === points.length - 1 ? (
            <span key={p.label + i} className="truncate">
              {p.label}
            </span>
          ) : (
            <span key={p.label + i} />
          )
        )}
      </div>
    </div>
  );
}

/** @deprecated Prefer MetricLineChart — kept for other panels if needed */
export function LineChart({
  points,
  height = 200,
}: {
  points: { label: string; value: number }[];
  height?: number;
}) {
  return <MetricLineChart points={points} height={height} />;
}

export function BarChart({
  points,
  height = 200,
}: {
  points: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const hasData = points.some((p) => p.value > 0);

  if (!points.length || !hasData) {
    return <EmptyChart label="No data in this window" height={height} />;
  }

  const bars = points.length > 24 ? points.slice(-24) : points;
  const w = 640;
  const h = 160;
  const padT = 12;
  const padB = 24;
  const padL = 4;
  const padR = 4;
  const innerH = h - padT - padB;
  const gap = 3;
  const barW = Math.max(
    5,
    (w - padL - padR - gap * (bars.length - 1)) / bars.length
  );
  const labelEvery = Math.max(1, Math.ceil(bars.length / 8));

  return (
    <div className="flex w-full flex-col" style={{ height }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="min-h-0 w-full flex-1"
        role="img"
        aria-label="Bars"
      >
        {[0.25, 0.5, 0.75].map((t) => {
          const y = padT + innerH * (1 - t);
          return (
            <line
              key={t}
              x1={padL}
              x2={w - padR}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.55}
            />
          );
        })}
        {bars.map((p, i) => {
          const bh = (p.value / max) * innerH;
          const x = padL + i * (barW + gap);
          const y = padT + innerH - bh;
          return (
            <g key={p.label + i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(bh, p.value > 0 ? 2 : 0)}
                rx={2.5}
                fill="var(--brand-accent)"
                opacity={p.value > 0 ? 0.92 : 0.12}
              >
                <title>
                  {p.label}: {p.value}
                </title>
              </rect>
              {(i % labelEvery === 0 || i === bars.length - 1) && (
                <text
                  x={x + barW / 2}
                  y={h - 6}
                  textAnchor="middle"
                  fill="var(--muted)"
                  style={{ fontSize: 10 }}
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Revenue (line) + sales count (bars) on independent scales so the graph always moves. */
export function DualTrendChart({
  points,
  height = 200,
}: {
  points: { label: string; revenue: number; orders: number }[];
  height?: number;
}) {
  const maxRev = Math.max(...points.map((p) => p.revenue), 1);
  const maxOrd = Math.max(...points.map((p) => p.orders), 1);
  const hasData = points.some((p) => p.revenue > 0 || p.orders > 0);

  if (!points.length || !hasData) {
    return <EmptyChart label="No sales in this period yet" height={height} />;
  }

  const w = 360;
  const h = 120;
  const padT = 10;
  const padB = 4;
  const padL = 8;
  const padR = 8;
  const innerH = h - padT - padB;
  const n = points.length;
  const gap = 4;
  const slot = (w - padL - padR) / n;
  const barW = Math.max(4, slot - gap);

  const linePts = points
    .map((p, i) => {
      const x = padL + slot * i + slot / 2;
      const y = padT + innerH - (p.revenue / maxRev) * innerH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="flex w-full flex-col" style={{ height }}>
      <div className="mb-1 flex items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-brand-accent" /> Sales (count)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded bg-brand-primary" /> Revenue
        </span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="min-h-0 w-full flex-1"
        role="img"
        aria-label="Daily sales count and revenue"
      >
        {[0.25, 0.5, 0.75].map((t) => {
          const y = padT + innerH * (1 - t);
          return (
            <line
              key={t}
              x1={padL}
              x2={w - padR}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth={0.5}
              strokeDasharray="4 4"
              opacity={0.6}
            />
          );
        })}
        {points.map((p, i) => {
          const bh = (p.orders / maxOrd) * innerH;
          const x = padL + slot * i + (slot - barW) / 2;
          const y = padT + innerH - bh;
          return (
            <rect
              key={"b" + i}
              x={x}
              y={y}
              width={barW}
              height={Math.max(bh, p.orders > 0 ? 2 : 0)}
              rx={2}
              fill="var(--brand-accent)"
              opacity={p.orders > 0 ? 0.55 : 0.1}
            >
              <title>
                {p.label}: {p.orders} sales · revenue {p.revenue}
              </title>
            </rect>
          );
        })}
        <polyline
          fill="none"
          stroke="var(--brand-primary)"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={linePts}
        />
        {points.map((p, i) => {
          if (p.revenue <= 0) return null;
          const x = padL + slot * i + slot / 2;
          const y = padT + innerH - (p.revenue / maxRev) * innerH;
          return (
            <circle
              key={"c" + i}
              cx={x}
              cy={y}
              r={2.5}
              fill="var(--brand-primary)"
            />
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted">
        {points.map((p) => (
          <span key={p.label} className="truncate">
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyChart({ label, height }: { label: string; height: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-card/50 px-4 text-center text-sm text-muted"
      style={{ height }}
    >
      <p>{label}</p>
      <p className="text-xs text-muted">
        Record a sale from the terminal to see trend here.
      </p>
    </div>
  );
}
