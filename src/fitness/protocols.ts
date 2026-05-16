/**
 * Workout protocols — set/rep schemes, rest periods, split types per goal.
 *
 * Used as rules engine guidance for Claude when composing workout programs.
 * Claude pick specific exercises, protocol provides the parameters.
 */

import type { Level } from "./exercises.ts";

export type TrainingGoal =
  | "strength" // 1-5 reps, heavy, long rest
  | "hypertrophy" // 6-12 reps, moderate, moderate rest
  | "endurance" // 13+ reps, light, short rest
  | "fat_loss_circuit" // circuit/HIIT mix, short rest
  | "general_health" // moderate everything, focus consistency
  | "athletic_power"; // explosive, low rep high quality

export type SplitType =
  | "full_body" // semua main pattern tiap sesi (2-3x/minggu)
  | "upper_lower" // U-L alternasi (4x/minggu)
  | "push_pull_legs" // PPL (3-6x/minggu)
  | "bro_split" // chest/back/legs/arms/shoulders (5x/minggu, advanced)
  | "calisthenic"; // bodyweight focus (any frequency)

export interface ProtocolParam {
  sets_per_exercise: number;
  reps: string; // "5" / "8-12" / "AMRAP" / "30s on/15s off"
  rest_seconds: number;
  intensity_pct_1rm: string; // "80-90%" / "60-75%" / "bodyweight" / "RPE 7-8"
  exercise_count_per_session: number; // ~4-7 typical
  notes: string;
}

const PROTOCOLS: Record<TrainingGoal, ProtocolParam> = {
  strength: {
    sets_per_exercise: 4,
    reps: "3-5",
    rest_seconds: 180,
    intensity_pct_1rm: "85-92% 1RM (RPE 8-9)",
    exercise_count_per_session: 4,
    notes:
      "Fokus compound (squat/deadlift/bench/OHP/row). Long rest 2-4 menit antar set untuk pulih neurologis. Warm-up dengan beban ringan progresif. Gak setiap latihan PR — periodisasi penting.",
  },
  hypertrophy: {
    sets_per_exercise: 4,
    reps: "8-12",
    rest_seconds: 90,
    intensity_pct_1rm: "65-80% 1RM (RPE 7-9, 1-3 reps in reserve)",
    exercise_count_per_session: 6,
    notes:
      "Volume = kunci. Total 10-20 working set per muscle group per minggu. Pakai compound + isolation. Time under tension penting, tempo 2-1-2 (turun 2 detik, hold 1, naik 2).",
  },
  endurance: {
    sets_per_exercise: 3,
    reps: "15-20",
    rest_seconds: 45,
    intensity_pct_1rm: "40-60% 1RM (RPE 6-7)",
    exercise_count_per_session: 6,
    notes:
      "Rep tinggi, rest pendek. Bagus buat tahap dasar pemula, deload, atau target stamina/kapilarisasi.",
  },
  fat_loss_circuit: {
    sets_per_exercise: 3,
    reps: "30-45s work / 15-30s rest",
    rest_seconds: 30,
    intensity_pct_1rm: "RPE 7-8",
    exercise_count_per_session: 6,
    notes:
      "Circuit / HIIT — eksekusi exercise berurutan tanpa rest panjang. EPOC (afterburn) tinggi. 4-6 stasiun, ulang 3-4 round. Total sesi 25-35 menit termasuk warmup.",
  },
  general_health: {
    sets_per_exercise: 3,
    reps: "10-15",
    rest_seconds: 60,
    intensity_pct_1rm: "50-70% 1RM (RPE 6-8)",
    exercise_count_per_session: 5,
    notes:
      "Balanced semua movement pattern. Konsistensi > intensitas. Cocok pemula, ibu rumah tangga, profesional 9-5. Bisa kombinasi 2-3x/minggu resistance + 1-2x cardio.",
  },
  athletic_power: {
    sets_per_exercise: 5,
    reps: "3-5 (explosive)",
    rest_seconds: 150,
    intensity_pct_1rm: "70-85% (gerakan cepat)",
    exercise_count_per_session: 4,
    notes:
      "Power = beban moderat tapi gerakan eksplosif. Box jump, kettlebell swing, clean, jump squat. Quality > quantity. Rest panjang antara set untuk pulih ATP-CP.",
  },
};

