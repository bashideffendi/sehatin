/**
 * Shopping list aggregator — compute total ingredient list from a meal
 * plan by summing portion_g across all meals × all days, grouped by
 * food_name.
 */

import type { StoredMealPlan } from "./meal-plan";

export interface ShoppingItem {
  name: string;
  /** Total grams summed across the entire plan */
  total_g: number;
  /** Count of times this ingredient appears */
  occurrences: number;
  /** Estimated total kcal contribution (sanity check) */
  total_kcal: number;
}

/**
 * Aggregate items from a stored meal plan into a shopping list.
 * Groups by food_name (case-insensitive, trimmed), sums portion_g,
 * sorts by total_g desc so heaviest staples surface first.
 */
export function buildShoppingList(plan: StoredMealPlan): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();
  for (const day of plan.plan.days) {
    for (const meal of day.meals) {
      for (const item of meal.items) {
        const key = item.food_name.trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.total_g += item.portion_g;
          existing.occurrences += 1;
          existing.total_kcal += item.kcal;
        } else {
          map.set(key, {
            name: item.food_name.trim(),
            total_g: item.portion_g,
            occurrences: 1,
            total_kcal: item.kcal,
          });
        }
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total_g - a.total_g);
}

/** Convert grams to a more shopping-friendly display ("1.2 kg" vs "1200g") */
export function fmtPortion(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(1).replace(".", ",")} kg`;
  return `${Math.round(g)} g`;
}
