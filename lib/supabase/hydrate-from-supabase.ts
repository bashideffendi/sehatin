/**
 * Hydrate localStorage from Supabase after sign-in.
 *
 * Each table's hydrate function fetches the user's rows from Supabase and
 * overwrites the corresponding localStorage cache. Component code keeps
 * reading from localStorage (sync) and stays unchanged.
 *
 * Call once after authenticating. Pairs with the write-through sync inside
 * each lib (saveProfile / addEntry / addWeight, etc.) which fires async
 * Supabase upserts on every mutation.
 */
"use client";

import { hydrateProfileFromSupabase } from "@/lib/profile";
import { hydrateFoodLogFromSupabase } from "@/lib/food-log";
import { hydrateWeightLogFromSupabase } from "@/lib/weight-log";

export interface HydrateResult {
  profile: boolean;
  food_log_count: number;
  weight_log_count: number;
}

export async function hydrateAllFromSupabase(): Promise<HydrateResult> {
  // Fire all three in parallel — they hit different tables, no ordering needed.
  const [profile, foodLogCount, weightLogCount] = await Promise.all([
    hydrateProfileFromSupabase(),
    hydrateFoodLogFromSupabase(),
    hydrateWeightLogFromSupabase(),
  ]);
  return {
    profile: !!profile,
    food_log_count: foodLogCount,
    weight_log_count: weightLogCount,
  };
}
