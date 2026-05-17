import * as React from "react";
import { cn } from "@/lib/utils";

export type BtnVariant = "primary" | "clay" | "ink" | "ghost" | "surface";
export type BtnSize = "xs" | "sm" | "md" | "lg";

interface BaseBtnProps {
  variant?: BtnVariant;
  size?: BtnSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
  className?: string;
}

type BtnProps = BaseBtnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseBtnProps>;

const VARIANTS: Record<BtnVariant, string> = {
  primary:
    "bg-forest text-paper border border-forest hover:bg-forest-700 shadow-[var(--shadow-forest)]",
  clay: "bg-clay text-paper border border-clay hover:bg-clay-700",
  ink: "bg-ink text-paper border border-ink hover:bg-ink/90",
  ghost: "bg-transparent text-ink border border-hairline-2 hover:bg-surface-2",
  surface:
    "bg-surface text-ink border border-hairline hover:bg-surface-2 hover:border-hairline-2",
};

const SIZES: Record<BtnSize, string> = {
  xs: "h-7 px-3 text-[11.5px] gap-1.5 [&_svg]:w-3 [&_svg]:h-3",
  sm: "h-8 px-3.5 text-[12.5px] gap-1.5 [&_svg]:w-3.5 [&_svg]:h-3.5",
  md: "h-10 px-4 text-sm gap-2 [&_svg]:w-4 [&_svg]:h-4",
  lg: "h-12 px-5 text-base gap-2 [&_svg]:w-4 [&_svg]:h-4",
};

export const Btn = React.forwardRef<HTMLButtonElement, BtnProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      iconRight,
      loading,
      fullWidth,
      children,
      className,
      disabled,
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-full font-semibold leading-none whitespace-nowrap transition-all duration-150",
          "hover:-translate-y-px active:translate-y-0",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
          VARIANTS[variant],
          SIZES[size],
          fullWidth && "w-full",
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-r-transparent animate-spin" />
        ) : icon ? (
          <span className="flex items-center">{icon}</span>
        ) : null}
        {children}
        {iconRight && !loading ? (
          <span className="flex items-center">{iconRight}</span>
        ) : null}
      </button>
    );
  },
);
Btn.displayName = "Btn";
