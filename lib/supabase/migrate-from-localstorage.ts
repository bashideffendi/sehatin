/**
 * Migrate localStorage demo/legacy data → Supabase tables after user logs in.
 *
 * Runs ONCE after first login (tracked via localStorage flag).
 * Safely no-op if user has no localStorage data.
 */
"use client";

import { createClient } from "./client";
import { loadProfile } from "@/lib/profile";

const MIGRATED_FLAG = "sehatin:migrated_to_supabase:v1";

export async function migrateLocalStorageToSupabase(): Promise<{
  migrated: boolean;
  tables: string[];
  error?: string;
}> {
  if (typeof window === "undefined") {
    return { migrated: false, tables: [] };
  }

  // Already migrated? Skip.
  if (window.localStorage.getItem(MIGRATED_FLAG) === "1") {
    return { migrated: false, tables: [] };
  }

  // Cast supabase to `any` for table operations — type inference from
  // Database generic is tricky with @supabase/ssr v0.x. Schema is enforced
  // server-side by Postgres + RLS so we're safe.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { migrated: false, tables: [], error: "No authenticated user" };
  }

  const tables: string[] = [];

  // ===== Profile =====
  const localProfile = loadProfile();
  if (localProfile) {
    const { v, completed_at, updated_at, ...profileFields } = localProfile;
    void v; // unused
    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        ...profileFields,
        completed_at: completed_at ?? null,
      },
      { onConflict: "user_id" },
    );
    if (!error) tables.push("profiles");
  }

  // ===== Food log =====
  const foodLogRaw = window.localStorage.getItem("sehatin:food_log:v1");
  if (foodLogRaw) {
    try {
      const entries = JSON.parse(foodLogRaw) as Array<{
        id: string;
        date: string;
        meal_slot: string;
        food_code?: string;
        food_name: string;
        portion_g: number;
        kcal: number;
        protein_g?: number;
        fat_g?: number;
        carb_g?: number;
        source: string;
        notes?: string;
        created_at: string;
      }>;
      if (entries.length > 0) {
        const rows = entries.map((e) => ({
          user_id: user.id,
          date: e.date,
          meal_slot: e.meal_slot as
            | "sarapan"
            | "makan_siang"
            | "makan_malam"
            | "snack",
          food_code: e.food_code ?? null,
          food_name: e.food_name,
          portion_g: e.portion_g,
          kcal: e.kcal,
          protein_g: e.protein_g ?? null,
          fat_g: e.fat_g ?? null,
          carb_g: e.carb_g ?? null,
          source: e.source as "search" | "plan" | "photo" | "manual",
          notes: e.notes ?? null,
          created_at: e.created_at,
        }));
        const { error } = await supabase.from("food_log").insert(rows);
        if (!error) tables.push("food_log");
      }
    } catch {
      /* skip corrupted */
    }
  }

  // ===== Weight log =====
  const weightRaw = window.localStorage.getItem("sehatin:weight_log:v1");
  if (weightRaw) {
    try {
      const entries = JSON.parse(weightRaw) as Array<{
        date: string;
        weight_kg: number;
        notes?: string;
      }>;
      if (entries.length > 0) {
        const rows = entries.map((e) => ({
          user_id: user.id,
          date: e.date,
          weight_kg: e.weight_kg,
          notes: e.notes ?? null,
        }));
        const { error } = await supabase
          .from("weight_log")
          .upsert(rows, { onConflict: "user_id,date" });
        if (!error) tables.push("weight_log");
      }
    } catch {
      /* skip */
    }
  }

  // ===== Meal plan =====
  const mealPlanRaw = window.localStorage.getItem("sehatin:meal_plan:v1");
  if (mealPlanRaw) {
    try {
      const plan = JSON.parse(mealPlanRaw) as {
        start_date: string;
        days: number;
        diet_method?: string;
        budget_idr_per_day?: number;
        context_notes?: string;
        targets: unknown;
        plan: unknown;
      };
      const { error } = await supabase.from("meal_plans").insert({
        user_id: user.id,
        start_date: plan.start_date,
        days: plan.days,
        diet_method: plan.diet_method ?? null,
        budget_idr_per_day: plan.budget_idr_per_day ?? null,
        context_notes: plan.context_notes ?? null,
        targets: plan.targets as never,
        plan: plan.plan as never,
        is_active: true,
      });
      if (!error) tables.push("meal_plans");
    } catch {
      /* skip */
    }
  }

  // ===== Workout plan =====
  const workoutPlanRaw = window.localStorage.getItem("sehatin:workout_plan:v1");
  if (workoutPlanRaw) {
    try {
      const plan = JSON.parse(workoutPlanRaw) as {
        start_date: string;
        level: string;
        goal: string;
        split: string;
        days_per_week: number;
        session_minutes: number;
        weeks: number;
        context_notes?: string;
        injuries_or_limitations?: string[];
        program: unknown;
      };
      const { error } = await supabase.from("workout_plans").insert({
        user_id: user.id,
        start_date: plan.start_date,
        level: plan.level,
        goal: plan.goal,
        split: plan.split,
        days_per_week: plan.days_per_week,
        session_minutes: plan.session_minutes,
        weeks: plan.weeks,
        context_notes: plan.context_notes ?? null,
        injuries_or_limitations: plan.injuries_or_limitations ?? null,
        program: plan.program as never,
        is_active: true,
      });
      if (!error) tables.push("workout_plans");
    } catch {
      /* skip */
    }
  }

  // ===== Workout log =====
  const workoutLogRaw = window.localStorage.getItem("sehatin:workout_log:v1");
  if (workoutLogRaw) {
    try {
      const entries = JSON.parse(workoutLogRaw) as Array<{
        date: string;
        plan_id?: string;
        week_idx?: number;
        session_idx?: number;
        day_label?: string;
        focus?: string;
        exercises: unknown;
        duration_min?: number;
        notes?: string;
      }>;
      if (entries.length > 0) {
        const rows = entries.map((e) => ({
          user_id: user.id,
          date: e.date,
          plan_id: null, // FK to workout_plans not preserved (mismatched UUID)
          week_idx: e.week_idx ?? null,
          session_idx: e.session_idx ?? null,
          day_label: e.day_label ?? null,
          focus: e.focus ?? null,
          exercises: e.exercises as never,
          duration_min: e.duration_min ?? null,
          notes: e.notes ?? null,
        }));
        const { error } = await supabase.from("workout_logs").insert(rows);
        if (!error) tables.push("workout_logs");
      }
    } catch {
      /* skip */
    }
  }

  // Mark migrated so we don't run again
  window.localStorage.setItem(MIGRATED_FLAG, "1");

  return { migrated: true, tables };
}
