import { useState } from "react";

interface RankedBarItem {
  label: string;
  value: number;
}

export function RankedBarList({
  items,
  emptyLabel = "No data yet.",
  valueFormatter = (v: number) => v.toLocaleString(),
}: {
  items: RankedBarItem[];
  emptyLabel?: string;
  valueFormatter?: (value: number) => string;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-text-faint">{emptyLabel}</p>;
  }
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-medium text-text">{item.label}</span>
            <span className="shrink-0 tabular-nums text-text-muted">{valueFormatter(item.value)}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-elevated">
            <div
              className="h-2 bg-[#2a78d6] transition-all dark:bg-[#3987e5]"
              style={{
                width: `${Math.max(3, (item.value / max) * 100)}%`,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

interface StatusSegment {
  label: string;
  value: number;
  color: string;
}

export function StatusMixBar({ segments }: { segments: StatusSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return <p className="py-6 text-center text-sm text-text-faint">No clients yet.</p>;
  }
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-surface-elevated">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.label}
              className="h-full"
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
              title={`${s.label}: ${s.value}`}
            />
          ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-text-muted">{s.label}</span>
            <span className="font-medium tabular-nums text-text">{s.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TrendPoint {
  label: string;
  value: number;
}

export function TrendLineChart({ points }: { points: TrendPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 480;
  const height = 160;
  const padding = 20;

  if (points.length === 0 || points.every((p) => p.value === 0)) {
    return <p className="py-6 text-center text-sm text-text-faint">No new clients in this period.</p>;
  }

  const max = Math.max(1, ...points.map((p) => p.value));
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const xAt = (i: number) => padding + i * stepX;
  const yAt = (v: number) => height - padding - (v / max) * (height - padding * 2);

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.value)}`).join(" ");
  const areaPath = `${linePath} L ${xAt(points.length - 1)} ${height - padding} L ${xAt(0)} ${height - padding} Z`;

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.min(points.length - 1, Math.max(0, Math.round((relX - padding) / (stepX || 1))));
    setHoverIndex(idx);
  };

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full touch-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={padding}
            x2={width - padding}
            y1={padding + f * (height - padding * 2)}
            y2={padding + f * (height - padding * 2)}
            className="stroke-border"
            strokeWidth={1}
          />
        ))}
        <path d={areaPath} className="fill-[#2a78d6] dark:fill-[#3987e5]" opacity={0.1} stroke="none" />
        <path d={linePath} className="stroke-[#2a78d6] dark:stroke-[#3987e5]" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {hoverIndex !== null && (
          <line
            x1={xAt(hoverIndex)}
            x2={xAt(hoverIndex)}
            y1={padding}
            y2={height - padding}
            className="stroke-border-strong"
            strokeWidth={1}
          />
        )}

        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          const isHovered = hoverIndex === i;
          if (!isLast && !isHovered) return null;
          return (
            <circle
              key={p.label}
              cx={xAt(i)}
              cy={yAt(p.value)}
              r={isHovered ? 5 : 4}
              className="fill-[#2a78d6] stroke-surface dark:fill-[#3987e5]"
              strokeWidth={2}
            />
          );
        })}

        <text
          x={xAt(points.length - 1)}
          y={yAt(points[points.length - 1].value) - 10}
          textAnchor="end"
          className="fill-text text-[10px] font-semibold"
        >
          {points[points.length - 1].value}
        </text>
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-text-faint">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
      {hovered && hoverIndex !== null && (
        <div
          className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-surface px-2 py-1 text-xs shadow-md"
          style={{ left: `${(xAt(hoverIndex) / width) * 100}%` }}
        >
          <p className="font-semibold text-text">{hovered.value} new</p>
          <p className="text-text-faint">{hovered.label}</p>
        </div>
      )}
    </div>
  );
}
