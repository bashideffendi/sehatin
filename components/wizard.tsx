"use client";
import { type ReactNode } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui";

// =============================================
// Wizard split-screen shell — design chrome only
// Desktop: dark forest left (logo + generic copy + progress) + white right (children)
// Mobile: thin top bar with logo + progress, children below
// =============================================
export function WizardShell({
  current,
  total,
  onBack,
  onSkip,
  cta,
  wide,
  children,
}: {
  current: number;
  total: number;
  onBack?: () => void;
  onSkip?: () => void;
  /**
   * Optional sticky bottom CTA bar (typically a Lanjut button). When provided,
   * renders at the bottom of the right panel, always visible regardless of
   * scroll position. Pass a `<WizardCta />` or any button-like ReactNode.
   */
  cta?: ReactNode;
  /**
   * When true, expands the content area max-width from `max-w-2xl` (672px) to
   * `max-w-5xl` (1024px). Use for content-heavy steps like result/summary
   * that benefit from 2-column layouts on wide screens. Default: false.
   */
  wide?: boolean;
  children: ReactNode;
}) {
  const pct = Math.min(100, Math.max(0, (current / total) * 100));
  const stepLabel = `Step ${String(current).padStart(2, "0")} dari ${String(total).padStart(2, "0")}`;
  const estTimeSec = Math.max(15, Math.round((total - current) * 5));
  return (
    <div className="min-h-screen md:flex bg-paper">
      {/* ===== LEFT — Dark forest panel ===== */}
      <aside className="hidden md:flex md:w-[42%] lg:w-[40%] xl:w-[38%] bg-forest text-paper p-10 lg:p-14 flex-col justify-between relative overflow-hidden min-h-screen">
        {/* Decorative orb */}
        <span
          className="absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-25 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(217,124,79,0.6) 0%, transparent 70%)",
          }}
        />
        <span
          className="absolute bottom-20 -left-20 w-72 h-72 rounded-full opacity-15 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(245,206,90,0.6) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Logo light />
        </div>

        {/* Headline + caption (generic for now — could be made step-specific) */}
        <div className="relative z-10">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-paper/55 mb-3">
            {stepLabel}
          </div>
          <h1 className="text-[40px] lg:text-[50px] font-extrabold tracking-tight leading-[1.05]">
            Cerita dikit
            <br />
            <span
              className="italic text-sun font-normal"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              tentang kamu.
            </span>
          </h1>
          <p className="mt-5 text-paper/70 max-w-[28ch] leading-relaxed text-[14px]">
            Data ini cuma buat hitung kebutuhan kalori dan macro. Tersimpan di
            device kamu, gak kemana-mana.
          </p>
        </div>

        {/* Bottom: progress bar + ETA */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex-1 flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < current ? "bg-sun" : "bg-paper/15",
                )}
              />
            ))}
          </div>
          <span className="text-[10.5px] text-paper/55 tabular flex-shrink-0">
            ~ {estTimeSec} detik lagi
          </span>
        </div>
      </aside>

      {/* ===== RIGHT — White content panel ===== */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 bg-paper z-10 border-b border-hairline">
          <div className="text-center pt-3 pb-2 px-4">
            <div className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted">
              Onboarding · Quiz{" "}
              <span
                className="italic text-clay font-normal"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                60 detik.
              </span>
            </div>
          </div>
          <div className="h-1 bg-surface-2">
            <div
              className="h-full bg-forest transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <button
              onClick={onBack}
              disabled={!onBack}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[12px] font-semibold",
                onBack ? "text-ink hover:bg-surface-2" : "text-muted/40 cursor-not-allowed",
              )}
              aria-label="Kembali"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <Logo size="sm" />
            <button
              onClick={onSkip}
              className="text-[11px] font-semibold text-muted hover:text-ink px-2"
            >
              Skip
            </button>
          </div>
          <div className="px-4 pb-2 flex items-baseline justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Langkah {String(current).padStart(2, "0")} dari{" "}
              {String(total).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-muted tabular">
              ~ {estTimeSec} detik
            </span>
          </div>
        </div>

        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between px-10 lg:px-14 pt-6 pb-3">
          <button
            onClick={onBack}
            disabled={!onBack}
            className={cn(
              "inline-flex items-center gap-1.5 text-[12.5px] font-semibold",
              onBack ? "text-forest hover:text-forest-700" : "text-muted/40 cursor-not-allowed",
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>
          <button
            onClick={onSkip}
            className="text-[12px] font-semibold text-muted hover:text-ink"
          >
            Skip langkah
          </button>
        </div>

        {/* Content — centered horizontally within the right panel */}
        <div
          className={cn(
            "flex-1 px-4 md:px-10 lg:px-14 py-4 md:py-6 w-full mx-auto",
            wide ? "max-w-5xl" : "max-w-2xl",
          )}
        >
          {children}
        </div>

        {/* Sticky bottom CTA bar (visible regardless of scroll) */}
        {cta && (
          <div className="sticky bottom-0 z-20 bg-paper/95 backdrop-blur-sm border-t border-hairline px-4 md:px-10 lg:px-14 py-3 md:py-4">
            <div
              className={cn(
                "w-full mx-auto",
                wide ? "max-w-5xl" : "max-w-2xl",
              )}
            >
              {cta}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// =============================================
// Progress bar — thin fill (kept for backward compat)
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
    <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden">
      <div
        className="h-full bg-forest rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// =============================================
// Mascot bubble — kept for compat
// =============================================
export function MascotBubble({
  message,
  emoji = "🦝",
}: {
  message: ReactNode;
  emoji?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-forest text-paper flex items-center justify-center text-2xl shadow-md">
        {emoji}
      </div>
      <div className="flex-1 px-5 py-4 rounded-2xl bg-surface shadow-[var(--shadow-paper-1)] border border-hairline">
        <h2 className="text-xl font-bold tracking-tight leading-tight">
          {message}
        </h2>
      </div>
    </div>
  );
}

// =============================================
// Big mascot scene — kept for compat
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
    <div className="relative py-12 text-center">
      <span className="absolute top-4 left-8 text-2xl opacity-70 animate-pulse text-sun">
        ✦
      </span>
      <span className="absolute top-20 right-12 text-xl opacity-60 animate-pulse [animation-delay:0.5s] text-clay">
        ✦
      </span>
      <span className="absolute bottom-12 left-16 text-lg opacity-50 animate-pulse [animation-delay:1s] text-forest">
        ✨
      </span>

      <div className="inline-block px-5 py-3 rounded-2xl bg-surface border border-hairline shadow-[var(--shadow-paper-1)] mb-6">
        <p className="text-xl font-bold tracking-tight">{message}</p>
      </div>
      <div className="text-8xl mb-2 select-none animate-bounce [animation-duration:3s]">
        {emoji}
      </div>
      {caption && (
        <p className="mt-4 text-muted text-sm max-w-xs mx-auto">{caption}</p>
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
        "w-full flex items-center gap-4 px-4 py-3.5 rounded-[14px] bg-surface border-2 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-paper-1)]",
        selected
          ? "border-forest bg-forest-50/40"
          : "border-hairline hover:border-hairline-2",
      )}
    >
      <span className="text-2xl flex-shrink-0 select-none">{emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-bold tracking-tight text-[14px]">
          {label}
        </span>
        {sublabel && (
          <span className="block text-[11.5px] text-muted">{sublabel}</span>
        )}
      </span>
      <span
        className={cn(
          "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
          selected
            ? "bg-forest text-paper"
            : "border-2 border-hairline-2 bg-transparent",
        )}
      >
        {selected && <Check className="w-3 h-3" />}
      </span>
    </button>
  );
}

// =============================================
// Top bar — kept for compat (now used inside WizardShell on mobile)
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
    <div className="sticky top-0 z-10 bg-paper border-b border-hairline">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          disabled={!onBack}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            onBack
              ? "hover:bg-surface-2 text-ink"
              : "text-muted/40 cursor-not-allowed",
          )}
          aria-label="Kembali"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <WizardProgress current={current} total={total} />
        </div>
        <span className="text-xs tabular text-muted font-medium">
          {current}/{total}
        </span>
      </div>
    </div>
  );
}

