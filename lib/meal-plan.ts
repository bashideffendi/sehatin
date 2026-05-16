/**
 * Meal plan — localStorage cache for AI-generated meal plans.
 * Stores 1 active plan; user can regenerate to replace.
 *
 * Storage key: sehatin:meal_plan:v1
 */

import type {
  MealPlan,
  DayPlan,
  Meal,
  MealItem,
} from "@/src/nutrition/meal-plan";
import type { NutritionTargets } from "@/src/nutrition/tdee";
import type { MealSlot } from "./food-log";

export type { MealPlan, DayPlan, Meal, MealItem };

export interface StoredMealPlan {
  id: string;
  generated_at: string; // ISO timestamp
  start_date: string; // YYYY-MM-DD (day 1 of plan)
  days: number; // 1-7
  diet_method?: string;
  budget_idr_per_day?: number;
  context_notes?: string;
  targets: NutritionTargets;
  plan: MealPlan;
}

const KEY = "sehatin:meal_plan:v1";

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function saveMealPlan(
  partial: Omit<StoredMealPlan, "id" | "generated_at">,
): StoredMealPlan {
  const stored: StoredMealPlan = {
    ...partial,
    id: uuid(),
    generated_at: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(stored));
  }
  return stored;
}

export function getActiveMealPlan(): StoredMealPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredMealPlan;
  } catch {
    return null;
  }
}

export function clearMealPlan(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

/** Resolve plan-day for a given ISO date. Returns null if outside plan range. */
export function getPlanDayForDate(
  iso: string,
  plan: StoredMealPlan | null,
): DayPlan | null {
  if (!plan) return null;
  const start = Date.parse(`${plan.start_date}T00:00:00`);
  const target = Date.parse(`${iso}T00:00:00`);
  if (!Number.isFinite(start) || !Number.isFinite(target)) return null;
  const diffDays = Math.floor((target - start) / (24 * 60 * 60 * 1000));
  if (diffDays < 0 || diffDays >= plan.plan.days.length) return null;
  return plan.plan.days[diffDays] ?? null;
}

/** Map Claude's slot string ("makan siang") to our MealSlot enum ("makan_siang"). */
const SLOT_MAP: Record<string, MealSlot> = {
  sarapan: "sarapan",
  "makan siang": "makan_siang",
  "makan malam": "makan_malam",
  snack: "snack",
};

export function normalizeSlot(claudeSlot: string): MealSlot | null {
  const k = claudeSlot.toLowerCase().trim();
  return SLOT_MAP[k] ?? null;
}

/** Convert a YYYY-MM-DD to "DD Mmm" formatted Indonesian short label. */
export function shortDateID(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

/** Add N days to YYYY-MM-DD, returning YYYY-MM-DD. */
export function shiftISODate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
