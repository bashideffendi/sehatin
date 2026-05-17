import * as React from "react";
import { cn } from "@/lib/utils";

export type CardSurface = "surface" | "surface-2" | "paper-deep" | "ink" | "forest";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  surface?: CardSurface;
  radius?: "sm" | "md" | "lg" | "xl";
  shadow?: "none" | "paper-1" | "paper-2" | "paper-3";
  lift?: boolean;
  asLink?: boolean;
  children: React.ReactNode;
}

const SURFACES: Record<CardSurface, string> = {
  surface: "bg-surface text-ink",
  "surface-2": "bg-surface-2 text-ink",
  "paper-deep": "bg-paper-deep text-ink",
  ink: "bg-ink text-paper",
  forest: "bg-forest text-paper",
};

const RADII = {
  sm: "rounded-[12px]",
  md: "rounded-[16px]",
  lg: "rounded-[22px]",
  xl: "rounded-[28px]",
} as const;

const SHADOWS = {
  none: "",
  "paper-1": "shadow-[var(--shadow-paper-1)]",
  "paper-2": "shadow-[var(--shadow-paper-2)]",
  "paper-3": "shadow-[var(--shadow-paper-3)]",
} as const;

export function Card({
  surface = "surface",
  radius = "lg",
  shadow = "paper-1",
  lift = false,
  children,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "border border-hairline",
        SURFACES[surface],
        RADII[radius],
        SHADOWS[shadow],
        lift && "lift",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface KickerProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "muted" | "ink" | "forest" | "clay" | "paper";
  children: React.ReactNode;
}

const KICKER_TONES = {
  muted: "text-muted",
  ink: "text-ink",
  forest: "text-forest",
  clay: "text-clay",
  paper: "text-paper/70",
} as const;

export function Kicker({
  tone = "muted",
  className,
  children,
  ...rest
}: KickerProps) {
  return (
    <div
      className={cn(
        "text-[10px] font-bold uppercase tracking-[0.12em]",
        KICKER_TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
