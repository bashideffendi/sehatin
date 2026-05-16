/**
 * POST /api/workout — Generate workout program from user profile.
 *
 * Body: {
 *   profile: UserProfile,           // full onboarding profile
 *   level?: "beginner"|"intermediate"|"advanced", // optional override
 *   goal?: TrainingGoal,            // optional override (otherwise derived)
 *   days_per_week?: number,         // default 3
 *   session_minutes?: number,       // default 45
 *   equipment_available?: Equipment[], // default from profile.equipment_available
 *   split?: SplitType,              // optional
 *   weeks?: number,                 // default 2
 *   injuries_or_limitations?: string[],
 *   dry_run?: boolean,
 * }
 */
import { NextResponse } from "next/server";
import {
  generateWorkout,
  type WorkoutRequest,
} from "@/src/fitness/workout";
import type { Equipment, Level } from "@/src/fitness/exercises";
import type { TrainingGoal, SplitType } from "@/src/fitness/protocols";
import type { UserProfile } from "@/lib/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  profile: UserProfile;
  level?: Level;
  goal?: TrainingGoal;
  days_per_week?: number;
  session_minutes?: number;
  equipment_available?: Equipment[];
  split?: SplitType;
  weeks?: number;
  injuries_or_limitations?: string[];
  context_notes?: string;
  dry_run?: boolean;
}

// Derive training level from user activity
function deriveLevel(profile: UserProfile): Level {
  if (profile.activity === "very_active" || profile.activity === "active") {
    return "intermediate";
  }
  if (profile.activity === "sedentary" || profile.activity === "light") {
    return "beginner";
  }
  return "beginner"; // default safe
}

// Derive goal from profile (TDEE goal → training goal mapping)
function deriveTrainingGoal(profile: UserProfile): TrainingGoal {
  switch (profile.goal) {
    case "fat_loss":
    case "fat_loss_aggressive":
      return "fat_loss_circuit";
    case "muscle_gain":
    case "slow_gain":
      return "hypertrophy";
    case "recomp":
      return "hypertrophy";
    case "maintain":
      return "general_health";
    default:
      return "general_health";
  }
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

  const { profile } = body;
  if (!profile?.sex || !profile.age) {
    return NextResponse.json(
      { ok: false, error: "Profile incomplete (need at least sex + age)." },
      { status: 400 },
    );
  }

  const level = body.level ?? deriveLevel(profile);
  const goal = body.goal ?? deriveTrainingGoal(profile);
  const equipment =
    body.equipment_available ??
    profile.equipment_available ??
    (["bodyweight"] as Equipment[]);

  // Safety: pregnant override (limit intensity)
  const isPregnant = (profile.medical_conditions ?? []).includes("hamil");
  const isLactating = (profile.medical_conditions ?? []).includes("menyusui");
  const safeGoal: TrainingGoal =
    isPregnant || isLactating ? "general_health" : goal;
  const safeLevel: Level = isPregnant ? "beginner" : level;

  const workoutReq: WorkoutRequest = {
    level: safeLevel,
    goal: safeGoal,
    days_per_week: body.days_per_week ?? 3,
    session_minutes: body.session_minutes ?? 45,
    equipment_available: equipment,
    split: body.split,
    weeks: body.weeks ?? 2,
    injuries_or_limitations: body.injuries_or_limitations,
    context_notes: body.context_notes,
    extended: {
      medical_conditions: profile.medical_conditions,
      readiness_level: profile.readiness_level,
      pace_preference: profile.pace_preference,
      habit_anchor: profile.habit_anchor,
      sleep_duration: profile.sleep_duration,
      target_zones: profile.target_zones,
      target_body_type: profile.target_body_type,
      current_body_type: profile.current_body_type,
      underlying_motivation: profile.underlying_motivation,
      weight_goal_magnitude: profile.weight_goal_magnitude,
    },
  };

  try {
    const result = await generateWorkout(workoutReq, {
      dryRun: body.dry_run ?? false,
    });
    return NextResponse.json({
      ok: true,
      level: safeLevel,
      goal: safeGoal,
      split: result.split,
      program: result.program ?? null,
      pool_size: result.pool.length,
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
      safety_overrides: isPregnant
        ? ["Pregnant: forced general_health goal + beginner level. Konsul SpOG dulu."]
        : isLactating
          ? ["Lactating: general_health goal. Watch energy balance."]
          : [],
    });
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json(
      {
        ok: false,
        error: msg,
        hint: msg.includes("ANTHROPIC_API_KEY")
          ? "Set ANTHROPIC_API_KEY di .env, atau pakai dry_run: true."
          : undefined,
      },
      { status: 500 },
    );
  }
}
