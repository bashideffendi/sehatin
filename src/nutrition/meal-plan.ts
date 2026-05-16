/**
 * Meal plan generator — RAG over TKPI foods + PIHPS prices, Claude composes.
 *
 * Pattern:
 *  1. Deterministic rules engine builds context (targets, food pool, price data)
 *  2. Claude composes day-by-day plan as structured JSON
 *  3. Validator checks total kcal/macro in range, retries with adjustment if off
 */
import type Database from "better-sqlite3";
import { callJson, type ClaudeResponse } from "../ai/claude.ts";
import {
  applyDietPresetMacros,
  getDietPreset,
  type DietMethod,
  type DietPreset,
} from "./diet-methods.ts";
import { buildMealPool, getPricesForRegion, type CompactFood, type CompactPrice } from "./foods.ts";
import { formatTargets, type NutritionTargets, type UserProfile } from "./tdee.ts";

// Extended profile fields consumed dari onboarding wizard
// (subset dari lib/profile.ts UserProfile)
export interface ExtendedProfileFields {
  // Medical safety (CRITICAL — beberapa kondisi override aggressive targets)
  medical_conditions?: string[]; // "hamil" / "menyusui" / "diabetes_tipe2" / "hipertensi" / "asam_urat_gout" / "ginjal_kronik" / "ibs_lambung" / dll
  food_allergies?: string[]; // "kacang_tanah" / "susu_laktosa" / "gluten" / dll — hard exclude
  allergies_other?: string;
  // Personalization
  underlying_motivation?: string; // tone
  readiness_level?: string; // pacing
  habit_anchor?: string; // emphasize 1 habit
  pace_preference?: string; // fast / slow / in_between
  snack_time?: string; // morning / afternoon / evening / late_night / rarely_snack
  // Eating psychology
  emotional_triggers?: string[];
  after_emotional_eating?: string;
  // Lifestyle
  sleep_duration?: string; // recovery factor
  water_consumption?: string;
  eat_locations?: string[]; // masak_rumah / warung_warteg / kantor_kantin / resto / delivery_gofood
  // Body
  current_body_type?: string;
  target_body_type?: string;
  target_zones?: string[];
  weight_goal_magnitude?: string;
  // Context
  life_events?: string[];
  body_image_satisfaction?: string;
  special_occasion?: string;
  target_event_date?: string;
}

export interface MealPlanRequest {
  profile: UserProfile;
  targets: NutritionTargets;
  days: number; // 1-7
  province_id: number | "national"; // PIHPS provinsi atau nasional avg
  market_type?: 1 | 2; // 1=Tradisional (default), 2=Modern
  budget_idr_per_day?: number; // optional budget cap
  diet_method?: DietMethod; // 'standard' default; keto/low_carb/mediterranean/dll
  preferences?: {
    halal?: boolean; // default true (Indonesia majority)
    vegetarian?: boolean;
    no_pork?: boolean;
    no_seafood?: boolean;
    alergi?: string[]; // free-text allergies
    avoid_kategori?: string[]; // e.g. ['Konfeksioneri']
  };
  meals_per_day?: number; // default 3 (breakfast, lunch, dinner)
  context_notes?: string; // e.g. "Hari Senin puasa Ramadan"
  // Extended fields from full onboarding profile
  extended?: ExtendedProfileFields;
}

export interface MealItem {
  food_code: string;
  food_name: string;
  portion_g: number;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
}

export interface Meal {
  slot: string; // "sarapan", "makan siang", "makan malam", "snack"
  items: MealItem[];
  total_kcal: number;
  total_protein_g: number;
  notes?: string;
}

export interface DayPlan {
  day: number;
  meals: Meal[];
  total_kcal: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carb_g: number;
  est_cost_idr?: number;
}

export interface MealPlan {
  days: DayPlan[];
  shopping_list: Array<{
    item: string;
    total_g_or_unit: string;
    est_price_idr?: number;
  }>;
  summary: {
    avg_kcal: number;
    avg_protein_g: number;
    avg_cost_idr?: number;
    notes: string[];
  };
}

