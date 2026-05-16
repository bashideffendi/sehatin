"use client";
import { type ReactNode } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================
// Progress bar — thin dark fill at top
// =============================================
export function WizardProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <div className="w-full max-w-md mx-auto h-1.5 rounded-full bg-surface-muted overflow-hidden">
      <div
        className="h-full bg-fg rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// =============================================
// Mascot — circular avatar with emoji + speech bubble
// =============================================
export function MascotBubble({
  message,
  emoji = "🦝",
}: {
  message: ReactNode;
  emoji?: string;
}) {
  return (
    <div className="flex items-start gap-3 max-w-md mx-auto">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-2xl shadow-md ring-2 ring-white dark:ring-surface">
        {emoji}
      </div>
      <div className="flex-1 px-5 py-4 rounded-2xl bg-surface shadow-md border border-border">
        <h2 className="text-xl font-bold tracking-tight leading-tight">
          {message}
        </h2>
      </div>
    </div>
  );
}

// =============================================
// Big mascot scene — full avatar with floating decorations
// Used for welcome screens, milestone moments
// =============================================
export function MascotScene({
  message,
  caption,
  emoji = "🦝",
}: {
  message: string;
  caption?: string;
  emoji?: string;
}) {
  return (
    <div className="relative max-w-md mx-auto py-12 text-center">
      {/* Floating decorations */}
      <span className="absolute top-4 left-8 text-2xl opacity-70 animate-pulse">
        ✦
      </span>
      <span className="absolute top-20 right-12 text-xl opacity-60 animate-pulse [animation-delay:0.5s]">
        ✦
      </span>
      <span className="absolute bottom-12 left-16 text-lg opacity-50 animate-pulse [animation-delay:1s]">
        ✨
      </span>

      <div className="inline-block px-5 py-3 rounded-2xl bg-surface border border-border shadow-md mb-6">
        <p className="text-xl font-bold tracking-tight">{message}</p>
      </div>
      <div className="text-8xl mb-2 select-none animate-bounce [animation-duration:3s]">
        {emoji}
      </div>
      {caption && (
        <p className="mt-4 text-text-muted text-sm max-w-xs mx-auto">
          {caption}
        </p>
      )}
    </div>
  );
}

// =============================================
// Option card — big tappable card with icon + label
// =============================================
export function OptionCard({
  emoji,
  label,
  sublabel,
  selected,
  onClick,
}: {
  emoji: string;
  label: string;
  sublabel?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full max-w-md mx-auto flex items-center gap-4 px-5 py-4 rounded-2xl bg-surface border-2 text-left transition-all",
        "hover:border-brand-300 hover:-translate-y-0.5 hover:shadow-md",
        selected
          ? "border-brand-500 ring-2 ring-brand-500/20"
          : "border-border",
      )}
    >
      <span className="text-3xl flex-shrink-0 select-none">{emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold tracking-tight">{label}</span>
        {sublabel && (
          <span className="block text-sm text-text-muted">{sublabel}</span>
        )}
      </span>
      <span
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
          selected
            ? "border-brand-500 bg-brand-500"
            : "border-border bg-transparent",
        )}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </span>
    </button>
  );
}

// =============================================
// Top bar with back button
// =============================================
export function WizardTopBar({
  onBack,
  current,
  total,
}: {
  onBack?: () => void;
  current: number;
  total: number;
}) {
  return (
    <div className="sticky top-0 z-10 backdrop-blur-md bg-bg/80 border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          disabled={!onBack}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            onBack
              ? "hover:bg-surface-muted text-fg"
              : "text-text-muted/40 cursor-not-allowed",
          )}
          aria-label="Kembali"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <WizardProgress current={current} total={total} />
        </div>
        <span className="text-xs tabular-nums text-text-muted font-medium">
          {current}/{total}
        </span>
      </div>
    </div>
  );
}

// =============================================
// Bottom CTA button
// =============================================
export function WizardCta({
  label = "Lanjut",
  onClick,
  disabled,
}: {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="sticky bottom-0 mt-8 pb-6 pt-4 bg-gradient-to-t from-bg via-bg to-transparent">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "w-full max-w-md mx-auto block px-6 py-4 rounded-2xl font-semibold tracking-tight text-base transition-all",
          disabled
            ? "bg-surface-muted text-text-muted cursor-not-allowed"
            : "bg-fg text-bg shadow-lg hover:-translate-y-0.5 hover:shadow-xl",
        )}
      >
        {label}
      </button>
    </div>
  );
}

// =============================================
// Likert scale 1-5 (statement + scale buttons)
// Pattern: bitepal eating psychology questions
// =============================================
export function LikertScale({
  statement,
  prompt = "Sejauh mana statement ini menggambarkan kamu?",
  value,
  onChange,
  leftLabel = "Tidak sama sekali",
  rightLabel = "Sangat",
}: {
  statement: string;
  prompt?: string;
  value?: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  leftLabel?: string;
  rightLabel?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold tracking-tight leading-snug">
          &quot;{statement}&quot;
        </h2>
        <p className="mt-3 text-text-muted">{prompt}</p>
      </div>
      <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n as 1 | 2 | 3 | 4 | 5)}
            className={cn(
              "aspect-square rounded-2xl border-2 font-bold text-lg tabular-nums transition-all",
              "hover:border-brand-400 hover:-translate-y-0.5",
              value === n
                ? "border-brand-500 bg-brand-500 text-white shadow-md scale-105"
                : "border-border bg-surface text-fg",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-text-muted max-w-md mx-auto px-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

// =============================================
// Body silhouette card (visual self-classification)
// Bitepal uses photos; we use emoji + description for MVP
// =============================================
export function BodyTypeCard({
  emoji,
  label,
  desc,
  selected,
  onClick,
}: {
  emoji: string;
  label: string;
  desc: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full max-w-md mx-auto flex items-center gap-5 p-5 rounded-2xl bg-surface border-2 text-left transition-all",
        "hover:border-brand-300 hover:-translate-y-0.5 hover:shadow-md",
        selected
          ? "border-brand-500 ring-2 ring-brand-500/20"
          : "border-border",
      )}
    >
      <div
        className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0",
          selected ? "bg-brand-100 dark:bg-brand-500/15" : "bg-surface-muted",
        )}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-lg font-bold tracking-tight">{label}</div>
        <p className="text-sm text-text-muted leading-snug mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

// =============================================
// Stat row — for personal summary card
// =============================================
export function StatRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  highlight?: "warning" | "success";
}) {
  const colorMap = {
    warning: "text-amber-600",
    success: "text-brand-600",
  };
  return (
    <div className="flex items-center gap-3 py-2">
      {icon && (
        <div className="w-9 h-9 rounded-xl bg-surface-muted flex items-center justify-center text-lg flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-text-muted">{label}</div>
        <div
          className={cn(
            "font-semibold tracking-tight",
            highlight && colorMap[highlight],
          )}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// =============================================
// Number input with stepper + suffix
// =============================================
export function NumberInput({
  value,
  onChange,
  suffix,
  min,
  max,
  step = 1,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        inputMode="decimal"
        className="w-full px-5 py-4 pr-16 rounded-2xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-2xl font-bold tabular-nums tracking-tight"
      />
      {suffix && (
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted font-semibold">
          {suffix}
        </span>
      )}
    </div>
  );
}
