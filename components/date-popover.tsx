"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** Selected date in YYYY-MM-DD (local). */
  value: string;
  /** Max selectable date in YYYY-MM-DD (inclusive). Defaults to today. */
  max?: string;
  /** Min selectable date in YYYY-MM-DD (inclusive). Optional. */
  min?: string;
  /** Called when user picks a date. */
  onChange: (date: string) => void;
  /** Trigger content (renders inside the button that opens the popover). */
  children: React.ReactNode;
  /** Extra classes for the trigger button. */
  className?: string;
  /** Highlight specific dates with a dot indicator (e.g., dates with entries). */
  highlightedDates?: Set<string>;
}

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_LABELS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isoOf(year: number, month0: number, day: number): string {
  return `${year}-${pad2(month0 + 1)}-${pad2(day)}`;
}

function parseISO(iso: string): { y: number; m: number; d: number } {
  const parts = iso.split("-").map(Number);
  return {
    y: parts[0] ?? new Date().getFullYear(),
    m: (parts[1] ?? 1) - 1,
    d: parts[2] ?? 1,
  };
}

function todayISO(): string {
  const d = new Date();
  return isoOf(d.getFullYear(), d.getMonth(), d.getDate());
}

export function DatePopover({
  value,
  max,
  min,
  onChange,
  children,
  className,
  highlightedDates,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const today = todayISO();
  const effectiveMax = max ?? today;

  const valueParsed = useMemo(() => parseISO(value || today), [value, today]);
  const maxParsed = useMemo(() => parseISO(effectiveMax), [effectiveMax]);

  const [viewYear, setViewYear] = useState(valueParsed.y);
  const [viewMonth, setViewMonth] = useState(valueParsed.m);

  // Re-sync view when popover opens or selected value changes externally
  useEffect(() => {
    if (open) {
      setViewYear(valueParsed.y);
      setViewMonth(valueParsed.m);
    }
  }, [open, valueParsed.y, valueParsed.m]);

  // Close on outside click + Escape
  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const prevMonth = () => {
    let m = viewMonth - 1;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const nextMonth = () => {
    let m = viewMonth + 1;
    let y = viewYear;
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  // Disable next month if entire next month is beyond max
  const nextDisabled =
    viewYear > maxParsed.y ||
    (viewYear === maxParsed.y && viewMonth >= maxParsed.m);

  // Build day cells
  const cells = useMemo(() => {
    const startDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const arr: ({ day: number; iso: string } | null)[] = [];
    for (let i = 0; i < startDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ day: d, iso: isoOf(viewYear, viewMonth, d) });
    }
    while (arr.length < 42) arr.push(null);
    return arr;
  }, [viewYear, viewMonth]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "text-center rounded-lg px-2 py-1 hover:bg-surface-muted transition-colors",
          className,
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Pilih tanggal"
      >
        {children}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Pilih tanggal"
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-[18rem] bg-surface rounded-2xl shadow-2xl border border-border p-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg hover:bg-surface-muted flex items-center justify-center"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-bold tracking-tight">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              disabled={nextDisabled}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                nextDisabled
                  ? "text-text-muted/40 cursor-not-allowed"
                  : "hover:bg-surface-muted",
              )}
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold text-text-muted py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((c, i) => {
              if (!c) return <div key={`empty-${i}`} className="h-9" />;
              const isToday = c.iso === today;
              const isSelected = c.iso === value;
              const isAfterMax = c.iso > effectiveMax;
              const isBeforeMin = min ? c.iso < min : false;
              const isDisabled = isAfterMax || isBeforeMin;
              const hasEntry = highlightedDates?.has(c.iso) ?? false;
              return (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => {
                    if (isDisabled) return;
                    onChange(c.iso);
                    setOpen(false);
                  }}
                  disabled={isDisabled}
                  className={cn(
                    "relative h-9 rounded-lg text-sm font-medium tabular-nums transition-colors flex items-center justify-center",
                    isDisabled
                      ? "text-text-muted/30 cursor-not-allowed"
                      : isSelected
                        ? "bg-brand-600 text-white font-bold shadow-sm"
                        : isToday
                          ? "bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 font-bold ring-1 ring-inset ring-brand-300 dark:ring-brand-500/40 hover:bg-brand-100 dark:hover:bg-brand-500/25"
                          : "hover:bg-surface-muted",
                  )}
                  aria-label={c.iso}
                  aria-current={isSelected ? "date" : undefined}
                >
                  {c.day}
                  {hasEntry && !isSelected && (
                    <span
                      className={cn(
                        "absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                        isToday ? "bg-brand-600" : "bg-brand-400",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-2 pt-2 border-t border-border flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onChange(today);
                setOpen(false);
              }}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Hari ini
            </button>
            {highlightedDates && highlightedDates.size > 0 && (
              <div className="text-[10px] text-text-muted inline-flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-brand-400 inline-block" />
                ada catatan
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
