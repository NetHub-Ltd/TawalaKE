"use client";

import { cn } from "@/lib/utils";

export interface LineChartDatum {
  label: string;
  value: number;
}

export interface LineChartProps {
  data: LineChartDatum[];
  title?: string;
  className?: string;
  height?: number;
  formatValue?: (n: number) => string;
}

/** Smooth-ish polyline chart with petrol stroke and mint fill under the curve. */
export function LineChart({
  data,
  title = "Trend",
  className,
  height = 200,
  formatValue = (n) => n.toLocaleString(),
}: LineChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const pad = { top: 20, right: 8, bottom: 32, left: 8 };
  const w = 100;
  const innerH = height - pad.top - pad.bottom;
  const innerW = w - pad.left - pad.right;
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = pad.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = pad.top + innerH - ((d.value - min) / range) * innerH;
    return { x, y, ...d };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${pad.left},${pad.top + innerH} ${line} ${pad.left + innerW},${pad.top + innerH}`;

  return (
    <div className={cn("card-layered w-full p-4", className)}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {points.length > 0 ? (
          <p className="amount-md text-foreground">{formatValue(points[points.length - 1].value)}</p>
        ) : null}
      </div>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={title}
        preserveAspectRatio="xMidYMid meet"
      >
        <polygon points={area} fill="var(--success-soft)" opacity={0.85} />
        <polyline
          points={line}
          fill="none"
          stroke="var(--brand-primary)"
          strokeWidth={1.4}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r={1.6} fill="var(--brand-accent)" />
        ))}
        {points.map((p, i) =>
          i % Math.ceil(points.length / 6) === 0 || i === points.length - 1 ? (
            <text
              key={`l-${p.label}`}
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              className="fill-[var(--muted)]"
              style={{ fontSize: 4, fontFamily: "var(--font-sans)" }}
            >
              {p.label}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}
