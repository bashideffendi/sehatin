/**
 * Hydrate localStorage from Supabase after sign-in.
 *
 * Each table's hydrate function fetches the user's rows from Supabase and
 * overwrites the corresponding localStorage cache. Component code keeps
 * reading from localStorage (sync) and stays unchanged.
 *
 * Call once after authenticating. Pairs with the write-through sync inside
 * each lib (saveProfile / addEntry / addWeight / saveMealPlan /
 * saveWorkoutPlan / upsertSession) which fires async Supabase upserts on
 * every mutation.
 */
"use client";

import { hydrateProfileFromSupabase } from "@/lib/profile";
import { hydrateFoodLogFromSupabase } from "@/lib/food-log";
import { hydrateWeightLogFromSupabase } from "@/lib/weight-log";
import { hydrateMealPlanFromSupabase } from "@/lib/meal-plan";
import { hydrateWorkoutPlanFromSupabase } from "@/lib/workout";
import { hydrateWorkoutLogFromSupabase } from "@/lib/workout-log";

export interface HydrateResult {
  profile: boolean;
  food_log_count: number;
  weight_log_count: number;
  meal_plan: boolean;
  workout_plan: boolean;
  workout_log_count: number;
}

export async function hydrateAllFromSupabase(): Promise<HydrateResult> {
  // Fire all six in parallel — they hit different tables, no ordering needed.
  const [
    profile,
    foodLogCount,
    weightLogCount,
    mealPlan,
    workoutPlan,
    workoutLogCount,
  ] = await Promise.all([
    hydrateProfileFromSupabase(),
    hydrateFoodLogFromSupabase(),
    hydrateWeightLogFromSupabase(),
    hydrateMealPlanFromSupabase(),
    hydrateWorkoutPlanFromSupabase(),
    hydrateWorkoutLogFromSupabase(),
  ]);
  return {
    profile: !!profile,
    food_log_count: foodLogCount,
    weight_log_count: weightLogCount,
    meal_plan: mealPlan,
    workout_plan: workoutPlan,
    workout_log_count: workoutLogCount,
  };
}
