import * as React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Size variant — adjusts both icon + wordmark */
  size?: "sm" | "md" | "lg";
  /** Hide wordmark and just show the icon (mobile compact, favicon, etc) */
  iconOnly?: boolean;
  /** Light variant for dark backgrounds — flips icon container to paper */
  light?: boolean;
  className?: string;
}

const SIZES = {
  sm: { icon: 28, wordmark: "text-base", iconRadius: 8 },
  md: { icon: 32, wordmark: "text-lg", iconRadius: 9 },
  lg: { icon: 44, wordmark: "text-2xl", iconRadius: 12 },
} as const;

/**
 * Sehatin wordmark — forest rounded square with leaf, plus "sehat" sans bold + "in" serif italic.
 */
export function Logo({ size = "md", iconOnly, light, className }: LogoProps) {
  const cfg = SIZES[size];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 align-middle",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center flex-shrink-0",
          light ? "bg-paper text-forest" : "bg-forest text-paper",
        )}
        style={{
          width: cfg.icon,
          height: cfg.icon,
          borderRadius: cfg.iconRadius,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: cfg.icon * 0.55, height: cfg.icon * 0.55 }}
        >
          {/* Leaf icon — simple stylized */}
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2c1 1.5 1 5.5-2.5 11-4 6-7.5 6-5.7 7" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6" />
        </svg>
      </span>
      {!iconOnly ? (
        <span
          className={cn(
            "font-extrabold tracking-tight leading-none",
            cfg.wordmark,
            light ? "text-paper" : "text-ink",
          )}
        >
          sehat
          <span
            className={cn(
              "font-normal italic font-serif",
              light ? "text-paper" : "text-forest",
            )}
            style={{ fontFamily: "var(--font-serif)" }}
          >
            in
          </span>
        </span>
      ) : null}
    </span>
  );
}