const SYSTEM_PROMPT = `Kamu adalah ahli gizi & meal planner Indonesia. Tugas: compose rencana makan realistic pakai HANYA bahan dari database TKPI yang diberikan, sesuai target kalori/macro user, budget kalau ada, dan kondisi medis + alergi user (PRIORITAS UTAMA SAFETY).

Output WAJIB JSON valid, tanpa markdown fence, tanpa komentar.

ATURAN UMUM:
1. PORSI: gunakan gram realistic (nasi 100-200g, sayur 75-150g, lauk protein 80-150g, buah 100-150g).
2. KCAL & MACRO: hitung pakai data per 100g dari pool × (porsi/100). Total per hari harus dalam ±10% dari target.
3. VARIETY: jangan ulang lauk utama 2 hari berurutan. Sayuran boleh.
4. BUDGET: kalau ada budget_idr_per_day, estimasi pakai data harga PIHPS yang disediakan (kg-level). Bahan dengan kategori tidak ada di PIHPS → estimasi konservatif (~Rp 5000-15000/porsi standar).
5. KATEGORI realistic: sarapan ringan (200-400 kcal), makan siang utama (500-800 kcal), makan malam (400-700 kcal). Snack opsional kalau target tinggi.
6. CULTURAL: makanan Indonesia normal — nasi sebagai sumber karbo default kecuali user minta beda. Susu/yoghurt minimal, kebanyakan tidak biasa di pagi.

🚨 SAFETY (NON-NEGOTIABLE — kalau ada conflict dengan target user, prioritas safety):
- HAMIL / MENYUSUI: TIDAK BOLEH defisit kalori. Surplus +300-450 kcal vs maintenance. Protein 1.1g/kg + folat tinggi (sayur hijau, kacang). Hindari ikan tinggi merkuri (tuna besar, hiu). Tambah note disclaimer wajib konsul SpOG/bidan.
- DIABETES TIPE 1/2: low-GI karbo (ubi, beras merah, oat). Hindari nasi putih sendirian, gula tambah, jus buah. Distribute karbo merata. Tambah note: monitor gula darah harian.
- HIPERTENSI: max natrium 1500 mg/hari. EXCLUDE: ikan asin, telur asin, abon, kecap berlebihan, mi instan, snack asin. Emphasize sayur K-rich (bayam, alpukat).
- KOLESTEROL TINGGI: limit lemak jenuh < 7% kcal. EXCLUDE kuning telur > 3/minggu, gorengan, jeroan. Emphasize: ikan omega-3, oat, kacang.
- ASAM URAT / GOUT: max purin moderate. EXCLUDE: jeroan, sarden, teri, ikan tongkol, ikan tuna, ekstrak daging, kerang/udang berlebihan. Banyak air putih ≥ 2.5L/hari.
- GINJAL KRONIK: protein moderat 0.6-0.8 g/kg (BUKAN tinggi). Limit kalium kalau stage 3-5 (hindari pisang, alpukat, kentang). REKOMENDASI WAJIB: konsul nefrologis/RD ginjal sebelum follow plan.
- JANTUNG: low sodium + low saturated fat + DASH-like. Emphasize ikan berlemak, sayur, buah, biji-bijian utuh.
- IBS / GERD: hindari makanan pemicu — pedas, asam, gorengan tinggi minyak, kopi berlebihan, soda, cokelat. Makan kecil tapi sering.
- CELIAC / GLUTEN: EXCLUDE semua gandum, tepung terigu, mie biasa, roti biasa, kecap manis (bisa ada gluten). OK: nasi, jagung, ubi, kacang.

🚫 ALERGI: hard exclude — kalau user alergi kacang tanah, JANGAN keluarkan satu pun item containing kacang. Same untuk susu/laktosa, gluten, seafood, kedelai, telur, ikan, wijen. Cek nama makanan teliti.

7. SAFETY KCAL: jangan generate plan dengan total kcal < 1200 buat wanita atau < 1500 buat pria, KECUALI medical supervision flag. Kalau hamil/menyusui, target tinggi (jangan deficit).
8. HALAL by default (Indonesia majority), kecuali user explicitly opt-out.

PERSONALISASI:
9. HABIT ANCHOR: kalau user pilih 1 habit fokus (mis. "stop skip sarapan", "plan ahead", "snack mindfully"), tonjolkan habit itu di summary.notes + structure meal supaya support habit tersebut.
10. PACE: aggressive (fast) → defisit lebih tegas + meal prep ready-to-eat focus. Slow → enjoyable, fleksibel, dengan ruang treat 1-2x/minggu.
11. READINESS: kalau "tried_failed_before" atau "not_sure_start" → SIMPLIFY plan (4-5 bahan per meal max, repetitive untuk grocery efficiency, nama sederhana). Kalau "ready_all_in" → variasi luas OK.
12. SNACK TIME: tempatin snack di slot waktu yang user biasa craving (mis. evening snacker → reserve 100-150 kcal evening healthy snack).
13. EAT LOCATIONS:
    - cook home → resep ringkas, bahan ≤ 8, prep ≤ 30 min
    - warung_warteg → suggest menu warteg standar (sayur asem, tempe orek, ayam goreng dada, tahu sambal, dll) + porsi standar
    - kantor_kantin → praktis, bisa box bawa
    - delivery_gofood → app order suggestions (Hokben set, salad bowl, ayam panggang)
14. UNDERLYING MOTIVATION → tone summary.notes:
    - feel_better_body → focus comfort, less restriction
    - energy_mood → karbo timing pre-aktivitas
    - improve_health → cite Kemenkes / health benefit
    - feel_confident → progress-focused messaging
    - want_balance → flexible, no demonization

Struktur output:
{
  "days": [
    {
      "day": 1,
      "meals": [
        {
          "slot": "sarapan|makan siang|makan malam|snack",
          "items": [
            {
              "food_code": "<kode TKPI dari pool, e.g. JP011>",
              "food_name": "<nama dari pool>",
              "portion_g": <number>,
              "kcal": <number>,
              "protein_g": <number>,
              "fat_g": <number>,
              "carb_g": <number>
            }
          ],
          "total_kcal": <number>,
          "total_protein_g": <number>,
          "notes": "<opsional, 1 kalimat>"
        }
      ],
      "total_kcal": <number>,
      "total_protein_g": <number>,
      "total_fat_g": <number>,
      "total_carb_g": <number>,
      "est_cost_idr": <number, optional>
    }
  ],
  "shopping_list": [
    {"item": "<bahan>", "total_g_or_unit": "<misal 700g atau 1 kg>", "est_price_idr": <number, optional>}
  ],
  "summary": {
    "avg_kcal": <number>,
    "avg_protein_g": <number>,
    "avg_cost_idr": <number, optional>,
    "notes": ["<insight singkat>"]
  }
}

JANGAN keluar dari food pool yang disediakan. Kode food_code WAJIB sama persis (case-sensitive).`;

