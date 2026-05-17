/**
 * POST /api/plan — Generate meal plan from user profile.
 *
 * Body: {
 *   profile: UserProfile,           // full onboarding profile
 *   days?: number,                  // default 1, max 7
 *   meals_per_day?: number,         // default 3
 *   dry_run?: boolean,              // default false (skip Claude, return prompt)
 *   pool_per_category?: number,     // default 15
 *   include_olahan?: boolean,       // default false
 * }
 *
 * Returns: { ok: true, plan, pool_size, prices_count, usage } |
 *          { ok: false, error }
 *
 * Requires ANTHROPIC_API_KEY in .env (kecuali dry_run).
 */
import { NextResponse } from "next/server";
import { getDbAsync } from "@/src/db/client";
import { calculateTargets } from "@/src/nutrition/tdee";
import {
  generateMealPlan,
  type MealPlanRequest,
} from "@/src/nutrition/meal-plan";
import type { UserProfile } from "@/lib/profile";

export const runtime = "nodejs"; // better-sqlite3 native module
export const dynamic = "force-dynamic";

interface RequestBody {
  profile: UserProfile;
  days?: number;
  meals_per_day?: number;
  dry_run?: boolean;
  pool_per_category?: number;
  include_olahan?: boolean;
  context_notes?: string;
}

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { profile, days = 1 } = body;

  // Required field check
  if (
    !profile?.age ||
    !profile.sex ||
    !profile.weight_kg ||
    !profile.height_cm ||
    !profile.activity ||
    !profile.goal
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Profile incomplete. Required: age, sex, weight_kg, height_cm, activity, goal.",
      },
      { status: 400 },
    );
  }

  // Calculate targets
  let targets;
  try {
    targets = calculateTargets({
      age: profile.age,
      sex: profile.sex,
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      activity: profile.activity,
      goal: profile.goal,
      body_fat_pct: profile.body_fat_pct,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: `TDEE calc failed: ${(e as Error).message}` },
      { status: 400 },
    );
  }

  // Safety: medical condition overrides
  const medical = profile.medical_conditions ?? [];
  const isPregnant = medical.includes("hamil");
  const isLactating = medical.includes("menyusui");
  if ((isPregnant || isLactating) && targets.target_kcal < targets.tdee) {
    // Force surplus for pregnant/lactating regardless of stated goal
    targets.target_kcal = Math.round(
      targets.tdee + (isPregnant ? 350 : 450),
    );
    targets.goal_adjustment_pct =
      ((targets.target_kcal - targets.tdee) / targets.tdee) * 100;
    targets.notes.push(
      `Karena ${isPregnant ? "hamil" : "menyusui"}, target di-adjust ke surplus ${
        isPregnant ? 350 : 450
      } kcal vs TDEE. WAJIB konsul ${isPregnant ? "SpOG / bidan" : "konselor laktasi / ahli gizi"} sebelum follow plan.`,
    );
  }

  // Build extended profile fields for prompt
  const mealReq: MealPlanRequest = {
    profile: {
      age: profile.age,
      sex: profile.sex,
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      activity: profile.activity,
      goal: profile.goal,
      body_fat_pct: profile.body_fat_pct,
    },
    targets,
    days: Math.min(Math.max(1, days), 7),
    province_id: profile.province_id ?? "national",
    market_type: 1,
    budget_idr_per_day: profile.budget_idr_per_day,
    diet_method: profile.diet_method,
    meals_per_day: body.meals_per_day ?? 3,
    context_notes: body.context_notes,
    preferences: {
      halal: profile.preferences?.halal ?? true,
      vegetarian: profile.preferences?.vegetarian,
      no_pork: profile.preferences?.no_pork,
      no_seafood: profile.preferences?.no_seafood,
      alergi: profile.preferences?.alergi,
    },
    extended: {
      medical_conditions: profile.medical_conditions,
      food_allergies: profile.food_allergies,
      allergies_other: profile.allergies_other,
      underlying_motivation: profile.underlying_motivation,
      readiness_level: profile.readiness_level,
      habit_anchor: profile.habit_anchor,
      pace_preference: profile.pace_preference,
      snack_time: profile.snack_time,
      emotional_triggers: profile.emotional_triggers,
      after_emotional_eating: profile.after_emotional_eating,
      sleep_duration: profile.sleep_duration,
      water_consumption: profile.water_consumption,
      eat_locations: profile.eat_locations,
      current_body_type: profile.current_body_type,
      target_body_type: profile.target_body_type,
      target_zones: profile.target_zones,
      weight_goal_magnitude: profile.weight_goal_magnitude,
      life_events: profile.life_events,
      body_image_satisfaction: profile.body_image_satisfaction,
      special_occasion: profile.special_occasion,
      target_event_date: profile.target_event_date,
    },
  };

  let db;
  let dbPath = "unknown";
  try {
    db = await getDbAsync();
    // Immediate smoke test — surface if query fails right after open
    try {
      const row = db.prepare("SELECT COUNT(*) as n FROM foods").get() as {
        n: number;
      };
      console.log("[/api/plan] DB OK, foods count:", row.n);
    } catch (qe) {
      throw new Error(
        `Query after open failed: ${(qe as Error).message} (path: ${dbPath})`,
      );
    }
  } catch (e) {
    const err = e as Error;
    const msg = err.message;
    const stack = err.stack ?? "";
    console.error("[/api/plan] DB init/smoke failed:", msg, stack);
    return NextResponse.json(
      {
        ok: false,
        error: `DB init: ${msg}`,
        stack: stack.slice(0, 800),
        debug: {
          cwd: process.cwd(),
          vercel_url: process.env.VERCEL_URL ?? null,
          vercel_project_production_url:
            process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null,
          db_path_env: process.env.DB_PATH ?? null,
          err_name: err.name,
        },
      },
      { status: 500 },
    );
  }
  try {
    const result = await generateMealPlan(db, mealReq, {
      dryRun: body.dry_run ?? false,
      poolPerCategory: body.pool_per_category ?? 15,
      // Default true: AI picks cooked/ready foods (Nasi, Ayam goreng) instead
      // of raw ingredients (Beras giling, daging mentah). Caller can override.
      includeOlahan: body.include_olahan ?? true,
    });

    return NextResponse.json({
      ok: true,
      targets,
      plan: result.plan ?? null,
      pool_size: result.pool.length,
      prices_count: result.prices.length,
      usage: result.response?.usage ?? null,
      dry_run: body.dry_run ?? false,
      prompt_preview: body.dry_run
        ? {
            system_chars: result.prompt.system.length,
            context_chars: result.prompt.context.length,
            user_chars: result.prompt.user.length,
            user_full: result.prompt.user,
          }
        : undefined,
    });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json(
      {
        ok: false,
        error: msg,
        hint: msg.includes("ANTHROPIC_API_KEY")
          ? "Set ANTHROPIC_API_KEY di .env, atau pakai dry_run: true buat preview prompt."
          : undefined,
      },
      { status: 500 },
    );
  } finally {
    db.close();
  }
}
