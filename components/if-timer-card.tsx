"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Pill } from "@/components/ui";
import { getDailySummary, todayISO } from "@/lib/food-log";

interface FastingState {
  mode: "fasting" | "eating" | "idle";
  elapsedMin: number;
  protocolFastMin: number;
  protocolEatMin: number;
  /** Time when eating window will OPEN next (HH:MM). For fasting mode. */
  nextEatingOpenHHMM: string | null;
  /** Time when eating window will CLOSE (HH:MM). For eating mode. */
  eatingCloseHHMM: string | null;
  /** Time of last meal (HH:MM) — for fasting context */
  lastMealHHMM: string | null;
  phase: { label: string; tone: "sun" | "clay" | "forest" | "sky" };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function tsToHHMM(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function todayLocalISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function yesterdayLocalISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Compute current fasting/eating state from actual food_log.
 *
 * Logic (16:8 protocol):
 * - "Eating window" opens with the FIRST meal of the day, lasts 8 hours.
 * - If now < first_meal + 8h → mode = "eating", elapsed = now - first_meal.
 * - Else → mode = "fasting", elapsed = now - last_meal (i.e. time since last bite).
 * - If no meals at all yet → mode = "idle", elapsed = 0.
 */
function computeFastingState(): FastingState {
  const PROTOCOL_FAST_MIN = 16 * 60;
  const PROTOCOL_EAT_MIN = 8 * 60;

  const now = new Date();
  const nowTs = now.getTime();

  // Gather meals from today + yesterday
  const todayEntries = getDailySummary(todayLocalISO()).entries;
  const yesterdayEntries = getDailySummary(yesterdayLocalISO()).entries;

  const todaySorted = [...todayEntries].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const yesterdaySorted = [...yesterdayEntries].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  const firstMealToday = todaySorted[0]
    ? new Date(todaySorted[0].created_at).getTime()
    : null;
  const lastMealToday = todaySorted[todaySorted.length - 1]
    ? new Date(todaySorted[todaySorted.length - 1].created_at).getTime()
    : null;
  const lastMealYesterday = yesterdaySorted[yesterdaySorted.length - 1]
    ? new Date(yesterdaySorted[yesterdaySorted.length - 1].created_at).getTime()
    : null;

  const lastMealTs = lastMealToday ?? lastMealYesterday;

  // No meals at all → idle state (haven't started yet)
  if (!firstMealToday && !lastMealYesterday) {
    return {
      mode: "idle",
      elapsedMin: 0,
      protocolFastMin: PROTOCOL_FAST_MIN,
      protocolEatMin: PROTOCOL_EAT_MIN,
      nextEatingOpenHHMM: null,
      eatingCloseHHMM: null,
      lastMealHHMM: null,
      phase: { label: "Belum mulai", tone: "sky" },
    };
  }

  // If user had first meal today, eating window = first_meal → first_meal + 8h
  if (firstMealToday) {
    const eatingEndTs = firstMealToday + PROTOCOL_EAT_MIN * 60 * 1000;
    if (nowTs < eatingEndTs) {
      // Still in eating window
      const elapsedMin = Math.max(
        0,
        Math.round((nowTs - firstMealToday) / 60000),
      );
      return {
        mode: "eating",
        elapsedMin,
        protocolFastMin: PROTOCOL_FAST_MIN,
        protocolEatMin: PROTOCOL_EAT_MIN,
        nextEatingOpenHHMM: null,
        eatingCloseHHMM: tsToHHMM(eatingEndTs),
        lastMealHHMM: lastMealTs ? tsToHHMM(lastMealTs) : null,
        phase: { label: "Eating window", tone: "forest" },
      };
    }
    // Past eating window → fasting from last meal today
    const fastStartTs = lastMealToday ?? eatingEndTs;
    const elapsedMin = Math.max(0, Math.round((nowTs - fastStartTs) / 60000));
    const nextWindowTs = firstMealToday + 24 * 60 * 60 * 1000; // tomorrow same time
    return {
      mode: "fasting",
      elapsedMin,
      protocolFastMin: PROTOCOL_FAST_MIN,
      protocolEatMin: PROTOCOL_EAT_MIN,
      nextEatingOpenHHMM: tsToHHMM(nextWindowTs),
      eatingCloseHHMM: null,
      lastMealHHMM: lastMealTs ? tsToHHMM(lastMealTs) : null,
      phase: phaseFromHours(elapsedMin / 60),
    };
  }

  // No meals today, but had meals yesterday → fasting since yesterday's last meal
  const elapsedMin = Math.max(
    0,
    Math.round((nowTs - (lastMealYesterday as number)) / 60000),
  );
  return {
    mode: "fasting",
    elapsedMin,
    protocolFastMin: PROTOCOL_FAST_MIN,
    protocolEatMin: PROTOCOL_EAT_MIN,
    nextEatingOpenHHMM: null,
    eatingCloseHHMM: null,
    lastMealHHMM: lastMealYesterday ? tsToHHMM(lastMealYesterday) : null,
    phase: phaseFromHours(elapsedMin / 60),
  };
}

function phaseFromHours(hours: number): FastingState["phase"] {
  if (hours < 4) return { label: "Anabolic", tone: "sky" };
  if (hours < 12) return { label: "Glikogen", tone: "sky" };
  if (hours < 18) return { label: "Ketosis ringan", tone: "sun" };
  if (hours < 24) return { label: "Autofagi", tone: "clay" };
  return { label: "Deep ketosis", tone: "clay" };
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
  const size = 130;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);
  const gradId = "if-card-grad";

  return (
    <div className="bg-surface rounded-[28px] border border-hairline shadow-[var(--shadow-paper-1)] p-5 sm:p-7 h-full relative overflow-hidden flex flex-col">
      {/* Sun radial gradient — fills top-right + bleeds across upper-right quadrant */}
      <span
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(245,206,90,0.55) 0%, rgba(245,206,90,0.18) 45%, transparent 75%)",
        }}
      />
      {/* Clay accent bottom-left */}
      <span
        className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(217,124,79,0.16) 0%, transparent 70%)",
        }}
      />

      {/* ===== Top row: kicker left + phase pill right ===== */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
          IF Timer · 16:8
        </div>
        <Pill tone={state.phase.tone} size="md">
          {state.phase.label}
        </Pill>
      </div>

      {/* ===== Main row: donut LEFT + body RIGHT, vertically centered to fill ===== */}
      <div className="relative z-10 flex items-center gap-4 sm:gap-5 flex-1">
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
              style={{ transition: "stroke-dashoffset 400ms ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-clay">
              {state.mode === "fasting"
                ? "Fasting"
                : state.mode === "eating"
                  ? "Eating"
                  : "Idle"}
            </div>
            <div
              className="tabular mt-1 leading-none"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 36,
              }}
            >
              {fmtHHMM(state.elapsedMin)}
            </div>
            <div className="text-[10px] text-muted mt-1 tabular">
              {state.mode === "fasting"
                ? `dari 16:00`
                : state.mode === "eating"
                  ? `dari 08:00`
                  : `belum mulai`}
            </div>
          </div>
        </div>

        {/* Right side: copy stacked top, button stacked bottom */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-3 h-full py-1">
          <p className="text-[13px] text-muted leading-relaxed">
            {state.mode === "fasting" && state.lastMealHHMM ? (
              <>
                Terakhir makan jam{" "}
                <span className="font-bold text-ink tabular">
                  {state.lastMealHHMM}
                </span>
                .
                <br />
                {state.nextEatingOpenHHMM ? (
                  <>
                    Buka next window{" "}
                    <span className="font-semibold text-clay tabular">
                      {state.nextEatingOpenHHMM}
                    </span>
                    .
                  </>
                ) : (
                  <>Catat meal pertama buat buka eating window.</>
                )}
                {ramadanActive ? (
                  <>
                    <br />
                    Mode Ramadan otomatis aktif{" "}
                    <span className="font-semibold text-clay">15 Mar.</span>
                  </>
                ) : null}
              </>
            ) : state.mode === "eating" ? (
              <>
                Window selesai jam{" "}
                <span className="font-bold text-ink tabular">
                  {state.eatingCloseHHMM ?? "—"}
                </span>
                .
                {state.lastMealHHMM && (
                  <>
                    <br />
                    Terakhir makan{" "}
                    <span className="font-semibold text-clay tabular">
                      {state.lastMealHHMM}
                    </span>
                    .
                  </>
                )}
              </>
            ) : (
              <>Catat meal pertama buat mulai tracking.</>
            )}
          </p>
          <div>
            <Link
              href="/tools/if"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface border border-hairline-2 hover:border-forest hover:bg-forest-50 text-[12px] font-semibold transition-colors shadow-[var(--shadow-paper-1)]"
            >
              Adjust window
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
