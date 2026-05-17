/**
 * User profile storage helpers (localStorage MVP, no auth yet).
 *
 * Schema versioned via `v` field — bump kalau breaking change biar migrate.
 */
import type { ActivityLevel, Goal, Sex } from "@/src/nutrition/tdee";
import type { DietMethod } from "@/src/nutrition/diet-methods";
import type { Equipment } from "@/src/fitness/exercises";

export const PROFILE_KEY = "sehatin:profile:v2";

// Inspired by bitepal.app quiz mapping — comprehensive profiling for AI generation.
export type WeightGoalMagnitude = "lose_1_10" | "lose_11_20" | "lose_20plus" | "maintain" | "gain";
export type MainMotivation = "lose_weight" | "heart_health" | "firm_toned" | "stress_relief" | "energy" | "longevity";
export type BodyType = "kurus" | "regular" | "berisi" | "ekstra";
export type TargetBody = "lean" | "athletic" | "shredded" | "fit_strong";
export type TargetZone = "perut" | "dada" | "lengan" | "punggung" | "paha" | "bokong" | "betis";
export type SleepDuration = "lt5" | "5_6" | "7_8" | "gt8";
export type WaterConsumption = "tea_coffee_only" | "lt2_glass" | "2_6_glass" | "7_10_glass" | "gt10_glass";
export type EatLocation = "masak_rumah" | "warung_warteg" | "kantor_kantin" | "resto" | "delivery_gofood";
export type LifeEvent =
  | "medicine_hormonal"
  | "busy_kerja_keluarga"
  | "stress_mental"
  | "kerjaan_baru"
  | "pandemi"
  | "cedera"
  | "menikah"
  | "hamil_melahirkan"
  | "tidak_ada";
export type BodyImageSatisfaction = "lt1y" | "1_2y" | "gt3y" | "tidak_pernah";
export type SpecialOccasion = "liburan" | "pernikahan" | "acara_olahraga" | "reuni" | "ramadan" | "tidak_ada";

// Likert 1-5 (1=Tidak sama sekali, 5=Sangat ya)
export type Likert = 1 | 2 | 3 | 4 | 5;

export interface EatingPsychology {
  plate_clearing?: Likert;
  emotional_eating?: Likert;
  mindless_eating?: Likert;
  consistency_struggle?: Likert;
  late_night_snacking?: Likert;
}

// Emotional eating triggers — granular daripada single Likert
export type EmotionalTrigger =
  | "anxious_stressed"
  | "bored"
  | "reward_treat"
  | "overwhelmed_low"
  | "not_emotional";

// Trigger self-awareness frequency
export type TriggerAwareness = "always" | "sometimes" | "rarely" | "never";

// Affect setelah emotional eating
export type AfterEmotionalEating =
  | "guilty"
  | "relieved"
  | "numb"
  | "regretful"
  | "dont_eat_emotionally";

// Past food trauma (sensitive!)
export type FoodTrauma =
  | "body_bullied"
  | "limited_healthy_food"
  | "diets_too_young"
  | "binge_struggle"
  | "food_as_punish_reward"
  | "none";

// Underlying motivation (deeper than goal)
export type UnderlyingMotivation =
  | "feel_better_body"
  | "boost_energy_mood"
  | "improve_health"
  | "feel_confident"
  | "want_balance";

// Readiness/confidence level
export type ReadinessLevel =
  | "ready_all_in" // 🚀
  | "motivated_need_support" // 🐢
  | "take_slow" // ⏰
  | "not_sure_start" // ❓
  | "tried_failed_before"; // 💔

// Barriers (conditional on need support)
export type Barrier =
  | "havent_done_before"
  | "rules_too_restrictive"
  | "might_plateau"
  | "yo_yo_regain"
  | "motivation_loss"
  | "plan_unrealistic"
  | "plan_too_easy"
  | "other";

// Habit change anchor (Tiny Habits pattern)
export type HabitAnchor =
  | "stop_skipping_meals"
  | "reduce_emotional_eating"
  | "plan_meals_ahead"
  | "snack_more_mindfully"
  | "track_food_consistently"
  | "eat_more_vegetables"
  | "drink_more_water";

// Snacking time
export type SnackTime = "morning" | "afternoon" | "evening" | "late_night" | "rarely_snack";

// Pace preference
export type PacePreference = "as_fast_possible" | "slow_steady" | "in_between";

