"use client";

import React, { useMemo } from "react";

export function LineChart({
  points,
  height = 180,
}: {
  points: { label: string; value: number }[];
  height?: number;
}) {
  const { path, max } = useMemo(() => {
    const vals = points.map((p) => p.value);
    const maxV = Math.max(...vals, 1);
    const w = 100;
    const h = 100;
    const coords = points.map((p, i) => {
      const x = points.length <= 1 ? 50 : (i / (points.length - 1)) * w;
      const y = h - (p.value / maxV) * (h - 8) - 4;
      return `${x},${y}`;
    });
    return { path: coords.join(" "), max: maxV };
  }, [points]);

  if (!points.length) {
    return <EmptyChart label="No series data" height={height} />;
  }

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label="Revenue series">
      <polyline
        fill="none"
        stroke="#0d9488"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        points={path}
      />
      {points.map((p, i) => {
        const x = points.length <= 1 ? 50 : (i / (points.length - 1)) * 100;
        const y = 100 - (p.value / max) * 92 - 4;
        return <circle key={p.label + i} cx={x} cy={y} r="1.2" fill="#0d9488" />;
      })}
    </svg>
  );
}

export function BarChart({
  points,
  height = 180,
}: {
  points: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  if (!points.length) {
    return <EmptyChart label="No hourly data" height={height} />;
  }
  return (
    <div className="flex h-full items-end gap-1" style={{ height }} role="img" aria-label="Hourly bars">
      {points.map((p, i) => (
        <div
          key={p.label + i}
          className="flex-1 rounded-t bg-teal-500/80 min-w-0"
          style={{ height: `${Math.max(4, (p.value / max) * 100)}%` }}
          title={`${p.label}: ${p.value}`}
        />
      ))}
    </div>
  );
}

function EmptyChart({ label, height }: { label: string; height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400"
      style={{ height }}
    >
      {label}
    </div>
  );
}
