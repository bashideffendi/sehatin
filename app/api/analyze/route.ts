/**
 * POST /api/analyze — Foto makanan → kalori + macro + warnings.
 *
 * Body: {
 *   profile?: UserProfile,            // optional, untuk health warnings
 *   image_base64: string,             // base64 data (TANPA "data:" prefix)
 *   image_media_type: "image/jpeg" | "image/png" | "image/webp" | "image/gif",
 *   user_note?: string,
 *   dry_run?: boolean,
 *   pool_per_category?: number,       // default 20
 *   include_olahan?: boolean,         // default true
 * }
 */
import { NextResponse } from "next/server";
import { getDbAsync } from "@/src/db/client";
import { analyzePhoto } from "@/src/nutrition/analyze";
import { calculateTargets } from "@/src/nutrition/tdee";
import type { UserProfile } from "@/lib/profile";
import type { ImageMediaType } from "@/src/ai/vision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  profile?: UserProfile;
  image_base64: string;
  image_media_type: ImageMediaType;
  user_note?: string;
  dry_run?: boolean;
  pool_per_category?: number;
  include_olahan?: boolean;
}

// Limit base64 size: 5 MB raw → ~6.7 MB base64. Cap di 8 MB body.
const MAX_BASE64_BYTES = 8 * 1024 * 1024;

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

  if (!body.image_base64 || !body.image_media_type) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Required: image_base64 (string), image_media_type (image/jpeg|png|webp|gif)",
      },
      { status: 400 },
    );
  }
  if (body.image_base64.length > MAX_BASE64_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `Image base64 terlalu besar (${body.image_base64.length} chars). Max ${MAX_BASE64_BYTES}.`,
      },
      { status: 413 },
    );
  }

  // Compute optional target kcal from profile
  let dailyTargetKcal: number | undefined;
  if (
    body.profile?.age &&
    body.profile.sex &&
    body.profile.weight_kg &&
    body.profile.height_cm &&
    body.profile.activity &&
    body.profile.goal
  ) {
    try {
      const t = calculateTargets({
        age: body.profile.age,
        sex: body.profile.sex,
        weight_kg: body.profile.weight_kg,
        height_cm: body.profile.height_cm,
        activity: body.profile.activity,
        goal: body.profile.goal,
      });
      dailyTargetKcal = t.target_kcal;
    } catch {
      /* ignore */
    }
  }

  const db = await getDbAsync();
  try {
    const result = await analyzePhoto(
      db,
      { base64: body.image_base64, mediaType: body.image_media_type },
      {
        dryRun: body.dry_run ?? false,
        poolPerCategory: body.pool_per_category ?? 20,
        includeOlahan: body.include_olahan ?? true,
        userNote: body.user_note,
        extended: body.profile
          ? {
              medical_conditions: body.profile.medical_conditions,
              food_allergies: body.profile.food_allergies,
              diet_method: body.profile.diet_method,
              daily_target_kcal: dailyTargetKcal,
            }
          : undefined,
      },
    );

    return NextResponse.json({
      ok: true,
      analysis: result.analysis ?? null,
      image: result.image,
      pool_size: result.pool.length,
      usage: result.response?.usage ?? null,
      dry_run: body.dry_run ?? false,
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
  } finally {
    db.close();
  }
}
