import * as React from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  /** SVG width in px (intrinsic; container can scale via className) */
  width?: number;
  /** SVG height in px */
  height?: number;
  /** Stroke color CSS — defaults to forest */
  color?: string;
  /** Stroke width in px */
  strokeWidth?: number;
  /** Show area fill (10% opacity below the line) */
  fill?: boolean;
  /** Show end-point marker */
  endDot?: boolean;
  className?: string;
}

export function Sparkline({
  values,
  width = 200,
  height = 60,
  color = "var(--color-forest)",
  strokeWidth = 1.8,
  fill = true,
  endDot = true,
  className,
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={cn("w-full h-full", className)}
      />
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;
  const innerW = width - 2 * padding;
  const innerH = height - 2 * padding;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * innerW;
    const y = padding + innerH - ((v - min) / range) * innerH;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L${points[points.length - 1]!.x.toFixed(1)} ${
    height - padding
  } L${points[0]!.x.toFixed(1)} ${height - padding} Z`;

  const last = points[points.length - 1]!;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("w-full h-full", className)}
      role="img"
      aria-label={`Sparkline, ${values.length} points`}
    >
      {fill ? (
        <path d={areaPath} fill={color} fillOpacity="0.10" stroke="none" />
      ) : null}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {endDot ? (
        <>
          <circle
            cx={last.x}
            cy={last.y}
            r="3"
            fill="var(--color-surface)"
            stroke={color}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : null}
    </svg>
  );
}
