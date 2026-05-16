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

/** Persist an in-place edit while preserving id + generated_at. */
export function updateMealPlan(stored: StoredMealPlan): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(stored));
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

/** Reverse map: MealSlot enum → Claude's spaced slot string. */
const REVERSE_SLOT_MAP: Record<MealSlot, string> = {
  sarapan: "sarapan",
  makan_siang: "makan siang",
  makan_malam: "makan malam",
  snack: "snack",
};

export function slotForClaude(slot: MealSlot): string {
  return REVERSE_SLOT_MAP[slot];
}

// ============ Recompute helpers (after manual edits) ============

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function recomputeMeal(meal: Meal): Meal {
  const total_kcal = meal.items.reduce((s, i) => s + i.kcal, 0);
  const total_protein_g = round1(meal.items.reduce((s, i) => s + i.protein_g, 0));
  return { ...meal, total_kcal, total_protein_g };
}

export function recomputeDay(day: DayPlan): DayPlan {
  const meals = day.meals.map(recomputeMeal);
  const total_kcal = meals.reduce((s, m) => s + m.total_kcal, 0);
  const total_protein_g = round1(
    meals.reduce((s, m) => s + m.total_protein_g, 0),
  );
  const total_fat_g = round1(
    meals.reduce(
      (s, m) => s + m.items.reduce((ss, i) => ss + i.fat_g, 0),
      0,
    ),
  );
  const total_carb_g = round1(
    meals.reduce(
      (s, m) => s + m.items.reduce((ss, i) => ss + i.carb_g, 0),
      0,
    ),
  );
  return { ...day, meals, total_kcal, total_protein_g, total_fat_g, total_carb_g };
}

export function recomputePlan(plan: MealPlan): MealPlan {
  const days = plan.days.map(recomputeDay);
  const avg_kcal =
    days.length > 0
      ? Math.round(days.reduce((s, d) => s + d.total_kcal, 0) / days.length)
      : 0;
  const avg_protein_g =
    days.length > 0
      ? round1(
          days.reduce((s, d) => s + d.total_protein_g, 0) / days.length,
        )
      : 0;
  return {
    ...plan,
    days,
    summary: {
      ...plan.summary,
      avg_kcal,
      avg_protein_g,
    },
  };
}

/** Default slot list — sarapan/siang/malam (+ snack if 4 meals). */
export function defaultSlotsFor(mealsPerDay: number): string[] {
  return mealsPerDay >= 4
    ? ["sarapan", "makan siang", "makan malam", "snack"]
    : ["sarapan", "makan siang", "makan malam"];
}

/** Build a blank plan with N days × M empty meal slots. */
export function createBlankPlan(
  days: number,
  mealsPerDay: number,
): MealPlan {
  const slots = defaultSlotsFor(mealsPerDay);
  return {
    days: Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      meals: slots.map((slot) => ({
        slot,
        items: [],
        total_kcal: 0,
        total_protein_g: 0,
      })),
      total_kcal: 0,
      total_protein_g: 0,
      total_fat_g: 0,
      total_carb_g: 0,
    })),
    shopping_list: [],
    summary: {
      avg_kcal: 0,
      avg_protein_g: 0,
      notes: ["Plan ini dibikin manual. Edit bebas kapan aja."],
    },
  };
}

/** Immutable item mutations on a MealPlan. All return a new plan with totals re-computed. */
export function addItemToMeal(
  plan: MealPlan,
  dayIdx: number,
  mealIdx: number,
  item: MealItem,
): MealPlan {
  const days = plan.days.map((d, di) => {
    if (di !== dayIdx) return d;
    return {
      ...d,
      meals: d.meals.map((m, mi) =>
        mi !== mealIdx ? m : { ...m, items: [...m.items, item] },
      ),
    };
  });
  return recomputePlan({ ...plan, days });
}

export function removeItemFromMeal(
  plan: MealPlan,
  dayIdx: number,
  mealIdx: number,
  itemIdx: number,
): MealPlan {
  const days = plan.days.map((d, di) => {
    if (di !== dayIdx) return d;
    return {
      ...d,
      meals: d.meals.map((m, mi) =>
        mi !== mealIdx
          ? m
          : { ...m, items: m.items.filter((_, ii) => ii !== itemIdx) },
      ),
    };
  });
  return recomputePlan({ ...plan, days });
}

/** Ensure a meal exists for given slot on a day; append if missing. */
export function ensureMealSlot(
  plan: MealPlan,
  dayIdx: number,
  slotName: string,
): MealPlan {
  const days = plan.days.map((d, di) => {
    if (di !== dayIdx) return d;
    if (d.meals.some((m) => m.slot.toLowerCase() === slotName.toLowerCase()))
      return d;
    return {
      ...d,
      meals: [
        ...d.meals,
        {
          slot: slotName,
          items: [],
          total_kcal: 0,
          total_protein_g: 0,
        },
      ],
    };
  });
  return recomputePlan({ ...plan, days });
}

export function removeMealFromDay(
  plan: MealPlan,
  dayIdx: number,
  mealIdx: number,
): MealPlan {
  const days = plan.days.map((d, di) => {
    if (di !== dayIdx) return d;
    return { ...d, meals: d.meals.filter((_, mi) => mi !== mealIdx) };
  });
  return recomputePlan({ ...plan, days });
}

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
