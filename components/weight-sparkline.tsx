"use client";
import type { WeightSparkData } from "@/lib/insights";
import { cn } from "@/lib/utils";

interface Props {
  data: WeightSparkData;
  /** Direction interpretation: "down_is_good" (fat loss) or "up_is_good" (muscle gain). */
  goodDirection?: "down_is_good" | "up_is_good" | "neutral";
  className?: string;
}

export function WeightSparkline({
  data,
  goodDirection = "neutral",
  className,
}: Props) {
  const { points, min, max, delta } = data;
  if (points.length < 2) return null;

  const range = max - min || 1;
  const width = 100;
  const height = 32;
  const padding = 2;
  const lastIdx = points.length - 1;

  // Build smooth path
  const pathD = points
    .map((p, i) => {
      const x =
        (i / Math.max(lastIdx, 1)) * (width - 2 * padding) + padding;
      const y =
        height -
        padding -
        ((p.weight_kg - min) / range) * (height - 2 * padding);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  // Area fill (path closed at bottom)
  const lastX = width - padding;
  const firstX = padding;
  const areaD = `${pathD} L${lastX.toFixed(2)} ${(height - padding).toFixed(2)} L${firstX.toFixed(2)} ${(height - padding).toFixed(2)} Z`;

  // Last point coords for dot
  const lastPoint = points[lastIdx];
  const lastY = lastPoint
    ? height -
      padding -
      ((lastPoint.weight_kg - min) / range) * (height - 2 * padding)
    : 0;

  // Determine stroke color
  let strokeColor = "stroke-text-muted";
  let fillColor = "fill-text-muted/10";
  if (delta !== 0) {
    const isUp = delta > 0;
    let isGood = false;
    if (goodDirection === "down_is_good") isGood = !isUp;
    else if (goodDirection === "up_is_good") isGood = isUp;
    else isGood = false;
    if (goodDirection === "neutral") {
      strokeColor = "stroke-sky-500";
      fillColor = "fill-sky-500/10";
    } else if (isGood) {
      strokeColor = "stroke-brand-500";
      fillColor = "fill-brand-500/15";
    } else {
      strokeColor = "stroke-rose-500";
      fillColor = "fill-rose-500/10";
    }
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full h-8", className)}
      role="img"
      aria-label={`Tren berat badan, ${points.length} catatan, delta ${delta} kg`}
    >
      <path d={areaD} className={cn("transition-colors", fillColor)} />
      <path
        d={pathD}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("transition-colors", strokeColor)}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={lastX}
        cy={lastY}
        r="2"
        className={cn("transition-colors", strokeColor.replace("stroke-", "fill-"))}
      />
    </svg>
  );
}
