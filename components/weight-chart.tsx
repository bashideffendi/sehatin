"use client";
import { useState, useMemo } from "react";
import { TrendingDown, TrendingUp, Minus, Target, Plus } from "lucide-react";
import Link from "next/link";
import type { WeightLogEntry } from "@/lib/weight-log";
import { cn } from "@/lib/utils";

type Range = "7d" | "30d" | "all";

interface Props {
  history: WeightLogEntry[]; // chronological, oldest -> newest
  targetWeight?: number;
  goodDirection?: "down_is_good" | "up_is_good" | "neutral";
}

const RANGE_LABEL: Record<Range, string> = {
  "7d": "7 hari",
  "30d": "30 hari",
  all: "Semua",
};

const RANGE_DAYS: Record<Range, number | null> = {
  "7d": 7,
  "30d": 30,
  all: null,
};

function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function WeightChart({
  history,
  targetWeight,
  goodDirection = "neutral",
}: Props) {
  const [range, setRange] = useState<Range>("30d");

  const filtered = useMemo(() => {
    if (history.length === 0) return [];
    const days = RANGE_DAYS[range];
    if (days === null) return history;
    const cutoff = shiftISO(todayISO(), -days);
    return history.filter((h) => h.date >= cutoff);
  }, [history, range]);

  // Empty state
  if (history.length === 0) {
    return (
      <div className="mb-4 p-5 sm:p-6 rounded-2xl bg-surface border border-border text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-300 items-center justify-center mb-3">
          <TrendingDown className="w-6 h-6" />
        </div>
        <div className="font-bold tracking-tight">Belum ada catatan berat</div>
        <p className="mt-1 text-sm text-text-muted">
          Catat berat pertama buat lihat tren progres.
        </p>
        <Link
          href="/log"
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-fg text-bg text-sm font-semibold hover:-translate-y-0.5 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" /> Catat berat sekarang
        </Link>
      </div>
    );
  }

  // Not enough in range — fall back to wider range
  let effectiveRange = range;
  let effectiveFiltered = filtered;
  if (filtered.length < 2 && history.length >= 2) {
    effectiveRange = "all";
    effectiveFiltered = history;
  }

  const latest = effectiveFiltered[effectiveFiltered.length - 1];
  const first = effectiveFiltered[0];

  if (!latest || !first) {
    return null;
  }

  return (
    <div className="mb-4 p-4 sm:p-5 rounded-2xl bg-surface border border-border">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            Berat badan
          </div>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums">
              {latest.weight_kg}
            </span>
            <span className="text-sm text-text-muted">kg</span>
            <DeltaBadge
              first={first.weight_kg}
              last={latest.weight_kg}
              goodDirection={goodDirection}
            />
          </div>
          {targetWeight && (
            <div className="mt-1 text-[11px] text-text-muted inline-flex items-center gap-1 tabular-nums">
              <Target className="w-3 h-3" /> target {targetWeight} kg ·{" "}
              {Math.abs(latest.weight_kg - targetWeight).toFixed(1)} kg lagi
            </div>
          )}
        </div>
        <RangeTabs
          value={effectiveRange}
          onChange={setRange}
          counts={{
            "7d": history.filter(
              (h) => h.date >= shiftISO(todayISO(), -7),
            ).length,
            "30d": history.filter(
              (h) => h.date >= shiftISO(todayISO(), -30),
            ).length,
            all: history.length,
          }}
        />
      </div>

      {/* Chart */}
      <Chart
        data={effectiveFiltered}
        targetWeight={targetWeight}
        goodDirection={goodDirection}
      />

      {/* Footer: log new */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2 text-[11px] text-text-muted">
        <span className="tabular-nums">
          {effectiveFiltered.length} catatan · range{" "}
          {Math.min(...effectiveFiltered.map((h) => h.weight_kg)).toFixed(1)}-
          {Math.max(...effectiveFiltered.map((h) => h.weight_kg)).toFixed(1)} kg
        </span>
        <Link
          href="/log"
          className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700"
        >
          <Plus className="w-3 h-3" /> Catat baru
        </Link>
      </div>
    </div>
  );
}

function RangeTabs({
  value,
  onChange,
  counts,
}: {
  value: Range;
  onChange: (r: Range) => void;
  counts: Record<Range, number>;
}) {
  return (
    <div className="inline-flex p-0.5 bg-surface-muted rounded-lg flex-shrink-0">
      {(["7d", "30d", "all"] as const).map((r) => {
        const disabled = counts[r] < 2 && r !== "all";
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            disabled={disabled}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors",
              value === r
                ? "bg-surface text-fg shadow-sm"
                : disabled
                  ? "text-text-muted/40 cursor-not-allowed"
                  : "text-text-muted hover:text-fg",
            )}
            title={`${counts[r]} catatan`}
          >
            {RANGE_LABEL[r]}
          </button>
        );
      })}
    </div>
  );
}

