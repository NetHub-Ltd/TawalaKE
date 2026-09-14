"use client";

import { cn } from "@/lib/utils";

export interface BarChartDatum {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarChartDatum[];
  /** Accessible name */
  title?: string;
  className?: string;
  /** Format tick values e.g. money */
  formatValue?: (n: number) => string;
  height?: number;
}

/**
 * Responsive SVG bar chart — petrol primary bars, muted axis labels.
 * No external chart dependency.
 */
export function BarChart({
  data,
  title = "Chart",
  className,
  formatValue = (n) => n.toLocaleString(),
  height = 200,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const pad = { top: 16, right: 8, bottom: 36, left: 8 };
  const width = 100; // viewBox units; SVG scales
  const innerH = height - pad.top - pad.bottom;
  const barSlot = width / data.length;
  const barW = barSlot * 0.55;

  return (
    <div className={cn("card-layered w-full p-4", className)}>
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={title}
        preserveAspectRatio="xMidYMid meet"
      >
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = i * barSlot + (barSlot - barW) / 2;
          const y = pad.top + innerH - h;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, 1)}
                rx={1.2}
                fill="var(--brand-primary)"
                opacity={0.92}
              />
              <text
                x={i * barSlot + barSlot / 2}
                y={height - 12}
                textAnchor="middle"
                className="fill-[var(--muted)]"
                style={{ fontSize: 4.5, fontFamily: "var(--font-sans)" }}
              >
                {d.label}
              </text>
              <text
                x={i * barSlot + barSlot / 2}
                y={y - 2}
                textAnchor="middle"
                className="fill-[var(--foreground)]"
                style={{ fontSize: 4, fontFamily: "var(--font-sans)", fontVariantNumeric: "tabular-nums" }}
              >
                {formatValue(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
