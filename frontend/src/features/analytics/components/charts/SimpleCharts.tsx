"use client";

import React, { useMemo } from "react";

export type MetricPoint = { label: string; value: number };

/** Single-series line chart for overview metric tabs. */
export function MetricLineChart({
  points,
  height = 240,
  emptyLabel = "No completed sales in this period",
}: {
  points: MetricPoint[];
  height?: number;
  emptyLabel?: string;
}) {
  const { line, area, hasData, coords } = useMemo(() => {
    const vals = points.map((p) => p.value);
    const maxV = Math.max(...vals, 1);
    const has = vals.some((v) => v > 0) || points.length > 0;
    const w = 640;
    const h = 160;
    const padT = 12;
    const padB = 8;
    const padX = 12;
    const innerH = h - padT - padB;
    const n = points.length;
    const coords = points.map((p, i) => {
      const x =
        n <= 1 ? w / 2 : padX + (i / (n - 1)) * (w - padX * 2);
      const y = padT + innerH - (p.value / maxV) * innerH;
      return { x, y, ...p };
    });
    const linePts = coords.map((c) => `${c.x},${c.y}`).join(" ");
    const areaPts =
      coords.length > 0
        ? `${coords[0].x},${h - padB} ${linePts} ${coords[coords.length - 1].x},${h - padB}`
        : "";
    return {
      line: linePts,
      area: areaPts,
      hasData: has && vals.some((v) => v > 0),
      coords,
      maxV,
    };
  }, [points]);

  if (!points.length || !hasData) {
    return <EmptyChart label={emptyLabel} height={height} />;
  }

  const labelEvery = Math.max(1, Math.ceil(points.length / 8));

  return (
    <div className="flex w-full flex-col" style={{ height }}>
      <svg
        viewBox="0 0 640 160"
        preserveAspectRatio="none"
        className="min-h-0 w-full flex-1"
        role="img"
        aria-label="Trend"
      >
        <defs>
          <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={12}
            x2={628}
            y1={12 + (160 - 20) * (1 - t)}
            y2={12 + (160 - 20) * (1 - t)}
            stroke="var(--border)"
            strokeWidth={0.75}
            strokeDasharray="4 4"
            opacity={0.65}
          />
        ))}
        {area && <polygon points={area} fill="url(#metricFill)" />}
        <polyline
          fill="none"
          stroke="var(--brand-primary)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={line}
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={points.length <= 1 ? 4 : 2.75}
            fill="var(--brand-primary)"
          >
            <title>
              {c.label}: {c.value}
            </title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between gap-1 text-[10px] text-muted">
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

function EmptyChart({ label, height }: { label: string; height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/50 text-sm text-muted"
      style={{ height }}
    >
      {label}
    </div>
  );
}