function DeltaBadge({
  first,
  last,
  goodDirection,
}: {
  first: number;
  last: number;
  goodDirection: "down_is_good" | "up_is_good" | "neutral";
}) {
  const delta = Math.round((last - first) * 10) / 10;
  if (delta === 0) {
    return (
      <span className="text-xs text-text-muted inline-flex items-center gap-0.5 tabular-nums">
        <Minus className="w-3 h-3" /> 0 kg
      </span>
    );
  }
  const isUp = delta > 0;
  let isGood = false;
  if (goodDirection === "down_is_good") isGood = !isUp;
  else if (goodDirection === "up_is_good") isGood = isUp;
  const color =
    goodDirection === "neutral"
      ? "text-sky-600 dark:text-sky-400"
      : isGood
        ? "text-brand-600 dark:text-brand-400"
        : "text-rose-600 dark:text-rose-400";
  return (
    <span
      className={cn(
        "text-xs font-semibold inline-flex items-center gap-0.5 tabular-nums",
        color,
      )}
    >
      {isUp ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {isUp ? "+" : ""}
      {delta} kg
    </span>
  );
}

// ============ Chart SVG ============

function Chart({
  data,
  targetWeight,
  goodDirection,
}: {
  data: WeightLogEntry[];
  targetWeight?: number;
  goodDirection: "down_is_good" | "up_is_good" | "neutral";
}) {
  // Single point: render dot only
  if (data.length === 1) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-text-muted">
        Cuma 1 catatan — tambah lagi besok buat lihat tren.
      </div>
    );
  }

  const weights = data.map((d) => d.weight_kg);
  let yMin = Math.min(...weights);
  let yMax = Math.max(...weights);
  if (targetWeight) {
    yMin = Math.min(yMin, targetWeight);
    yMax = Math.max(yMax, targetWeight);
  }
  const yPadding = (yMax - yMin) * 0.2 || 0.5;
  yMin -= yPadding;
  yMax += yPadding;
  const yRange = yMax - yMin || 1;

  const width = 600;
  const height = 160;
  const padX = 8;
  const padTop = 14;
  const padBottom = 6;
  const chartH = height - padTop - padBottom;
  const chartW = width - 2 * padX;

  const firstT = new Date(data[0]!.date).getTime();
  const lastT = new Date(data[data.length - 1]!.date).getTime();
  const tSpan = lastT - firstT || 1;

  const points = data.map((h) => {
    const t = new Date(h.date).getTime();
    const x = padX + ((t - firstT) / tSpan) * chartW;
    const y = padTop + ((yMax - h.weight_kg) / yRange) * chartH;
    return { x, y, date: h.date, weight: h.weight_kg };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L${points[points.length - 1]!.x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L${points[0]!.x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`;

  const targetY = targetWeight
    ? padTop + ((yMax - targetWeight) / yRange) * chartH
    : null;

  const delta = points[points.length - 1]!.weight - points[0]!.weight;
  let strokeColor = "stroke-sky-500";
  let fillColor = "fill-sky-500/12";
  let dotColor = "fill-sky-500";
  if (delta !== 0 && goodDirection !== "neutral") {
    const isGood =
      (goodDirection === "down_is_good" && delta < 0) ||
      (goodDirection === "up_is_good" && delta > 0);
    if (isGood) {
      strokeColor = "stroke-brand-500";
      fillColor = "fill-brand-500/15";
      dotColor = "fill-brand-500";
    } else {
      strokeColor = "stroke-rose-500";
      fillColor = "fill-rose-500/12";
      dotColor = "fill-rose-500";
    }
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-40"
        role="img"
        aria-label={`Grafik berat badan ${data.length} titik`}
      >
        {/* Grid: horizontal mid line */}
        <line
          x1={padX}
          y1={padTop + chartH / 2}
          x2={width - padX}
          y2={padTop + chartH / 2}
          className="stroke-border"
          strokeWidth="0.5"
          strokeDasharray="2 4"
          vectorEffect="non-scaling-stroke"
        />

        {/* Target line */}
        {targetY !== null && (
          <>
            <line
              x1={padX}
              y1={targetY}
              x2={width - padX}
              y2={targetY}
              strokeDasharray="4 3"
              className="stroke-amber-500/70"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={width - padX - 2}
              y={targetY - 3}
              className="fill-amber-600 dark:fill-amber-400"
              fontSize="9"
              textAnchor="end"
              fontWeight="700"
            >
              🎯 {targetWeight}
            </text>
          </>
        )}

        {/* Area fill */}
        <path d={areaPath} className={cn("transition-colors", fillColor)} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("transition-colors", strokeColor)}
          vectorEffect="non-scaling-stroke"
        />

        {/* Points: all small, last bigger */}
        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isLast ? "3.5" : "2"}
                className={cn(dotColor, "transition-colors")}
              />
              {isLast && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  className={cn(dotColor, "opacity-25")}
                />
              )}
            </g>
          );
        })}

        {/* Y-axis labels (min/max) */}
        <text
          x={padX + 2}
          y={padTop + 3}
          className="fill-text-muted"
          fontSize="8"
          textAnchor="start"
          dominantBaseline="hanging"
        >
          {yMax.toFixed(1)}
        </text>
        <text
          x={padX + 2}
          y={padTop + chartH - 1}
          className="fill-text-muted"
          fontSize="8"
          textAnchor="start"
          dominantBaseline="auto"
        >
          {yMin.toFixed(1)}
        </text>
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between text-[9px] text-text-muted tabular-nums px-1 -mt-1">
        <span>{shortDate(data[0]!.date)}</span>
        {data.length > 4 && (
          <span>{shortDate(data[Math.floor(data.length / 2)]!.date)}</span>
        )}
        <span>{shortDate(data[data.length - 1]!.date)}</span>
      </div>
    </div>
  );
}

function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}
