/**
 * Demo data loader — populates localStorage with realistic dummy data
 * that matches the design screenshots (Bashid Effendi persona).
 *
 * Use case: reviewer/demo mode without going through onboarding + plan generation.
 */
import { saveProfile, PROFILE_KEY, type UserProfile } from "./profile";
import {
  addEntry,
  todayISO,
  type FoodLogEntry,
  type MealSlot,
} from "./food-log";
import { addWeight } from "./weight-log";
import {
  saveMealPlan,
  type StoredMealPlan,
  type MealItem,
} from "./meal-plan";
import {
  saveWorkoutPlan,
  type StoredWorkoutPlan,
} from "./workout";
import { upsertSession } from "./workout-log";

/** Pad 2-digit. */
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Shift YYYY-MM-DD by N days (negative = earlier).
 * TZ-safe: operates on local date components, no UTC conversion.
 */
function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
}

/** Build ISO timestamp for today at HH:MM (local TZ). */
function todayAt(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Build ISO timestamp N days ago at HH:MM (local TZ). */
function pastDayAt(daysAgo: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ============================================================
// PROFILE — Bashid Effendi per settings-desktop.png
// ============================================================
const DEMO_PROFILE: UserProfile = {
  v: 2,
  name: "Bashid Effendi",
  sex: "m",
  age: 28,
  age_bracket: "25-34",
  weight_kg: 74.5,
  height_cm: 172,
  target_weight_kg: 68.0,
  current_body_type: "berisi",
  target_body_type: "athletic",
  target_zones: ["perut"],
  weight_goal_magnitude: "lose_1_10",
  goal: "fat_loss",
  main_motivation: "heart_health",
  body_image_satisfaction: "1_2y",
  activity: "light",
  sleep_duration: "7_8",
  water_consumption: "7_10_glass",
  eat_locations: ["kantor_kantin", "warung_warteg", "masak_rumah"],
  diet_method: "mediterranean",
  preferences: {
    halal: true,
    no_pork: true,
    no_seafood: false,
    vegetarian: false,
  },
  food_allergies: ["kacang_tanah", "seafood_kerang"],
  allergies_other: "Udang",
  medical_conditions: ["hipertensi"],
  budget_idr_per_day: 48000,
  province_id: "national",
  equipment_available: ["dumbbell", "bodyweight"],
  active_modes: ["kondangan_recovery", "cheat_day"],
  pace_preference: "slow_steady",
  readiness_level: "motivated_need_support",
  underlying_motivation: "improve_health",
  habit_anchor: "track_food_consistently",
  completed_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ============================================================
// FOOD LOG — today's entries match log-desktop.png
// ============================================================
interface DemoFoodEntry {
  meal_slot: MealSlot;
  hour: number;
  minute: number;
  food_name: string;
  portion_g: number;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  source: FoodLogEntry["source"];
  notes?: string;
  food_code?: string;
}

const TODAY_FOOD_ENTRIES: DemoFoodEntry[] = [
  {
    meal_slot: "sarapan",
    hour: 6,
    minute: 45,
    food_name: "Bubur Manado",
    portion_g: 350,
    kcal: 320,
    protein_g: 18,
    fat_g: 4,
    carb_g: 52,
    source: "manual",
    notes: "1 mangkok",
    food_code: "demo-bubur-manado",
  },
  {
    meal_slot: "snack",
    hour: 10,
    minute: 12,
    food_name: "Pisang Ambon",
    portion_g: 240,
    kcal: 180,
    protein_g: 6,
    fat_g: 8,
    carb_g: 25,
    source: "search",
    notes: "2 buah",
    food_code: "demo-pisang-ambon",
  },
  {
    meal_slot: "makan_siang",
    hour: 12,
    minute: 36,
    food_name: "Soto Betawi",
    portion_g: 400,
    kcal: 520,
    protein_g: 32,
    fat_g: 26,
    carb_g: 38,
    source: "photo",
    notes: "1 mangkok · AI foto",
    food_code: "demo-soto-betawi",
  },
  {
    meal_slot: "snack",
    hour: 15,
    minute: 20,
    food_name: "Tahu isi + teh tawar",
    portion_g: 150,
    kcal: 220,
    protein_g: 10,
    fat_g: 12,
    carb_g: 18,
    source: "search",
    notes: "resep warteg",
    food_code: "demo-tahu-isi",
  },
];

// ============================================================
// PAST 13 DAYS FOOD LOG — for weekly chart + streak (14 hari)
// ============================================================
const PAST_WEEK_DAILY_KCAL: { daysAgo: number; kcal: number }[] = [
  { daysAgo: 1, kcal: 1990 },
  { daysAgo: 2, kcal: 1850 },
  { daysAgo: 3, kcal: 1680 },
  { daysAgo: 4, kcal: 2350 },
  { daysAgo: 5, kcal: 1920 },
  { daysAgo: 6, kcal: 2080 },
  { daysAgo: 7, kcal: 1840 },
  { daysAgo: 8, kcal: 1950 },
  { daysAgo: 9, kcal: 2120 },
  { daysAgo: 10, kcal: 1880 },
  { daysAgo: 11, kcal: 1990 },
  { daysAgo: 12, kcal: 1740 },
  { daysAgo: 13, kcal: 2050 },
];

// ============================================================
// WEIGHT LOG — 30 days history, showing -1.7 kg trend
// ============================================================
function buildWeightHistory(): Array<{ daysAgo: number; weight_kg: number }> {
  // Start at 76.2 a week ago, gradually decrease to 74.5 today
  // 30 days back: ~77.5kg; today 74.5kg
  const today = 74.5;
  const startMonthAgo = 77.5;
  const totalDays = 30;
  const out: Array<{ daysAgo: number; weight_kg: number }> = [];
  // Generate ~10 weigh-ins over 30 days
  const checkpoints = [0, 1, 3, 5, 7, 10, 14, 18, 22, 26, 30];
  for (const daysAgo of checkpoints) {
    const t = daysAgo / totalDays;
    const w = today + (startMonthAgo - today) * t;
    // Add small noise
    const noise = (Math.sin(daysAgo * 0.7) * 0.15);
    out.push({
      daysAgo,
      weight_kg: Math.round((w + noise) * 10) / 10,
    });
  }
  return out;
}

// ============================================================
// MEAL PLAN — 7 days × 5 meals, mediterranean + warteg
// ============================================================
function buildDemoMealPlan(): StoredMealPlan {
  // Templates for variety across the week
  const sarapanOptions = [
    {
      food_name: "Bubur Manado",
      portion_g: 350,
      kcal: 320,
      protein_g: 18,
      fat_g: 4,
      carb_g: 52,
    },
    {
      food_name: "Oatmeal + pisang + madu",
      portion_g: 280,
      kcal: 340,
      protein_g: 12,
      fat_g: 6,
      carb_g: 60,
    },
    {
      food_name: "Roti gandum + telur rebus + alpukat",
      portion_g: 200,
      kcal: 380,
      protein_g: 22,
      fat_g: 18,
      carb_g: 32,
    },
  ];

  const snackOptions = [
    {
      food_name: "Pisang Ambon + selai kacang",
      portion_g: 240,
      kcal: 180,
      protein_g: 6,
      fat_g: 8,
      carb_g: 25,
    },
    {
      food_name: "Yogurt plain + buah",
      portion_g: 200,
      kcal: 150,
      protein_g: 10,
      fat_g: 4,
      carb_g: 20,
    },
    {
      food_name: "Almond + apel",
      portion_g: 180,
      kcal: 220,
      protein_g: 8,
      fat_g: 14,
      carb_g: 18,
    },
  ];

  const makanSiangOptions = [
    {
      food_name: "Soto Betawi",
      portion_g: 400,
      kcal: 520,
      protein_g: 32,
      fat_g: 26,
      carb_g: 38,
    },
    {
      food_name: "Ayam panggang + nasi merah + sayur",
      portion_g: 450,
      kcal: 580,
      protein_g: 42,
      fat_g: 16,
      carb_g: 65,
    },
    {
      food_name: "Ikan kembung bakar + nasi + tumis kangkung",
      portion_g: 420,
      kcal: 540,
      protein_g: 38,
      fat_g: 18,
      carb_g: 58,
    },
  ];

  const snackSiangOptions = [
    {
      food_name: "Tahu isi + teh tawar",
      portion_g: 150,
      kcal: 220,
      protein_g: 10,
      fat_g: 12,
      carb_g: 18,
    },
    {
      food_name: "Singkong rebus + kopi tubruk",
      portion_g: 200,
      kcal: 190,
      protein_g: 3,
      fat_g: 1,
      carb_g: 42,
    },
  ];

  const makanMalamOptions = [
    {
      food_name: "Pepes ikan kembung + nasi",
      portion_g: 350,
      kcal: 580,
      protein_g: 38,
      fat_g: 16,
      carb_g: 62,
    },
    {
      food_name: "Ayam suwir + brown rice + sayur asem",
      portion_g: 380,
      kcal: 550,
      protein_g: 40,
      fat_g: 14,
      carb_g: 60,
    },
    {
      food_name: "Tahu tempe goreng + sayur sop + nasi",
      portion_g: 360,
      kcal: 520,
      protein_g: 28,
      fat_g: 18,
      carb_g: 58,
    },
  ];

  const days = Array.from({ length: 7 }).map((_, dayIdx) => {
    const sarapan = sarapanOptions[dayIdx % sarapanOptions.length];
    const snackPagi = snackOptions[dayIdx % snackOptions.length];
    const makanSiang = makanSiangOptions[dayIdx % makanSiangOptions.length];
    const snackSiang = snackSiangOptions[dayIdx % snackSiangOptions.length];
    const makanMalam = makanMalamOptions[dayIdx % makanMalamOptions.length];

    const meals = [
      {
        slot: "sarapan",
        items: [
          { food_code: `demo-${dayIdx}-sarapan`, ...sarapan },
        ] as MealItem[],
        total_kcal: sarapan.kcal,
        total_protein_g: sarapan.protein_g,
      },
      {
        slot: "snack",
        items: [
          { food_code: `demo-${dayIdx}-snack-pagi`, ...snackPagi },
        ] as MealItem[],
        total_kcal: snackPagi.kcal,
        total_protein_g: snackPagi.protein_g,
      },
      {
        slot: "makan siang",
        items: [
          { food_code: `demo-${dayIdx}-siang`, ...makanSiang },
        ] as MealItem[],
        total_kcal: makanSiang.kcal,
        total_protein_g: makanSiang.protein_g,
      },
      {
        slot: "snack",
        items: [
          { food_code: `demo-${dayIdx}-snack-siang`, ...snackSiang },
        ] as MealItem[],
        total_kcal: snackSiang.kcal,
        total_protein_g: snackSiang.protein_g,
      },
      {
        slot: "makan malam",
        items: [
          { food_code: `demo-${dayIdx}-malam`, ...makanMalam },
        ] as MealItem[],
        total_kcal: makanMalam.kcal,
        total_protein_g: makanMalam.protein_g,
      },
    ];

    const total_kcal = meals.reduce((s, m) => s + m.total_kcal, 0);
    const total_protein_g = Math.round(
      meals.reduce((s, m) => s + m.total_protein_g, 0),
    );
    const total_fat_g = Math.round(
      meals.reduce((s, m) => s + m.items.reduce((ss, i) => ss + i.fat_g, 0), 0),
    );
    const total_carb_g = Math.round(
      meals.reduce(
        (s, m) => s + m.items.reduce((ss, i) => ss + i.carb_g, 0),
        0,
      ),
    );

    return {
      day: dayIdx + 1,
      meals,
      total_kcal,
      total_protein_g,
      total_fat_g,
      total_carb_g,
      est_cost_idr: 48000 + ((dayIdx % 3) - 1) * 5000,
    };
  });

  const shopping_list = [
    { item: "Ikan kembung", total_g_or_unit: "500g", est_price_idr: 35000 },
    { item: "Tahu putih", total_g_or_unit: "1 papan", est_price_idr: 12000 },
    { item: "Kangkung", total_g_or_unit: "1 ikat", est_price_idr: 6000 },
    { item: "Daging sapi", total_g_or_unit: "200g", est_price_idr: 38000 },
    { item: "Tempe", total_g_or_unit: "2 papan", est_price_idr: 14000 },
    { item: "Telur ayam", total_g_or_unit: "10 butir", est_price_idr: 22000 },
    { item: "Beras merah", total_g_or_unit: "1 kg", est_price_idr: 18000 },
    { item: "Pisang Ambon", total_g_or_unit: "1 sisir", est_price_idr: 25000 },
    { item: "Apel Malang", total_g_or_unit: "1 kg", est_price_idr: 32000 },
    { item: "Almond", total_g_or_unit: "200g", est_price_idr: 45000 },
    { item: "Singkong", total_g_or_unit: "1 kg", est_price_idr: 8000 },
    { item: "Sayur asem (pack)", total_g_or_unit: "1 pack", est_price_idr: 8000 },
    { item: "Bumbu pepes", total_g_or_unit: "1 pack", est_price_idr: 9000 },
    { item: "Ayam fillet", total_g_or_unit: "500g", est_price_idr: 42000 },
    { item: "Oat instant", total_g_or_unit: "500g", est_price_idr: 28000 },
    { item: "Yogurt plain", total_g_or_unit: "500g", est_price_idr: 24000 },
    { item: "Roti gandum", total_g_or_unit: "1 loaf", est_price_idr: 22000 },
    { item: "Selai kacang", total_g_or_unit: "1 botol", est_price_idr: 32000 },
    { item: "Alpukat", total_g_or_unit: "3 buah", est_price_idr: 18000 },
    { item: "Madu", total_g_or_unit: "1 botol", est_price_idr: 38000 },
    { item: "Kopi tubruk", total_g_or_unit: "250g", est_price_idr: 22000 },
    { item: "Teh celup", total_g_or_unit: "1 pack", est_price_idr: 12000 },
    { item: "Bumbu soto", total_g_or_unit: "1 pack", est_price_idr: 8000 },
  ];

  return {
    id: "demo-meal-plan",
    generated_at: new Date().toISOString(),
    start_date: todayISO(),
    days: 7,
    diet_method: "mediterranean",
    budget_idr_per_day: 48000,
    context_notes: "Demo plan — Mediterranean + warteg",
    targets: {
      bmr: 1690,
      tdee: 2330,
      target_kcal: 2150,
      goal_adjustment_pct: -0.08,
      protein_g: 140,
      fat_g: 60,
      carb_g: 240,
      fiber_g_min: 38,
      notes: [
        "Defisit ringan ~330 kcal — pas untuk -0.5 kg/minggu sustainable.",
        "Protein 1.9g/kg untuk preserve otot di fase fat loss.",
      ],
    },
    plan: {
      days,
      shopping_list,
      summary: {
        avg_kcal: Math.round(
          days.reduce((s, d) => s + d.total_kcal, 0) / days.length,
        ),
        avg_protein_g: Math.round(
          days.reduce((s, d) => s + d.total_protein_g, 0) / days.length,
        ),
        avg_cost_idr: 48000,
        notes: [
          "Mediterranean style + warteg-friendly. Halal default, hindari kacang tanah & seafood.",
          "Defisit ringan ~330 kcal dari TDEE — match target -0.5 kg/minggu.",
          "Profil hipertensi — sodium dibatasi, hindari makanan ultra-processed.",
        ],
      },
    },
  };
}

// ============================================================
// WORKOUT PLAN — 4 weeks × 4 days/week hypertrophy upper/lower
// ============================================================
function buildDemoWorkoutPlan(): StoredWorkoutPlan {
  const upperPushExercises = [
    {
      exercise_code: "db_bench_press",
      exercise_name: "Dumbbell Bench Press",
      sets: 4,
      reps: "8-12",
      rest_seconds: 90,
      rpe_target: "7-8",
    },
    {
      exercise_code: "db_shoulder_press",
      exercise_name: "Dumbbell Shoulder Press",
      sets: 4,
      reps: "8-12",
      rest_seconds: 90,
      rpe_target: "7-8",
    },
    {
      exercise_code: "incline_db_press",
      exercise_name: "Incline DB Press",
      sets: 3,
      reps: "10-12",
      rest_seconds: 75,
      rpe_target: "7-8",
    },
    {
      exercise_code: "lateral_raise",
      exercise_name: "Lateral Raise",
      sets: 3,
      reps: "12-15",
      rest_seconds: 60,
      rpe_target: "8",
    },
    {
      exercise_code: "triceps_dip",
      exercise_name: "Triceps Dip (chair)",
      sets: 3,
      reps: "AMRAP",
      rest_seconds: 60,
      rpe_target: "8-9",
    },
    {
      exercise_code: "pike_pushup",
      exercise_name: "Pike Push-up",
      sets: 3,
      reps: "10-12",
      rest_seconds: 60,
      rpe_target: "8",
    },
  ];

  const upperPullExercises = [
    {
      exercise_code: "db_row",
      exercise_name: "Dumbbell Row",
      sets: 4,
      reps: "8-12",
      rest_seconds: 90,
      rpe_target: "7-8",
    },
    {
      exercise_code: "pullup",
      exercise_name: "Pull-up / Inverted Row",
      sets: 4,
      reps: "AMRAP",
      rest_seconds: 90,
      rpe_target: "8-9",
    },
    {
      exercise_code: "db_curl",
      exercise_name: "Dumbbell Bicep Curl",
      sets: 3,
      reps: "10-12",
      rest_seconds: 60,
      rpe_target: "8",
    },
    {
      exercise_code: "rear_delt_fly",
      exercise_name: "Rear Delt Fly",
      sets: 3,
      reps: "12-15",
      rest_seconds: 60,
      rpe_target: "8",
    },
    {
      exercise_code: "face_pull_band",
      exercise_name: "Face Pull (band)",
      sets: 3,
      reps: "15",
      rest_seconds: 45,
      rpe_target: "7",
    },
  ];

  const lowerQuadsExercises = [
    {
      exercise_code: "goblet_squat",
      exercise_name: "Goblet Squat",
      sets: 4,
      reps: "10-12",
      rest_seconds: 90,
      rpe_target: "7-8",
    },
    {
      exercise_code: "db_lunge",
      exercise_name: "DB Walking Lunge",
      sets: 3,
      reps: "12 / side",
      rest_seconds: 75,
      rpe_target: "8",
    },
    {
      exercise_code: "bulgarian_split",
      exercise_name: "Bulgarian Split Squat",
      sets: 3,
      reps: "10 / side",
      rest_seconds: 75,
      rpe_target: "8",
    },
    {
      exercise_code: "calf_raise",
      exercise_name: "Standing Calf Raise",
      sets: 3,
      reps: "15-20",
      rest_seconds: 45,
      rpe_target: "8",
    },
    {
      exercise_code: "wall_sit",
      exercise_name: "Wall Sit",
      sets: 3,
      reps: "45s",
      rest_seconds: 60,
      rpe_target: "8",
    },
  ];

  const lowerPosteriorExercises = [
    {
      exercise_code: "db_rdl",
      exercise_name: "DB Romanian Deadlift",
      sets: 4,
      reps: "8-12",
      rest_seconds: 90,
      rpe_target: "7-8",
    },
    {
      exercise_code: "hip_thrust",
      exercise_name: "Hip Thrust (bodyweight)",
      sets: 3,
      reps: "12-15",
      rest_seconds: 60,
      rpe_target: "8",
    },
    {
      exercise_code: "single_leg_rdl",
      exercise_name: "Single Leg RDL",
      sets: 3,
      reps: "10 / side",
      rest_seconds: 60,
      rpe_target: "8",
    },
    {
      exercise_code: "glute_bridge",
      exercise_name: "Glute Bridge",
      sets: 3,
      reps: "15",
      rest_seconds: 45,
      rpe_target: "7-8",
    },
    {
      exercise_code: "back_extension",
      exercise_name: "Back Extension",
      sets: 3,
      reps: "12-15",
      rest_seconds: 45,
      rpe_target: "8",
    },
  ];

  const warmup = [
    {
      exercise_code: "arm_circles",
      exercise_name: "Arm circles",
      sets: 1,
      reps: "30s",
      rest_seconds: 0,
    },
    {
      exercise_code: "leg_swings",
      exercise_name: "Leg swings",
      sets: 1,
      reps: "10 / side",
      rest_seconds: 0,
    },
    {
      exercise_code: "cat_cow",
      exercise_name: "Cat-cow",
      sets: 1,
      reps: "8",
      rest_seconds: 0,
    },
  ];

  const cooldown = [
    {
      exercise_code: "child_pose",
      exercise_name: "Child pose",
      sets: 1,
      reps: "30s",
      rest_seconds: 0,
    },
    {
      exercise_code: "hamstring_stretch",
      exercise_name: "Hamstring stretch",
      sets: 1,
      reps: "30s / side",
      rest_seconds: 0,
    },
  ];

  function makeWeek(weekNum: number, isDeload: boolean) {
    const setMultiplier = isDeload ? 0.6 : 1;
    function scaleSets<T extends { sets: number }>(arr: T[]): T[] {
      return arr.map((e) => ({
        ...e,
        sets: Math.max(2, Math.round(e.sets * setMultiplier)),
      }));
    }
    return {
      week: weekNum,
      sessions: [
        {
          day_label: "Senin (Upper Push)",
          focus: "upper push",
          duration_estimate_min: 45,
          warmup,
          main: scaleSets(upperPushExercises),
          cooldown,
          notes: isDeload
            ? "Deload week — turunkan volume 40%, fokus form recovery."
            : undefined,
        },
        {
          day_label: "Selasa (Lower Quads)",
          focus: "lower quads",
          duration_estimate_min: 45,
          warmup,
          main: scaleSets(lowerQuadsExercises),
          cooldown,
          notes: isDeload ? "Deload — angka turun, gerakan tetap." : undefined,
        },
        {
          day_label: "Kamis (Upper Pull)",
          focus: "upper pull",
          duration_estimate_min: 45,
          warmup,
          main: scaleSets(upperPullExercises),
          cooldown,
          notes: isDeload ? "Deload week." : undefined,
        },
        {
          day_label: "Sabtu (Lower Posterior)",
          focus: "lower posterior",
          duration_estimate_min: 45,
          warmup,
          main: scaleSets(lowerPosteriorExercises),
          cooldown,
          notes: isDeload ? "Deload week." : undefined,
        },
      ],
      progression_note:
        weekNum === 1
          ? "Baseline week — set weight pakai RPE 7, simpan 2-3 reps in reserve."
          : weekNum === 2
            ? "Naik 2.5kg dari minggu 1 di main compounds (Bench, Row, Squat, RDL)."
            : weekNum === 3
              ? "Naik volume 5% — tambah 1 set per exercise di main compounds."
              : "Deload week — kurangi volume 40%, jaga teknik.",
    };
  }

  const program = {
    weeks: [
      makeWeek(1, false),
      makeWeek(2, false),
      makeWeek(3, false),
      makeWeek(4, true),
    ],
    summary: {
      split: "upper_lower" as const,
      sessions_per_week: 4,
      estimated_duration_per_session: 45,
      progression_strategy: "Linear progression + weekly micro-overload",
      notes: [
        "Program 4-minggu hypertrophy upper/lower, 4 sesi/minggu.",
        "Equipment: dumbbell 5/12/14kg, bodyweight, resistance band.",
        "Week 4 = deload — kurangi volume 40%, jaga teknik sebelum mesocycle baru.",
      ],
    },
  };

  return {
    id: "demo-workout-plan",
    generated_at: new Date().toISOString(),
    start_date: shiftDate(todayISO(), -10),
    level: "intermediate",
    goal: "hypertrophy",
    split: "upper_lower",
    days_per_week: 4,
    session_minutes: 45,
    weeks: 4,
    context_notes: "Demo — Bashid Effendi · home gym (dumbbell)",
    injuries_or_limitations: [],
    program,
  };
}

// ============================================================
// MAIN: loadDemoData()
// ============================================================
export function loadDemoData(): void {
  if (typeof window === "undefined") return;

  // ===== Clear first (fresh slate) =====
  clearAllSehatinData();

  // ===== Profile =====
  saveProfile(DEMO_PROFILE);

  // ===== Weight log =====
  const weightHistory = buildWeightHistory();
  for (const w of weightHistory) {
    addWeight({
      date: shiftDate(todayISO(), -w.daysAgo),
      weight_kg: w.weight_kg,
    });
  }

  // ===== Food log: today's entries =====
  for (const e of TODAY_FOOD_ENTRIES) {
    addEntryAtTime({
      ...e,
      date: todayISO(),
      created_at: todayAt(e.hour, e.minute),
    });
  }

  // ===== Food log: past 6 days — one combined entry per day for chart =====
  for (const d of PAST_WEEK_DAILY_KCAL) {
    addEntryAtTime({
      date: shiftDate(todayISO(), -d.daysAgo),
      created_at: pastDayAt(d.daysAgo, 13, 0),
      meal_slot: "makan_siang",
      food_name: "Plan harian (gabungan)",
      portion_g: 400,
      kcal: d.kcal,
      protein_g: Math.round(d.kcal * 0.18 / 4),
      fat_g: Math.round(d.kcal * 0.3 / 9),
      carb_g: Math.round(d.kcal * 0.52 / 4),
      source: "plan" as const,
      notes: "demo backfill",
      food_code: `demo-day-${d.daysAgo}`,
    });
  }

  // ===== Meal plan =====
  const mealPlan = buildDemoMealPlan();
  saveMealPlan({
    start_date: mealPlan.start_date,
    days: mealPlan.days,
    diet_method: mealPlan.diet_method,
    budget_idr_per_day: mealPlan.budget_idr_per_day,
    context_notes: mealPlan.context_notes,
    targets: mealPlan.targets,
    plan: mealPlan.plan,
  });

  // ===== Workout plan =====
  const workoutPlan = buildDemoWorkoutPlan();
  const savedWorkout = saveWorkoutPlan({
    start_date: workoutPlan.start_date,
    level: workoutPlan.level,
    goal: workoutPlan.goal,
    split: workoutPlan.split,
    days_per_week: workoutPlan.days_per_week,
    session_minutes: workoutPlan.session_minutes,
    weeks: workoutPlan.weeks,
    context_notes: workoutPlan.context_notes,
    injuries_or_limitations: workoutPlan.injuries_or_limitations,
    program: workoutPlan.program,
  });

  // ===== Workout log: mark 4 sessions in weeks 1-2 as done =====
  const sessionsToLog = [
    { week: 0, session: 0, daysAgo: 10 }, // Week 1 Sen
    { week: 0, session: 1, daysAgo: 9 }, // Week 1 Sel
    { week: 0, session: 2, daysAgo: 7 }, // Week 1 Kam
    { week: 0, session: 3, daysAgo: 5 }, // Week 1 Sab
  ];
  for (const s of sessionsToLog) {
    const sessionData = savedWorkout.program.weeks[s.week].sessions[s.session];
    upsertSession({
      date: shiftDate(todayISO(), -s.daysAgo),
      plan_id: savedWorkout.id,
      week_idx: s.week,
      session_idx: s.session,
      day_label: sessionData.day_label,
      focus: sessionData.focus,
      exercises: sessionData.main.map((ex) => ({
        exercise_code: ex.exercise_code,
        exercise_name: ex.exercise_name,
        completed: true,
      })),
      duration_min: 45,
    });
  }
}

/** Internal: addEntry but with explicit created_at for time-of-day control. */
function addEntryAtTime(
  partial: Omit<FoodLogEntry, "id"> & { created_at: string },
): void {
  if (typeof window === "undefined") return;
  const KEY = "sehatin:food_log:v1";
  const raw = window.localStorage.getItem(KEY);
  const all: FoodLogEntry[] = raw ? (JSON.parse(raw) as FoodLogEntry[]) : [];
  const entry: FoodLogEntry = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    ...partial,
  };
  all.push(entry);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

/**
 * Clear all Sehatin data — useful to reset before reloading demo or for testing.
 */
export function clearAllSehatinData(): void {
  if (typeof window === "undefined") return;
  const KEYS = [
    PROFILE_KEY,
    "sehatin:food_log:v1",
    "sehatin:weight_log:v1",
    "sehatin:meal_plan:v1",
    "sehatin:workout_plan:v1",
    "sehatin:workout_log:v1",
  ];
  for (const k of KEYS) {
    window.localStorage.removeItem(k);
  }
}

/** Returns true if demo profile (or any profile) is loaded. */
export function isDemoLoaded(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return false;
  try {
    const p = JSON.parse(raw) as UserProfile;
    return p.name === "Bashid Effendi";
  } catch {
    return false;
  }
}
