"use client";
import type { DailySummary } from "@/lib/food-log";
import { cn, fmtNum } from "@/lib/utils";

interface Props {
  days: DailySummary[]; // oldest -> newest, exactly 7
  targetKcal?: number;
  onSelectDay?: (date: string) => void;
  activeDate?: string;
}

const DAY_LABELS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function WeeklyChart({
  days,
  targetKcal,
  onSelectDay,
  activeDate,
}: Props) {
  // Compute chart scale: max of (target * 1.3) or max actual kcal, with a floor
  const maxActual = Math.max(...days.map((d) => d.total_kcal));
  const targetUpper = targetKcal ? targetKcal * 1.3 : 0;
  const maxKcal = Math.max(maxActual, targetUpper, 500);

  const targetPct = targetKcal ? (targetKcal / maxKcal) * 100 : 0;

  return (
    <div>
      <div className="relative">
        {/* Target line overlay */}
        {targetKcal && targetPct > 5 && targetPct < 95 && (
          <div
            className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{ bottom: `${targetPct}%` }}
          >
            <div className="border-t border-dashed border-brand-500/60" />
            <span className="absolute right-0 -top-3.5 text-[9px] font-bold text-brand-600 dark:text-brand-400 tabular-nums bg-surface px-1 rounded">
              {fmtNum(targetKcal)}
            </span>
          </div>
        )}

        {/* Bars */}
        <div className="grid grid-cols-7 gap-1.5 h-28 items-end">
          {days.map((d) => {
            const heightPct = Math.max((d.total_kcal / maxKcal) * 100, 2);
            const isActive = activeDate === d.date;
            const isEmpty = d.entry_count === 0;
            let barColor = "bg-text-muted/15";
            if (!isEmpty) {
              if (targetKcal && targetKcal > 0) {
                const pct = d.total_kcal / targetKcal;
                if (pct < 0.7) barColor = "bg-amber-300 dark:bg-amber-500/60";
                else if (pct < 0.9)
                  barColor = "bg-brand-300 dark:bg-brand-500/60";
                else if (pct <= 1.1)
                  barColor = "bg-brand-500 dark:bg-brand-500";
                else if (pct <= 1.3)
                  barColor = "bg-amber-500 dark:bg-amber-500";
                else barColor = "bg-rose-500 dark:bg-rose-500";
              } else {
                barColor = "bg-brand-500";
              }
            }
            return (
              <button
                key={d.date}
                onClick={() => onSelectDay?.(d.date)}
                className="flex flex-col items-center justify-end h-full group"
                title={`${new Date(d.date).toLocaleDateString("id-ID", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })} · ${isEmpty ? "kosong" : `${fmtNum(d.total_kcal)} kcal`}`}
              >
                <div
                  className={cn(
                    "w-full rounded-t-md transition-all",
                    barColor,
                    isActive &&
                      "ring-2 ring-fg/50 ring-offset-1 ring-offset-bg",
                  )}
                  style={{ height: `${heightPct}%` }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1.5 mt-1.5">
        {days.map((d) => {
          const date = new Date(d.date);
          const weekday = date.getDay();
          const isActive = activeDate === d.date;
          return (
            <div key={d.date} className="text-center">
              <div
                className={cn(
                  "text-[10px] font-semibold tabular-nums",
                  isActive ? "text-fg" : "text-text-muted",
                )}
              >
                {DAY_LABELS_ID[weekday]}
              </div>
              <div
                className={cn(
                  "text-[9px] tabular-nums",
                  isActive ? "text-fg font-bold" : "text-text-muted",
                )}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