function buildContextBlock(
  pool: CompactFood[],
  prices: CompactPrice[],
): string {
  const lines: string[] = [];
  lines.push("=== POOL BAHAN MAKANAN TKPI ===");
  lines.push("Format: code|name|kategori|tipe|kcal|protein_g|fat_g|carb_g|fiber_g (semua per 100g)");
  for (const f of pool) {
    const row = [
      f.code,
      f.name,
      f.cat,
      f.type,
      f.kcal ?? "",
      f.p ?? "",
      f.f ?? "",
      f.c ?? "",
      f.fib ?? "",
    ].join("|");
    lines.push(row);
  }
  lines.push("");
  lines.push("=== HARGA PIHPS (PER KG) ===");
  lines.push("Format: commodity|provinsi|jenis_pasar|harga_idr|tanggal");
  for (const p of prices) {
    lines.push(`${p.name}|${p.province}|${p.market}|${p.price_idr}|${p.date}`);
  }
  return lines.join("\n");
}

function buildUserPrompt(req: MealPlanRequest, preset?: DietPreset): string {
  const lines: string[] = [];
  lines.push(`Buatkan meal plan ${req.days} hari untuk user berikut.`);
  lines.push("");
  lines.push("PROFILE & TARGET:");
  lines.push(formatTargets(req.targets));

  // Diet preset overrides macros — surface them explicitly
  if (preset?.macro_split) {
    const override = applyDietPresetMacros(preset, req.targets.target_kcal);
    if (override) {
      lines.push("");
      lines.push(`DIET METHOD: ${preset.label_id}`);
      lines.push(
        `Macro split OVERRIDE: ${override.proteinPct}% P / ${override.fatPct}% F / ${override.carbPct}% C`,
      );
      lines.push(
        `Macro absolut: ${override.protein_g}g protein / ${override.fat_g}g fat / ${override.carb_g}g carb`,
      );
      lines.push(
        `^ ini OVERRIDE TDEE default — patuhi macro split diet method, bukan TDEE.`,
      );
    }
  } else if (preset) {
    lines.push("");
    lines.push(`DIET METHOD: ${preset.label_id} (macro pakai TDEE default)`);
  }

  if (preset?.hard_caps) {
    lines.push("");
    lines.push("HARD CAPS (wajib dipatuhi):");
    if (preset.hard_caps.max_carb_g !== undefined)
      lines.push(`  - Karbo MAX: ${preset.hard_caps.max_carb_g}g/hari`);
    if (preset.hard_caps.max_sugar_g !== undefined)
      lines.push(`  - Gula tambah MAX: ${preset.hard_caps.max_sugar_g}g/hari`);
    if (preset.hard_caps.max_sodium_mg !== undefined)
      lines.push(`  - Natrium MAX: ${preset.hard_caps.max_sodium_mg}mg/hari`);
    if (preset.hard_caps.max_purine_mg !== undefined)
      lines.push(`  - Purin MAX: ${preset.hard_caps.max_purine_mg}mg/hari`);
    if (preset.hard_caps.min_protein_g !== undefined)
      lines.push(`  - Protein MIN: ${preset.hard_caps.min_protein_g}g/hari`);
    if (preset.hard_caps.min_fiber_g !== undefined)
      lines.push(`  - Serat MIN: ${preset.hard_caps.min_fiber_g}g/hari`);
  }

  if (preset?.emphasize_kategori && preset.emphasize_kategori.length > 0) {
    lines.push(`EMPHASIZE: kategori ${preset.emphasize_kategori.join(", ")}`);
  }
  if (preset?.emphasize_examples && preset.emphasize_examples.length > 0) {
    lines.push(`EMPHASIZE bahan contoh: ${preset.emphasize_examples.join(", ")}`);
  }
  if (preset?.eating_window) {
    lines.push(
      `EATING WINDOW: ${preset.eating_window.start_h}:00 - ${preset.eating_window.end_h}:00 (semua meal dalam window ini)`,
    );
  }
  if (preset?.notes && preset.notes.length > 0) {
    lines.push("");
    lines.push("DIET METHOD NOTES:");
    for (const n of preset.notes) lines.push(`  - ${n}`);
  }

  lines.push("");
  lines.push("CONSTRAINTS LAIN:");
  lines.push(`- Jumlah meal per hari: ${req.meals_per_day ?? 3}`);
  if (req.budget_idr_per_day) {
    lines.push(`- Budget makanan: Rp ${req.budget_idr_per_day.toLocaleString("id-ID")}/hari`);
  } else {
    lines.push("- Budget: tidak ada constraint (tetap realistic)");
  }
  if (req.preferences) {
    const p = req.preferences;
    if (p.halal !== false) lines.push("- Halal: WAJIB");
    if (p.vegetarian) lines.push("- Vegetarian: WAJIB (no daging/ikan/seafood)");
    if (p.no_pork) lines.push("- No babi");
    if (p.no_seafood) lines.push("- No seafood");
    if (p.alergi && p.alergi.length > 0) {
      lines.push(`- Alergi: ${p.alergi.join(", ")} (HINDARI total)`);
    }
    if (p.avoid_kategori && p.avoid_kategori.length > 0) {
      lines.push(`- Hindari kategori: ${p.avoid_kategori.join(", ")}`);
    }
  }
  if (req.context_notes) {
    lines.push(`- Catatan konteks: ${req.context_notes}`);
  }

  // ===== EXTENDED PROFILE FIELDS =====
  const ext = req.extended;
  if (ext) {
    // SAFETY block — surface first
    if (ext.medical_conditions && ext.medical_conditions.length > 0) {
      const conds = ext.medical_conditions.filter((c) => c !== "tidak_ada");
      if (conds.length > 0) {
        lines.push("");
        lines.push("🚨 KONDISI MEDIS (PRIORITAS UTAMA — patuhi SAFETY rules system prompt):");
        for (const c of conds) lines.push(`  - ${c}`);
      }
    }
    if (ext.food_allergies && ext.food_allergies.length > 0) {
      const allergies = ext.food_allergies.filter((a) => a !== "lain");
      if (allergies.length > 0) {
        lines.push("");
        lines.push("🚫 ALERGI / INTOLERANSI (HARD EXCLUDE, jangan keluarkan apapun yang mengandung ini):");
        for (const a of allergies) lines.push(`  - ${a}`);
      }
    }
    if (ext.allergies_other) {
      lines.push(`  - Tambahan: ${ext.allergies_other}`);
    }

    // Personalization context
    lines.push("");
    lines.push("PERSONALISASI:");
    if (ext.underlying_motivation) {
      lines.push(`- Underlying motivation: ${ext.underlying_motivation} (gunakan untuk tone notes)`);
    }
    if (ext.readiness_level) {
      lines.push(`- Readiness: ${ext.readiness_level} (calibrate kompleksitas plan)`);
    }
    if (ext.habit_anchor) {
      lines.push(`- Habit anchor (TONJOLKAN di plan): ${ext.habit_anchor}`);
    }
    if (ext.pace_preference) {
      lines.push(`- Pace preference: ${ext.pace_preference}`);
    }
    if (ext.snack_time && ext.snack_time !== "rarely_snack") {
      lines.push(`- Snack time user: ${ext.snack_time} (timing snack di slot ini)`);
    }
    if (ext.eat_locations && ext.eat_locations.length > 0) {
      lines.push(`- Eat locations: ${ext.eat_locations.join(", ")} (saran sesuai context)`);
    }
    if (ext.sleep_duration === "lt5" || ext.sleep_duration === "5_6") {
      lines.push(
        `- Sleep < 7h (${ext.sleep_duration}) — naikkan protein recovery + magnesium-rich (sayur hijau, kacang), reduce caffeine afternoon`,
      );
    }
    if (ext.water_consumption && ["tea_coffee_only", "lt2_glass"].includes(ext.water_consumption)) {
      lines.push(`- Hidrasi RENDAH (${ext.water_consumption}) — emphasize hydration reminders di notes`);
    }
    if (ext.current_body_type && ext.target_body_type) {
      lines.push(`- Body type: ${ext.current_body_type} → ${ext.target_body_type}`);
    }
    if (ext.target_zones && ext.target_zones.length > 0) {
      lines.push(`- Target zones (workout-aware): ${ext.target_zones.join(", ")}`);
    }
    if (ext.life_events && ext.life_events.length > 0) {
      const events = ext.life_events.filter((e) => e !== "tidak_ada");
      if (events.length > 0) {
        lines.push(`- Konteks weight gain: ${events.join(", ")} (acknowledge dengan empati di notes)`);
      }
    }
    if (ext.special_occasion && ext.special_occasion !== "tidak_ada") {
      lines.push(`- Special occasion: ${ext.special_occasion}${ext.target_event_date ? ` pada ${ext.target_event_date}` : ""}`);
    }
    if (ext.emotional_triggers && ext.emotional_triggers.length > 0) {
      const trigs = ext.emotional_triggers.filter((t) => t !== "not_emotional");
      if (trigs.length > 0) {
        lines.push(`- Emotional eating triggers: ${trigs.join(", ")} — saran coping non-food di notes (jalan 5 min, journaling, breathe)`);
      }
    }
  }

  lines.push("");
  lines.push("Output JSON struktur seperti specified di system prompt. Pakai HANYA food_code dari pool. Jangan tambah field lain.");
  return lines.join("\n");
}

