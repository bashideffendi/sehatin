import * as React from "react";
import { cn } from "@/lib/utils";

interface DonutProps {
  /** Current value */
  value: number;
  /** Target value (max) */
  target: number;
  /** Outer diameter in px */
  size?: number;
  /** Stroke width in px */
  stroke?: number;
  /** Progress color CSS — defaults to forest */
  color?: string;
  /** Track color CSS — defaults to forest-100 */
  track?: string;
  /** Render in center (label, number, etc) */
  children?: React.ReactNode;
  className?: string;
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

export function Donut({
  value,
  target,
  size = 200,
  stroke = 18,
  color = "var(--color-forest)",
  track = "var(--color-forest-100)",
  children,
  className,
  ariaLabel,
}: DonutProps) {
  const safeTarget = Math.max(target, 1);
  const pct = Math.max(0, Math.min(1.05, value / safeTarget));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={
        ariaLabel ?? `Progress ${Math.round(pct * 100)}% (${value} dari ${target})`
      }
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 400ms ease" }}
        />
      </svg>
      {children ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ pointerEvents: "none" }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
