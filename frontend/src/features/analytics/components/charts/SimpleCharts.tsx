"use client";

import React, { useMemo } from "react";

export function LineChart({
  points,
  height = 200,
}: {
  points: { label: string; value: number }[];
  height?: number;
}) {
  const { line, area, hasData } = useMemo(() => {
    const vals = points.map((p) => p.value);
    const maxV = Math.max(...vals, 1);
    const has = vals.some((v) => v > 0);
    const w = 360;
    const h = 120;
    const coords = points.map((p, i) => {
      const x = points.length <= 1 ? w / 2 : (i / (points.length - 1)) * w;
      const y = h - (p.value / maxV) * (h - 16) - 8;
      return { x, y, ...p };
    });
    const linePts = coords.map((c) => `${c.x},${c.y}`).join(" ");
    const areaPts = `0,${h} ${linePts} ${w},${h}`;
    return { line: linePts, area: areaPts, hasData: has };
  }, [points]);

  if (!points.length || !hasData) {
    return <EmptyChart label="No revenue in this period yet" height={height} />;
  }

  return (
    <div className="flex w-full flex-col" style={{ height }}>
      <svg
        viewBox="0 0 360 120"
        preserveAspectRatio="none"
        className="min-h-0 w-full flex-1"
        role="img"
        aria-label="Revenue trend"
      >
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 60, 90].map((y) => (
          <line
            key={y}
            x1={0}
            x2={360}
            y1={y}
            y2={y}
            stroke="var(--border)"
            strokeWidth={0.5}
            strokeDasharray="4 4"
            opacity={0.7}
          />
        ))}
        <polygon points={area} fill="url(#lineFill)" />
        <polyline
          fill="none"
          stroke="var(--brand-primary)"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          points={line}
        />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        {points.map((p) => (
          <span key={p.label} className="truncate">
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
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
    return <EmptyChart label="No hourly sales in this window" height={height} />;
  }

  // Cap visible bars for readability
  const bars = points.length > 24 ? points.slice(-24) : points;
  const w = 640;
  const h = 160;
  const padT = 12;
  const padB = 24;
  const padL = 4;
  const padR = 4;
  const innerH = h - padT - padB;
  const gap = 3;
  const barW = Math.max(5, (w - padL - padR - gap * (bars.length - 1)) / bars.length);
  const labelEvery = Math.max(1, Math.ceil(bars.length / 8));

  return (
    <div className="flex w-full flex-col" style={{ height }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="min-h-0 w-full flex-1"
        role="img"
        aria-label="Hourly revenue bars"
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
      <p className="mt-1 text-right text-[10px] tabular-nums text-muted">
        Peak {max.toLocaleString()}
      </p>
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
      <div className="mb-1 flex items-center gap-4 text-[10px] text-muted">
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
      <div className="mt-1 flex justify-between text-[10px] text-muted">
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
      className="flex items-center justify-center rounded-lg border border-dashed border-border/60 bg-card/50 text-sm text-muted"
      style={{ height }}
    >
      {label}
    </div>
  );
}
