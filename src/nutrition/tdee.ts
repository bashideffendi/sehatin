/**
 * TDEE & macro calculator.
 *
 * Formula: Mifflin-St Jeor (modern standard, more accurate than Harris-Benedict).
 * Activity multipliers: standard ACSM ranges.
 * Macro split: balanced default, adjusted per goal.
 *
 * Output kcal & macros are per day, ground truth for meal plan budget.
 */

export type Sex = "m" | "f";

export type ActivityLevel =
  | "sedentary" // desk job, no exercise
  | "light" // light exercise 1-3x/week
  | "moderate" // moderate 3-5x/week (most user kantor 9-5 + olahraga rutin)
  | "active" // hard 6-7x/week
  | "very_active"; // physical job + hard training

export type Goal =
  | "fat_loss" // moderate deficit -20%
  | "fat_loss_aggressive" // larger deficit -25%
  | "maintain" // 0
  | "recomp" // slight deficit -10% (body recomposition)
  | "slow_gain" // surplus +10% (lean bulk)
  | "muscle_gain"; // surplus +15%

export interface UserProfile {
  age: number; // years
  sex: Sex;
  weight_kg: number;
  height_cm: number;
  activity: ActivityLevel;
  goal: Goal;
  body_fat_pct?: number; // optional, refines lean mass for protein target
}

export interface NutritionTargets {
  bmr: number; // basal metabolic rate (kcal)
  tdee: number; // total daily energy expenditure (kcal)
  target_kcal: number; // adjusted for goal
  goal_adjustment_pct: number; // % deviation from tdee
  protein_g: number;
  fat_g: number;
  carb_g: number;
  fiber_g_min: number; // recommended minimum
  notes: string[];
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENT: Record<Goal, number> = {
  fat_loss: -0.2,
  fat_loss_aggressive: -0.25,
  maintain: 0,
  recomp: -0.1,
  slow_gain: 0.1,
  muscle_gain: 0.15,
};

// Protein per kg bodyweight (or lean mass if body_fat given), per goal
const PROTEIN_G_PER_KG: Record<Goal, number> = {
  fat_loss: 2.2, // higher to preserve muscle in deficit
  fat_loss_aggressive: 2.4,
  maintain: 1.6,
  recomp: 2.0,
  slow_gain: 1.8,
  muscle_gain: 2.0,
};

// Fat: minimum 0.7g/kg, target 0.9-1.1g/kg for hormonal health
const FAT_G_PER_KG: Record<Goal, number> = {
  fat_loss: 0.8,
  fat_loss_aggressive: 0.7,
  maintain: 1.0,
  recomp: 0.9,
  slow_gain: 1.0,
  muscle_gain: 1.0,
};

/**
 * Mifflin-St Jeor BMR.
 * Male:   10*kg + 6.25*cm − 5*age + 5
 * Female: 10*kg + 6.25*cm − 5*age − 161
 */
export function calculateBMR(profile: UserProfile): number {
  const { weight_kg, height_cm, age, sex } = profile;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return Math.round(sex === "m" ? base + 5 : base - 161);
}

export function calculateTargets(profile: UserProfile): NutritionTargets {
  const notes: string[] = [];

  const bmr = calculateBMR(profile);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activity]);
  const adj = GOAL_ADJUSTMENT[profile.goal];
  let target_kcal = Math.round(tdee * (1 + adj));

  // Safety floor: never go below VLCD threshold
  const minSafeKcal = profile.sex === "m" ? 1500 : 1200;
  if (target_kcal < minSafeKcal) {
    notes.push(
      `Target ${target_kcal} kcal dibawah safe floor ${minSafeKcal}, di-clamp ke ${minSafeKcal}. Consider goal yang less aggressive atau konsultasi profesional.`,
    );
    target_kcal = minSafeKcal;
  }

  // Protein: prefer lean mass if body fat % given
  let proteinBaseKg = profile.weight_kg;
  if (typeof profile.body_fat_pct === "number" && profile.body_fat_pct > 0) {
    proteinBaseKg = profile.weight_kg * (1 - profile.body_fat_pct / 100);
    notes.push(
      `Protein dihitung berdasarkan lean mass (${proteinBaseKg.toFixed(1)} kg) karena BF% diketahui.`,
    );
  }

  const protein_g = Math.round(proteinBaseKg * PROTEIN_G_PER_KG[profile.goal]);
  const fat_g = Math.round(profile.weight_kg * FAT_G_PER_KG[profile.goal]);

  // Calc kcal from protein + fat, remainder is carbs
  const proteinKcal = protein_g * 4;
  const fatKcal = fat_g * 9;
  const carbKcal = target_kcal - proteinKcal - fatKcal;
  let carb_g = Math.round(carbKcal / 4);

  if (carb_g < 50) {
    notes.push(
      `Karbo target ${carb_g}g sangat rendah. Reduce protein atau fat target, atau pilih goal less aggressive.`,
    );
    carb_g = Math.max(carb_g, 30); // hard floor for brain function
  }

  // Fiber: 14g per 1000 kcal (Indonesian RDA roughly 25-30g/day)
  const fiber_g_min = Math.max(25, Math.round((target_kcal / 1000) * 14));

  return {
    bmr,
    tdee,
    target_kcal,
    goal_adjustment_pct: adj * 100,
    protein_g,
    fat_g,
    carb_g,
    fiber_g_min,
    notes,
  };
}

export function formatTargets(t: NutritionTargets): string {
  const lines: string[] = [];
  lines.push(`BMR:        ${t.bmr} kcal`);
  lines.push(`TDEE:       ${t.tdee} kcal`);
  lines.push(
    `Target:     ${t.target_kcal} kcal  (${t.goal_adjustment_pct > 0 ? "+" : ""}${t.goal_adjustment_pct.toFixed(0)}% vs TDEE)`,
  );
  lines.push("");
  lines.push("Macro split per hari:");
  const pKcal = t.protein_g * 4;
  const fKcal = t.fat_g * 9;
  const cKcal = t.carb_g * 4;
  const total = pKcal + fKcal + cKcal;
  const pct = (n: number) => `${((n / total) * 100).toFixed(0)}%`;
  lines.push(
    `  Protein:  ${t.protein_g}g  (${pKcal} kcal, ${pct(pKcal)})`,
  );
  lines.push(`  Lemak:    ${t.fat_g}g  (${fKcal} kcal, ${pct(fKcal)})`);
  lines.push(`  Karbo:    ${t.carb_g}g  (${cKcal} kcal, ${pct(cKcal)})`);
  lines.push(`  Serat:    >= ${t.fiber_g_min}g`);
  if (t.notes.length > 0) {
    lines.push("");
    lines.push("Notes:");
    for (const n of t.notes) lines.push(`  - ${n}`);
  }
  return lines.join("\n");
}
