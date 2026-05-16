/**
 * Insights — derive weekly stats + streaks from food log + weight log.
 * Pure computation, no storage.
 */

import { getDailySummary, todayISO, type DailySummary } from "./food-log";
import { getWeightHistory, type WeightLogEntry } from "./weight-log";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
}

export interface WeekInsights {
  days: DailySummary[]; // 7 days, oldest -> newest
  total_kcal: number;
  avg_kcal: number; // averaged over logged days (not 7)
  avg_protein_g: number;
  on_target_count: number;
  over_target_count: number;
  under_target_count: number;
  rest_count: number; // days with 0 entries (skipped)
  total_entries: number;
  best_day: DailySummary | null; // closest to target
}

/**
 * Compute insights for a 7-day window ending at `endDate` (inclusive).
 * Bandwidth for on/under/over: target ±10%.
 */
export function getWeekInsights(
  endDate: string,
  targetKcal: number | null = null,
): WeekInsights {
  const days: DailySummary[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(getDailySummary(shiftISO(endDate, -i)));
  }
  const total_kcal = days.reduce((s, d) => s + d.total_kcal, 0);
  const total_protein_g = days.reduce((s, d) => s + d.total_protein_g, 0);
  const total_entries = days.reduce((s, d) => s + d.entry_count, 0);
  const loggedDays = days.filter((d) => d.entry_count > 0);
  const avg_kcal =
    loggedDays.length > 0
      ? Math.round(total_kcal / loggedDays.length)
      : 0;
  const avg_protein_g =
    loggedDays.length > 0
      ? Math.round((total_protein_g / loggedDays.length) * 10) / 10
      : 0;

  let on = 0;
  let over = 0;
  let under = 0;
  let rest = 0;
  let best: DailySummary | null = null;

  if (targetKcal && targetKcal > 0) {
    const low = targetKcal * 0.9;
    const high = targetKcal * 1.1;
    for (const d of days) {
      if (d.entry_count === 0) {
        rest++;
        continue;
      }
      if (d.total_kcal < low) under++;
      else if (d.total_kcal > high) over++;
      else on++;
      if (
        !best ||
        Math.abs(d.total_kcal - targetKcal) <
          Math.abs(best.total_kcal - targetKcal)
      ) {
        best = d;
      }
    }
  } else {
    for (const d of days) {
      if (d.entry_count === 0) rest++;
    }
  }

  return {
    days,
    total_kcal,
    avg_kcal,
    avg_protein_g,
    on_target_count: on,
    over_target_count: over,
    under_target_count: under,
    rest_count: rest,
    total_entries,
    best_day: best,
  };
}

/**
 * Streak — consecutive days with at least 1 food log entry, ending at `endDate`.
 * If endDate has no entries, streak = 0.
 * Capped at 365 days to bound iteration.
 */
export function getStreak(endDate: string = todayISO()): number {
  let streak = 0;
  let cursor = endDate;
  for (let i = 0; i < 365; i++) {
    const summary = getDailySummary(cursor);
    if (summary.entry_count === 0) break;
    streak++;
    cursor = shiftISO(cursor, -1);
  }
  return streak;
}

/**
 * Best streak ever — scan all logged dates and find longest consecutive run.
 * Compute on demand, no caching.
 */
export function getBestStreak(loggedDates: Iterable<string>): number {
  const sorted = Array.from(loggedDates).sort();
  if (sorted.length === 0) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (!prev || !cur) continue;
    const expectedNext = shiftISO(prev, 1);
    if (cur === expectedNext) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }
  return best;
}

export interface WeightSparkData {
  points: { date: string; weight_kg: number; index: number }[];
  min: number;
  max: number;
  first: number;
  last: number;
  delta: number;
}

/**
 * Build sparkline-ready data from weight history (oldest -> newest).
 * Returns null if < 2 points.
 */
export function buildWeightSpark(
  history: WeightLogEntry[] = getWeightHistory(),
  maxPoints = 30,
): WeightSparkData | null {
  if (history.length < 2) return null;
  // Sample most recent N points
  const slice = history.slice(-maxPoints);
  const weights = slice.map((e) => e.weight_kg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const first = slice[0]?.weight_kg ?? 0;
  const last = slice[slice.length - 1]?.weight_kg ?? 0;
  return {
    points: slice.map((e, i) => ({
      date: e.date,
      weight_kg: e.weight_kg,
      index: i,
    })),
    min,
    max,
    first,
    last,
    delta: Math.round((last - first) * 10) / 10,
  };
}
