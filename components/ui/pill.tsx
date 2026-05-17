import * as React from "react";
import { cn } from "@/lib/utils";

export type PillTone =
  | "default"
  | "forest"
  | "clay"
  | "sun"
  | "sky"
  | "rose"
  | "ink";

export type PillSize = "sm" | "md" | "lg";

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
  size?: PillSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const TONES: Record<PillTone, string> = {
  default: "bg-surface-2 text-ink-2 border border-hairline",
  forest: "bg-forest-50 text-forest border border-forest/20",
  clay: "bg-clay-50 text-clay border border-clay/20",
  sun: "bg-sun-50 text-sun-700 border border-sun/40",
  sky: "bg-sky-50 text-sky border border-sky/25",
  rose: "bg-rose-50 text-rose border border-rose/25",
  ink: "bg-ink text-paper border border-ink",
};

const SIZES: Record<PillSize, string> = {
  sm: "px-2 py-0.5 text-[10.5px] gap-1",
  md: "px-2.5 py-1 text-[11.5px] gap-1.5",
  lg: "px-3 py-1.5 text-xs gap-1.5",
};

export function Pill({
  tone = "default",
  size = "md",
  icon,
  children,
  className,
  ...rest
}: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold leading-none whitespace-nowrap",
        TONES[tone],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon ? <span className="flex items-center">{icon}</span> : null}
      {children}
    </span>
  );
}
