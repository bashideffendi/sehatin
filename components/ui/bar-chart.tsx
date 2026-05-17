import * as React from "react";
import { cn } from "@/lib/utils";

export interface BarDatum {
  /** Display label below bar, e.g. "Sen", "Sel" */
  label: string;
  /** Value to render */
  value: number;
  /** Mark as "today" — gets forest highlight */
  isToday?: boolean;
  /** Mark as over-target — gets clay color */
  isOver?: boolean;
  /** Mark as under-target — gets moss/forest-100 muted */
  isUnder?: boolean;
  /** Hover/click handler */
  onClick?: () => void;
}

interface BarChartProps {
  data: BarDatum[];
  /** Max value override — defaults to max of data * 1.1 */
  max?: number;
  /** Reference line value (e.g. target kcal) */
  reference?: number;
  /** Height of the bar area (excludes label row) in px */
  height?: number;
  className?: string;
}

export function BarChart({
  data,
  max,
  reference,
  height = 100,
  className,
}: BarChartProps) {
  const computedMax = max ?? Math.max(...data.map((d) => d.value), reference ?? 0, 1) * 1.1;

  return (
    <div className={cn("w-full", className)}>
      <div
        className="relative grid gap-2 items-end"
        style={{
          gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
          height,
        }}
      >
        {reference && reference < computedMax ? (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-hairline-2 pointer-events-none"
            style={{ bottom: `${(reference / computedMax) * 100}%` }}
            aria-hidden
          />
        ) : null}
        {data.map((d, i) => {
          const heightPct = (d.value / computedMax) * 100;
          let barClass = "bg-forest-100";
          if (d.isToday) barClass = "bg-forest border border-forest-700";
          else if (d.isOver) barClass = "bg-clay";
          else if (d.isUnder) barClass = "bg-forest-100";
          return (
            <button
              key={i}
              onClick={d.onClick}
              disabled={!d.onClick}
              className={cn(
                "rounded-t-md transition-colors w-full",
                barClass,
                d.onClick && "hover:opacity-80 cursor-pointer",
              )}
              style={{ height: `${Math.max(heightPct, 3)}%` }}
              aria-label={`${d.label}: ${d.value}`}
            />
          );
        })}
      </div>
      <div
        className="grid gap-2 mt-1.5"
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
      >
        {data.map((d, i) => (
          <div
            key={i}
            className={cn(
              "text-[10px] text-center font-semibold uppercase tracking-wide",
              d.isToday ? "text-ink" : "text-muted",
            )}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