// =============================================
// Bottom CTA button
// `compact` strips the outer mt-8 pb-6 pt-4 padding — use when rendered
// inside the WizardShell sticky CTA bar (which provides its own padding).
// =============================================
export function WizardCta({
  label = "Lanjut",
  onClick,
  disabled,
  compact,
}: {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "mt-8 pb-6 pt-4"}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold tracking-tight text-[14px] transition-all",
          disabled
            ? "bg-surface-2 text-muted cursor-not-allowed"
            : "bg-forest text-paper shadow-[var(--shadow-forest)] hover:-translate-y-0.5",
        )}
      >
        {label}
        <span className="inline-block">→</span>
      </button>
      {!compact && (
        <p className="mt-3 text-[10.5px] text-muted">
          Tekan <kbd className="px-1.5 py-0.5 rounded bg-surface-2 text-[9.5px] font-bold border border-hairline">Enter</kbd> untuk lanjut
        </p>
      )}
    </div>
  );
}

// =============================================
// Likert scale 1-5
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
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight leading-snug">
          &quot;{statement}&quot;
        </h2>
        <p className="mt-3 text-muted text-[13px]">{prompt}</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n as 1 | 2 | 3 | 4 | 5)}
            className={cn(
              "aspect-square rounded-2xl border-2 font-bold text-lg tabular transition-all",
              "hover:border-forest hover:-translate-y-0.5",
              value === n
                ? "border-forest bg-forest text-paper shadow-[var(--shadow-forest)] scale-105"
                : "border-hairline bg-surface text-ink",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-muted px-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

// =============================================
// Body silhouette card
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
        "w-full flex items-center gap-5 p-5 rounded-2xl bg-surface border-2 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-paper-1)]",
        selected
          ? "border-forest bg-forest-50/40"
          : "border-hairline hover:border-hairline-2",
      )}
    >
      <div
        className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0",
          selected ? "bg-forest-50" : "bg-surface-2",
        )}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-lg font-bold tracking-tight">{label}</div>
        <p className="text-[12.5px] text-muted leading-snug mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

// =============================================
// Stat row
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
    warning: "text-sun-700",
    success: "text-forest",
  };
  return (
    <div className="flex items-center gap-3 py-2">
      {icon && (
        <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center text-lg flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted">{label}</div>
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
// Number input — large serif numeric input
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
        className="w-full px-5 py-4 pr-16 rounded-[14px] border border-hairline-2 bg-surface focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/15 tabular tracking-tight"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 32,
        }}
      />
      {suffix && (
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted font-semibold text-[12px]">
          {suffix}
        </span>
      )}
    </div>
  );
}
