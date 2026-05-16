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
