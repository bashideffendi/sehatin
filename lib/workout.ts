/**
 * Workout plan — localStorage cache for AI-generated workout programs.
 * Stores 1 active program; user can regenerate to replace.
 *
 * Storage key: sehatin:workout_plan:v1
 */

import type {
  WorkoutProgram,
  WorkoutWeek,
  WorkoutSession,
  WorkoutExercise,
} from "@/src/fitness/workout";
import type { Level } from "@/src/fitness/exercises";
import type { TrainingGoal, SplitType } from "@/src/fitness/protocols";
import { getSessionLog } from "./workout-log";

export type {
  WorkoutProgram,
  WorkoutWeek,
  WorkoutSession,
  WorkoutExercise,
};

export interface StoredWorkoutPlan {
  id: string;
  generated_at: string; // ISO timestamp
  start_date: string; // YYYY-MM-DD (week 1 starts here)
  level: Level;
  goal: TrainingGoal;
  split: SplitType;
  days_per_week: number;
  session_minutes: number;
  weeks: number;
  context_notes?: string;
  injuries_or_limitations?: string[];
  program: WorkoutProgram;
}

const KEY = "sehatin:workout_plan:v1";

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function saveWorkoutPlan(
  partial: Omit<StoredWorkoutPlan, "id" | "generated_at">,
): StoredWorkoutPlan {
  const stored: StoredWorkoutPlan = {
    ...partial,
    id: uuid(),
    generated_at: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(stored));
  }
  void syncWorkoutPlanToSupabase(stored);
  return stored;
}

export function getActiveWorkoutPlan(): StoredWorkoutPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredWorkoutPlan;
  } catch {
    return null;
  }
}

export function clearWorkoutPlan(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

// ============ Supabase sync ============

async function syncWorkoutPlanToSupabase(
  stored: StoredWorkoutPlan,
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { createClient } = await import("@/lib/supabase/client");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Deactivate other plans (one active at a time)
    await supabase
      .from("workout_plans")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .neq("id", stored.id);

    const { error } = await supabase.from("workout_plans").upsert(
      {
        id: stored.id,
        user_id: user.id,
        start_date: stored.start_date,
        level: stored.level,
        goal: stored.goal,
        split: stored.split,
        days_per_week: stored.days_per_week,
        session_minutes: stored.session_minutes,
        weeks: stored.weeks,
        context_notes: stored.context_notes ?? null,
        injuries_or_limitations: stored.injuries_or_limitations ?? null,
        program: stored.program,
        generated_at: stored.generated_at,
        is_active: true,
      },
      { onConflict: "id" },
    );
    if (error)
      console.warn("[workout_plan] upsert sync failed:", error.message);
  } catch (e) {
    console.warn("[workout_plan] sync threw:", e);
  }
}

export async function hydrateWorkoutPlanFromSupabase(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { createClient } = await import("@/lib/supabase/client");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn("[workout_plan] hydrate failed:", error.message);
      return false;
    }
    if (!data) return false;

    const stored: StoredWorkoutPlan = {
      id: data.id,
      generated_at: data.generated_at,
      start_date: data.start_date,
      level: data.level as Level,
      goal: data.goal as TrainingGoal,
      split: data.split as SplitType,
      days_per_week: data.days_per_week,
      session_minutes: data.session_minutes,
      weeks: data.weeks,
      context_notes: data.context_notes ?? undefined,
      injuries_or_limitations: data.injuries_or_limitations ?? undefined,
      program: data.program as WorkoutProgram,
    };
    window.localStorage.setItem(KEY, JSON.stringify(stored));
    return true;
  } catch (e) {
    console.warn("[workout_plan] hydrate threw:", e);
    return false;
  }
}

/**
 * Find the first un-logged session in a plan, walking weeks then sessions
 * in order. Returns null if every session has a log entry.
 */
export function findNextUnloggedSession(plan: StoredWorkoutPlan): {
  weekIdx: number;
  sessionIdx: number;
  session: WorkoutSession;
} | null {
  for (let w = 0; w < plan.program.weeks.length; w++) {
    const week = plan.program.weeks[w];
    if (!week) continue;
    for (let s = 0; s < week.sessions.length; s++) {
      const log = getSessionLog(plan.id, w, s);
      if (!log) {
        const session = week.sessions[s];
        if (session) return { weekIdx: w, sessionIdx: s, session };
      }
    }
  }
  return null;
}

/** Pretty label for a training goal. */
export const TRAINING_GOAL_LABEL: Record<string, string> = {
  hypertrophy: "Hipertrofi (mass)",
  strength: "Strength (1RM)",
  fat_loss_circuit: "Fat loss (circuit)",
  endurance_running: "Endurance (lari)",
  hiit_conditioning: "HIIT conditioning",
  general_health: "General health",
};

/** Pretty label for a split type. */
export const SPLIT_LABEL: Record<string, string> = {
  full_body: "Full body",
  upper_lower: "Upper / Lower",
  push_pull_legs: "Push / Pull / Legs",
  body_part_split: "Body part split",
  bro_split: "Bro split",
};

/** Pretty label for a level. */
export const LEVEL_LABEL: Record<string, string> = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Lanjut",
};

/** Map focus string (push/pull/legs/upper/lower/full/core) to color + emoji. */
export function focusStyle(focus: string): { className: string; emoji: string } {
  const f = focus.toLowerCase();
  if (f.includes("push") || f.includes("chest") || f.includes("dada")) {
    return {
      className:
        "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
      emoji: "💪",
    };
  }
  if (f.includes("pull") || f.includes("back") || f.includes("punggung")) {
    return {
      className:
        "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
      emoji: "🪢",
    };
  }
  if (f.includes("leg") || f.includes("kaki") || f.includes("lower")) {
    return {
      className:
        "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
      emoji: "🦵",
    };
  }
  if (f.includes("upper") || f.includes("atas")) {
    return {
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
      emoji: "🔝",
    };
  }
  if (f.includes("core") || f.includes("perut") || f.includes("abs")) {
    return {
      className:
        "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
      emoji: "🎯",
    };
  }
  if (f.includes("cardio") || f.includes("hiit") || f.includes("liss")) {
    return {
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      emoji: "🏃",
    };
  }
  return {
    className: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
    emoji: "🏋️",
  };
}