export interface GenerateOptions {
  dryRun?: boolean; // skip Claude call, return prompt only
  poolPerCategory?: number; // default 15
  includeOlahan?: boolean; // include processed foods, default false
}

export interface GenerateResult {
  prompt: {
    system: string;
    context: string;
    user: string;
  };
  pool: CompactFood[];
  prices: CompactPrice[];
  plan?: MealPlan;
  response?: ClaudeResponse<MealPlan>;
}

export async function generateMealPlan(
  db: Database.Database,
  req: MealPlanRequest,
  opts: GenerateOptions = {},
): Promise<GenerateResult> {
  // Resolve diet preset
  const preset: DietPreset | undefined = req.diet_method
    ? getDietPreset(req.diet_method)
    : undefined;

  // Build food pool (filter by prefs + diet preset)
  const excludeKategori: string[] = [];
  if (req.preferences?.vegetarian) {
    excludeKategori.push("Daging", "Ikan/Kerang/Udang dll", "Telur");
  } else if (req.preferences?.no_seafood) {
    excludeKategori.push("Ikan/Kerang/Udang dll");
  }
  if (req.preferences?.avoid_kategori) {
    excludeKategori.push(...req.preferences.avoid_kategori);
  }
  if (preset?.exclude_kategori) {
    excludeKategori.push(...preset.exclude_kategori);
  }
  // Dedupe
  const excludeKategoriDedup = Array.from(new Set(excludeKategori));

  const pool = buildMealPool(db, {
    perCategory: opts.poolPerCategory ?? 15,
    includeOlahan: opts.includeOlahan ?? false,
    excludeKategori: excludeKategoriDedup,
  });

  // Resolve prices: try requested region/market, then fallback to the other
  // market type, then national avg. Some provinces (e.g. DKI) only exist in
  // pasar modern, others (NTB, Yogya) primarily in tradisional.
  let prices = getPricesForRegion(
    db,
    req.province_id,
    req.market_type ?? 1,
  );
  if (prices.length === 0 && req.province_id !== "national") {
    const otherMarket: 1 | 2 = req.market_type === 2 ? 1 : 2;
    prices = getPricesForRegion(db, req.province_id, otherMarket);
  }
  if (prices.length === 0 && req.province_id !== "national") {
    prices = getPricesForRegion(db, "national", req.market_type ?? 1);
  }

  const context = buildContextBlock(pool, prices);
  const userPrompt = buildUserPrompt(req, preset);

  const result: GenerateResult = {
    prompt: {
      system: SYSTEM_PROMPT,
      context,
      user: userPrompt,
    },
    pool,
    prices,
  };

  if (opts.dryRun) return result;

  const response = await callJson<MealPlan>({
    systemPrompt: SYSTEM_PROMPT,
    cacheSystem: true,
    cachedContext: context,
    cacheContext: true,
    userPrompt,
    maxTokens: 8000,
  });

  result.response = response;
  result.plan = response.data;
  return result;
}