// Mode khusus — contextual states that adjust meal/workout plan generation
export type ModeKhusus =
  | "ramadan" // sahur-buka window, low-intensity workout
  | "kondangan_recovery" // recovering from over-eating event, plan defisit
  | "dinas" // perjalanan dinas, limited food choices, hotel/airport
  | "cheat_day"; // intentional cheat, plan minim restriction

// Medical conditions — important untuk Indonesia (komorbid umum)
export type MedicalCondition =
  | "hipertensi"
  | "diabetes_tipe2"
  | "diabetes_tipe1"
  | "kolesterol_tinggi"
  | "asam_urat_gout"
  | "ginjal_kronik"
  | "jantung"
  | "thyroid"
  | "hamil"
  | "menyusui"
  | "pcos"
  | "ibs_lambung"
  | "celiac_gluten"
  | "tidak_ada";

// Food allergies / intolerances
export type FoodAllergy =
  | "kacang_tanah"
  | "kacang_pohon"
  | "susu_laktosa"
  | "telur"
  | "gandum_gluten"
  | "seafood_kerang"
  | "ikan"
  | "kedelai"
  | "wijen"
  | "lain";

export interface UserProfile {
  v: 2;

  // ===== IDENTITY =====
  name?: string;
  sex?: Sex;
  age?: number;
  age_bracket?: "18-24" | "25-34" | "35-44" | "45-54" | "55plus";

  // ===== BODY =====
  weight_kg?: number;
  height_cm?: number;
  target_weight_kg?: number;
  body_fat_pct?: number;
  current_body_type?: BodyType;
  target_body_type?: TargetBody;
  target_zones?: TargetZone[];

  // ===== MOTIVATION =====
  weight_goal_magnitude?: WeightGoalMagnitude;
  goal?: Goal; // derived from magnitude + targets
  main_motivation?: MainMotivation;
  special_occasion?: SpecialOccasion;
  target_event_date?: string; // ISO date, optional
  body_image_satisfaction?: BodyImageSatisfaction;

  // ===== LIFESTYLE =====
  activity?: ActivityLevel;
  uses_fitness_tracker?: boolean;
  sleep_duration?: SleepDuration;
  water_consumption?: WaterConsumption;
  eat_locations?: EatLocation[];

  // ===== DIET =====
  diet_method?: DietMethod;
  preferences?: {
    halal?: boolean; // default true Indonesia
    no_pork?: boolean;
    no_seafood?: boolean;
    no_dairy?: boolean;
    no_egg?: boolean;
    vegetarian?: boolean;
    vegan?: boolean;
    alergi?: string[]; // free text
  };

  // ===== EATING PSYCHOLOGY =====
  eating_psychology?: EatingPsychology;
  emotional_triggers?: EmotionalTrigger[]; // multi
  trigger_awareness?: TriggerAwareness;
  after_emotional_eating?: AfterEmotionalEating;
  past_food_trauma?: FoodTrauma[]; // multi (sensitive!)
  snack_time?: SnackTime;

  // ===== DEEP MOTIVATION =====
  underlying_motivation?: UnderlyingMotivation;
  readiness_level?: ReadinessLevel;
  barriers?: Barrier[]; // conditional on readiness != ready_all_in
  habit_anchor?: HabitAnchor; // 1 single habit ready to change
  pace_preference?: PacePreference;

  // ===== HEALTH CONTEXT =====
  life_events?: LifeEvent[];
  medical_conditions?: MedicalCondition[]; // important untuk safety
  food_allergies?: FoodAllergy[];
  allergies_other?: string; // free text additional

  // ===== INDONESIAN SPECIFIC =====
  budget_idr_per_day?: number;
  province_id?: number | "national"; // PIHPS lookup
  equipment_available?: Equipment[];
  active_modes?: ModeKhusus[]; // Ramadan / Kondangan recovery / Dinas / Cheat day

  // ===== META =====
  completed_at?: string;
  updated_at?: string;
}

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (parsed.v !== 2) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Partial<UserProfile>): UserProfile {
  if (typeof window === "undefined") return { v: 2 };
  const existing = loadProfile() ?? { v: 2 as const };
  const merged: UserProfile = {
    ...existing,
    ...profile,
    v: 2,
    updated_at: new Date().toISOString(),
  };
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
  return merged;
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_KEY);
}

export function isProfileComplete(p: UserProfile | null): boolean {
  if (!p) return false;
  return Boolean(
    p.sex && p.age && p.weight_kg && p.height_cm && p.activity && p.goal,
  );
}