export function getProtocol(goal: TrainingGoal): ProtocolParam {
  return PROTOCOLS[goal];
}

export interface SplitDef {
  split: SplitType;
  label_id: string;
  sessions_per_week_recommendation: { min: number; max: number };
  weekly_pattern: string[]; // tiap entry = label sesi (Senin, Selasa, dst)
  notes_id: string;
}

const SPLITS: Record<SplitType, SplitDef> = {
  full_body: {
    split: "full_body",
    label_id: "Full Body",
    sessions_per_week_recommendation: { min: 2, max: 3 },
    weekly_pattern: ["Full Body A", "Full Body B", "Full Body A"],
    notes_id:
      "Semua main pattern (push, pull, squat, hinge, core) tiap sesi. Cocok pemula + busy professional. Frekuensi tiap muscle group 2-3x/minggu.",
  },
  upper_lower: {
    split: "upper_lower",
    label_id: "Upper/Lower",
    sessions_per_week_recommendation: { min: 4, max: 4 },
    weekly_pattern: ["Upper", "Lower", "Rest", "Upper", "Lower"],
    notes_id:
      "U-L-rest-U-L. Compound dominan. Volume per muscle group baik (2x/minggu). Intermediate.",
  },
  push_pull_legs: {
    split: "push_pull_legs",
    label_id: "Push / Pull / Legs",
    sessions_per_week_recommendation: { min: 3, max: 6 },
    weekly_pattern: ["Push", "Pull", "Legs", "Rest", "Push", "Pull", "Legs"],
    notes_id:
      "PPL — 3x/minggu (frekuensi 1x per muscle group) untuk pemula, 6x/minggu (2x per muscle group) untuk advanced. Volume tinggi.",
  },
  bro_split: {
    split: "bro_split",
    label_id: "Bro Split (1 muscle group / hari)",
    sessions_per_week_recommendation: { min: 5, max: 5 },
    weekly_pattern: ["Dada", "Punggung", "Kaki", "Bahu", "Lengan"],
    notes_id:
      "1 muscle group per hari, 5x/minggu. Volume per session sangat tinggi tapi frekuensi 1x/minggu. Cocok advanced bodybuilder, kurang optimal untuk pemula.",
  },
  calisthenic: {
    split: "calisthenic",
    label_id: "Calisthenic (bodyweight)",
    sessions_per_week_recommendation: { min: 3, max: 5 },
    weekly_pattern: ["Push", "Pull", "Legs"],
    notes_id:
      "Fokus bodyweight skills + strength. Push (push-up, dip, pike), Pull (pull-up, row), Legs (squat, lunge, pistol). Progressive overload via leverage/variation, bukan beban.",
  },
};

export function getSplit(split: SplitType): SplitDef {
  return SPLITS[split];
}

export function listSplits(): SplitDef[] {
  return Object.values(SPLITS);
}

export function listGoals(): Array<{ goal: TrainingGoal; protocol: ProtocolParam }> {
  return (Object.entries(PROTOCOLS) as Array<[TrainingGoal, ProtocolParam]>).map(
    ([g, p]) => ({ goal: g, protocol: p }),
  );
}

/**
 * Recommendation: split type based on user profile.
 */
export function recommendSplit(opts: {
  level: Level;
  days_per_week: number;
  goal: TrainingGoal;
}): SplitType {
  const { level, days_per_week, goal } = opts;

  // Beginner → almost always full body
  if (level === "beginner" || days_per_week <= 3) {
    return "full_body";
  }

  // Intermediate / advanced + 4 days → upper/lower
  if (days_per_week === 4) {
    return "upper_lower";
  }

  // 5-6 days → PPL or bro split
  if (days_per_week >= 5) {
    if (goal === "hypertrophy" && level === "advanced") {
      return "bro_split";
    }
    return "push_pull_legs";
  }

  return "full_body";
}