export function formatPlanSummary(result: GenerateResult): string {
  const lines: string[] = [];
  lines.push("=== POOL & PRICES ===");
  lines.push(`Food pool: ${result.pool.length} items dari TKPI`);
  lines.push(`Price points: ${result.prices.length} PIHPS rows`);
  lines.push("");
  if (!result.plan) {
    lines.push("(Dry run — no Claude call, prompt siap.)");
    lines.push(`Estimated input tokens (rough): ${Math.round((result.prompt.system.length + result.prompt.context.length + result.prompt.user.length) / 4)}`);
    return lines.join("\n");
  }
  const p = result.plan;
  lines.push(`=== PLAN SUMMARY ===`);
  lines.push(`Days: ${p.days.length}`);
  lines.push(`Avg kcal/hari: ${p.summary.avg_kcal}`);
  lines.push(`Avg protein/hari: ${p.summary.avg_protein_g}g`);
  if (p.summary.avg_cost_idr) {
    lines.push(`Avg cost/hari: Rp ${p.summary.avg_cost_idr.toLocaleString("id-ID")}`);
  }
  for (const note of p.summary.notes) lines.push(`  - ${note}`);
  lines.push("");
  for (const day of p.days) {
    lines.push(`--- Hari ${day.day} (${day.total_kcal} kcal, P${day.total_protein_g}g F${day.total_fat_g}g C${day.total_carb_g}g) ---`);
    for (const meal of day.meals) {
      lines.push(`  ${meal.slot} (${meal.total_kcal} kcal):`);
      for (const item of meal.items) {
        lines.push(`    - ${item.food_name} ${item.portion_g}g  (${item.kcal} kcal, ${item.protein_g}g protein)`);
      }
      if (meal.notes) lines.push(`    note: ${meal.notes}`);
    }
  }
  if (p.shopping_list.length > 0) {
    lines.push("");
    lines.push("=== SHOPPING LIST ===");
    for (const s of p.shopping_list) {
      const price = s.est_price_idr
        ? ` (~Rp ${s.est_price_idr.toLocaleString("id-ID")})`
        : "";
      lines.push(`  - ${s.item}: ${s.total_g_or_unit}${price}`);
    }
  }
  if (result.response) {
    lines.push("");
    lines.push("=== USAGE ===");
    const u = result.response.usage;
    lines.push(`Model: ${result.response.model}`);
    lines.push(`Input: ${u.input_tokens} tokens`);
    if (u.cache_creation_input_tokens) {
      lines.push(`  Cache creation: ${u.cache_creation_input_tokens}`);
    }
    if (u.cache_read_input_tokens) {
      lines.push(`  Cache read: ${u.cache_read_input_tokens}`);
    }
    lines.push(`Output: ${u.output_tokens} tokens`);
  }
  return lines.join("\n");
}
