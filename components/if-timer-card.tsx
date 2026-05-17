"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Pill } from "@/components/ui";
import { getDailySummary, todayISO } from "@/lib/food-log";

interface FastingState {
  mode: "fasting" | "eating";
  elapsedMin: number;
  protocolFastMin: number;
  protocolEatMin: number;
  eatingStartHHMM: string;
  fastingStartHHMM: string;
  phase: { label: string; tone: "sun" | "clay" | "forest" | "sky" };
}

// Compute current fasting/eating state from last meal in food_log
function computeFastingState(): FastingState {
  const PROTOCOL_FAST_MIN = 16 * 60;
  const PROTOCOL_EAT_MIN = 8 * 60;
  // Eating window assumed 14:00 - 22:00 (16:8 protocol)
  const EATING_START_HOUR = 14;
  const EATING_END_HOUR = 22;

  const now = new Date();
  const summary = getDailySummary(todayISO());
  // Find latest meal across today + yesterday
  let lastMealTs: number | null = null;
  if (summary) {
    for (const e of summary.entries) {
      const ts = new Date(e.created_at).getTime();
      if (!lastMealTs || ts > lastMealTs) lastMealTs = ts;
    }
  }
  // Also check yesterday in case nothing today yet
  if (!lastMealTs) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const ymd = yesterday.toISOString().slice(0, 10);
    const ySum = getDailySummary(ymd);
    if (ySum) {
      for (const e of ySum.entries) {
        const ts = new Date(e.created_at).getTime();
        if (!lastMealTs || ts > lastMealTs) lastMealTs = ts;
      }
    }
  }

  const currentHour = now.getHours();
  const inEatingWindow =
    currentHour >= EATING_START_HOUR && currentHour < EATING_END_HOUR;

  let mode: "fasting" | "eating" = inEatingWindow ? "eating" : "fasting";
  let elapsedMin: number;
  if (mode === "eating") {
    const eatingStart = new Date(now);
    eatingStart.setHours(EATING_START_HOUR, 0, 0, 0);
    elapsedMin = Math.max(0, Math.round((now.getTime() - eatingStart.getTime()) / 60000));
  } else {
    // Fasting: elapsed since eating window ended (22:00 yesterday or today)
    const eatingEnd = new Date(now);
    if (currentHour >= EATING_END_HOUR) {
      eatingEnd.setHours(EATING_END_HOUR, 0, 0, 0);
    } else {
      // currentHour < EATING_START_HOUR (early morning), fasting started 22:00 yesterday
      eatingEnd.setDate(eatingEnd.getDate() - 1);
      eatingEnd.setHours(EATING_END_HOUR, 0, 0, 0);
    }
    elapsedMin = Math.max(0, Math.round((now.getTime() - eatingEnd.getTime()) / 60000));
  }

  // If last meal exists and is more recent than computed start, use it
  if (lastMealTs && mode === "fasting") {
    const elapsedFromMeal = Math.round((now.getTime() - lastMealTs) / 60000);
    if (elapsedFromMeal > 0 && elapsedFromMeal < PROTOCOL_FAST_MIN) {
      elapsedMin = elapsedFromMeal;
    }
  }

  // Phase based on fasting hours
  const hours = elapsedMin / 60;
  let phase: FastingState["phase"];
  if (mode === "eating") {
    phase = { label: "Eating window", tone: "forest" };
  } else if (hours < 4) {
    phase = { label: "Anabolic", tone: "sky" };
  } else if (hours < 12) {
    phase = { label: "Glikogen", tone: "sky" };
  } else if (hours < 18) {
    phase = { label: "Ketosis ringan", tone: "sun" };
  } else if (hours < 24) {
    phase = { label: "Autofagi", tone: "clay" };
  } else {
    phase = { label: "Deep ketosis", tone: "clay" };
  }

  return {
    mode,
    elapsedMin,
    protocolFastMin: PROTOCOL_FAST_MIN,
    protocolEatMin: PROTOCOL_EAT_MIN,
    eatingStartHHMM: `${String(EATING_START_HOUR).padStart(2, "0")}:00`,
    fastingStartHHMM: `${String(EATING_END_HOUR).padStart(2, "0")}:00`,
    phase,
  };
}

function fmtHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function IfTimerCard({ ramadanActive }: { ramadanActive?: boolean }) {
  const [state, setState] = useState<FastingState | null>(null);

  useEffect(() => {
    setState(computeFastingState());
    // Re-compute every minute
    const interval = setInterval(() => {
      setState(computeFastingState());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!state) {
    return (
      <div className="bg-surface rounded-[28px] border border-hairline shadow-[var(--shadow-paper-1)] p-5 sm:p-6 h-full" />
    );
  }

  const totalMin = state.mode === "fasting" ? state.protocolFastMin : state.protocolEatMin;
  const pct = Math.min(1, state.elapsedMin / totalMin);
  const size = 110;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);
  const gradId = "if-card-grad";

  return (
    <div className="bg-surface rounded-[28px] border border-hairline shadow-[var(--shadow-paper-1)] p-5 sm:p-6 h-full relative overflow-hidden paper-grain">
      {/* Sun-clay decorative tint */}
      <span
        className="absolute -top-12 -right-12 w-44 h-44 rounded-full opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, var(--color-sun) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 flex items-start justify-between mb-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
          IF Timer · 16:8
        </div>
        <Pill tone={state.phase.tone} size="sm">
          {state.phase.label}
        </Pill>
      </div>

      <div className="relative z-10 flex items-center gap-4">
        {/* Donut */}
        <div
          className="relative flex-shrink-0"
          style={{ width: size, height: size }}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ transform: "rotate(-90deg)" }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--color-clay)" />
                <stop offset="100%" stopColor="var(--color-sun)" />
              </linearGradient>
            </defs>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--color-hairline-2)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-[9px] font-bold uppercase tracking-wider text-clay">
              {state.mode === "fasting" ? "Fasting" : "Eating"}
            </div>
            <div
              className="tabular mt-0.5 leading-none"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 24,
              }}
            >
              {fmtHHMM(state.elapsedMin)}
            </div>
            <div className="text-[8.5px] text-muted mt-0.5">
              dari {state.mode === "fasting" ? "16:00" : "08:00"}
            </div>
          </div>
        </div>

        {/* Right side: copy + button */}
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-muted leading-relaxed">
            {state.mode === "fasting" ? (
              <>
                Eating window dibuka jam{" "}
                <span className="font-bold text-ink tabular">
                  {state.eatingStartHHMM}
                </span>
                .
                {ramadanActive ? (
                  <>
                    {" "}Mode Ramadan otomatis aktif{" "}
                    <span className="font-semibold text-clay">15 Mar.</span>
                  </>
                ) : null}
              </>
            ) : (
              <>
                Window selesai jam{" "}
                <span className="font-bold text-ink tabular">
                  {state.fastingStartHHMM}
                </span>
                .
              </>
            )}
          </p>
          <Link
            href="/tools/if"
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-hairline-2 hover:border-forest hover:bg-forest-50 text-[11.5px] font-semibold transition-colors"
          >
            Adjust window
          </Link>
        </div>
      </div>
    </div>
  );
}
