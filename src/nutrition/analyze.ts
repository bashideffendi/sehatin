/**
 * Food photo analysis — foto makanan → estimasi kalori + macro, grounded in TKPI.
 *
 * Output format:
 *   detected_items: array of {food_code, name, portion_g, kcal, macro, confidence}
 *   totals: aggregated
 *   confidence_overall: low/medium/high
 *   notes: caveats (porsi sulit dilihat, multiple plates, dll)
 *   swap_suggestions: optional alternatives untuk healthier swap
 */
import type Database from "better-sqlite3";
import { callVisionJson, type ImageInput, type VisionResponse } from "../ai/vision.ts";
import { buildMealPool, type CompactFood } from "./foods.ts";

export interface DetectedItem {
  food_code: string | null; // TKPI code (null kalau gak ada match)
  food_name: string; // Claude's identification, mungkin generic kalau gak match
  portion_g: number;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  confidence: "low" | "medium" | "high";
  reasoning?: string;
}

export interface SwapSuggestion {
  current: string;
  swap_to: string;
  benefit: string; // "lebih rendah kalori 200 kcal" / "lebih banyak protein"
}

export interface AnalysisResult {
  detected_items: DetectedItem[];
  totals: {
    kcal: number;
    protein_g: number;
    fat_g: number;
    carb_g: number;
  };
  confidence_overall: "low" | "medium" | "high";
  meal_type_guess?: "sarapan" | "makan siang" | "makan malam" | "snack" | "unknown";
  notes: string[];
  swap_suggestions?: SwapSuggestion[];
  health_warnings?: string[]; // medical condition / allergy conflicts
}

export interface AnalyzeExtendedFields {
  medical_conditions?: string[];
  food_allergies?: string[];
  diet_method?: string; // keto / DASH / dll → flag conflict
  daily_target_kcal?: number; // contextualize "ini X% target kamu"
  daily_target_sodium_mg?: number;
}

const VISION_SYSTEM = `Kamu adalah food vision analyst Indonesia. Tugas: identifikasi makanan dari foto, estimasi porsi (gram), hitung kalori dan macro berdasarkan TKPI food pool yang diberikan.

Aturan:
1. IDENTIFIKASI: scan foto, identifikasi tiap item makanan terpisah. Buat makanan Indonesia (nasi padang dengan multiple lauk, gado-gado, soto), pecah jadi komponen.
2. GROUND TO TKPI: tiap item match ke food_code TKPI yang paling mirip. Kalau gak ada match exact (misal "ayam geprek" gak ada di TKPI tapi "ayam goreng" ada), pakai yang closest dan note di reasoning.
3. PORSI ESTIMASI: pakai visual cues — plate diameter standar 22-26cm, sendok 15ml, mangkuk soto 250ml, gelas 200ml. Nasi sepiring penuh ~200g, nasi 1 centong ~100g. Daging ayam paha 1 potong ~80-120g. Lauk Padang 1 potong rendang ~70-90g.
4. KCAL & MACRO: hitung dari TKPI per 100g × (porsi/100). Round to integer.
5. CONFIDENCE:
   - high: item jelas terlihat, porsi visible cues bagus
   - medium: item teridentifikasi tapi porsi estimate-based
   - low: blurry, occluded, atau ambigu
6. NOTES: flag caveat penting — "porsi kuah gak include", "side dish tertutup", "estimasi nasi karena tidak terlihat sepenuhnya", dll
7. SWAP SUGGESTIONS (optional, max 2): kalau ada item kalori tinggi, suggest substitusi lebih sehat dari TKPI pool yang functionally serupa.
8. MEAL TYPE: tebak waktu makan dari konteks (kopi+roti = sarapan, nasi penuh + lauk = makan siang/malam, dll). Kalau tidak yakin → "unknown".

🚨 HEALTH WARNINGS (kalau user provide medical_conditions/allergies di user message, flag conflict di field "health_warnings"):
- ALERGI: kalau detected item mengandung allergen user (kacang/susu/seafood/dll), output warning EKSPLISIT: "⚠️ Mengandung [alergen] — JANGAN dikonsumsi"
- HIPERTENSI: kalau item asin/tinggi natrium (ikan asin, mi instan, kecap berlebihan), warning: "Tinggi natrium — hati-hati untuk hipertensi"
- DIABETES: kalau item tinggi gula/karbo sederhana (nasi putih besar, teh manis, kue manis), warning + saran ganti low-GI
- ASAM URAT: kalau detected jeroan, ikan teri/sarden, kerang/udang → warning purine
- KETO (kalau user diet keto): kalau detected nasi/roti/mie → warning "Bukan keto-friendly, karbo tinggi"
- GINJAL: warning kalau detected makanan tinggi protein berlebihan atau tinggi kalium

Format health_warnings: array of string singkat (max 3-4 warning per analisis).

OUTPUT WAJIB JSON valid, tanpa markdown fence:
{
  "detected_items": [
    {
      "food_code": "<TKPI code atau null>",
      "food_name": "<nama yang teridentifikasi>",
      "portion_g": <number>,
      "kcal": <number>,
      "protein_g": <number>,
      "fat_g": <number>,
      "carb_g": <number>,
      "confidence": "low|medium|high",
      "reasoning": "<1 kalimat alasan portion estimate atau ground-truth match>"
    }
  ],
  "totals": {
    "kcal": <number>,
    "protein_g": <number>,
    "fat_g": <number>,
    "carb_g": <number>
  },
  "confidence_overall": "low|medium|high",
  "meal_type_guess": "sarapan|makan siang|makan malam|snack|unknown",
  "notes": ["<caveat 1>", "<caveat 2>"],
  "swap_suggestions": [
    {"current": "<item>", "swap_to": "<TKPI alternative>", "benefit": "<sebab>"}
  ],
  "health_warnings": ["<warning 1>", "<warning 2>"]
}

PENTING: kalau foto bukan makanan, output detected_items: [] dan notes: ["Foto bukan makanan."]. Jangan ngarang.`;

function buildContext(pool: CompactFood[]): string {
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
  return lines.join("\n");
}

export interface AnalyzeOptions {
  /** Skip Claude vision call, return prompt + image info only. */
  dryRun?: boolean;
  /** TKPI pool size per category. Default 20 (broader than meal plan default). */
  poolPerCategory?: number;
  /** Include Olahan (processed) foods. Default true (ayam goreng, sambal, dll umum). */
  includeOlahan?: boolean;
  /** User note konteks ("foto sarapan saya jam 7 pagi"). */
  userNote?: string;
  /** User health context buat flag warnings. */
  extended?: AnalyzeExtendedFields;
}

export interface AnalyzeResult {
  prompt: {
    system: string;
    context: string;
    instruction: string;
  };
  image: {
    sizeKB: number;
    mediaType: string;
  };
  pool: CompactFood[];
  analysis?: AnalysisResult;
  response?: VisionResponse<AnalysisResult>;
}

const INSTRUCTION = `Analisis foto makanan ini. Identifikasi tiap item, estimasi porsi gram, hitung kalori + macro berdasarkan TKPI pool. Output JSON sesuai struktur di system prompt.`;

export async function analyzePhoto(
  db: Database.Database,
  image: ImageInput,
  opts: AnalyzeOptions = {},
): Promise<AnalyzeResult> {
  // Build broad TKPI pool (include Olahan since chain/restaurant food is processed)
  const pool = buildMealPool(db, {
    perCategory: opts.poolPerCategory ?? 20,
    includeOlahan: opts.includeOlahan ?? true,
  });

  const context = buildContext(pool);

  const result: AnalyzeResult = {
    prompt: {
      system: VISION_SYSTEM,
      context,
      instruction: INSTRUCTION,
    },
    image: {
      sizeKB: 0,
      mediaType: "image/jpeg",
    },
    pool,
  };

  if (opts.dryRun) {
    // Still load image to verify it's readable + report size
    try {
      const { loadImage } = await import("../ai/vision.ts");
      const img = loadImage(image);
      result.image.sizeKB = img.sizeKB;
      result.image.mediaType = img.mediaType;
    } catch (e) {
      result.image.sizeKB = -1;
    }
    return result;
  }

  // Compose health context note kalau ada extended fields
  const healthCtx: string[] = [];
  const ext = opts.extended;
  if (ext) {
    if (ext.medical_conditions && ext.medical_conditions.length > 0) {
      const conds = ext.medical_conditions.filter((c) => c !== "tidak_ada");
      if (conds.length > 0) {
        healthCtx.push(`Kondisi medis user: ${conds.join(", ")}`);
      }
    }
    if (ext.food_allergies && ext.food_allergies.length > 0) {
      const allergies = ext.food_allergies.filter((a) => a !== "lain");
      if (allergies.length > 0) {
        healthCtx.push(`Alergi user: ${allergies.join(", ")}`);
      }
    }
    if (ext.diet_method && ext.diet_method !== "standard") {
      healthCtx.push(`Diet user: ${ext.diet_method}`);
    }
    if (ext.daily_target_kcal) {
      healthCtx.push(
        `Target kalori harian: ${ext.daily_target_kcal} (estimate % vs target di notes)`,
      );
    }
  }

  const noteCombined = [opts.userNote, ...healthCtx].filter(Boolean).join(" · ");

  const response = await callVisionJson<AnalysisResult>({
    systemPrompt: VISION_SYSTEM,
    cacheSystem: true,
    cachedContext: context,
    cacheContext: true,
    userInstruction: INSTRUCTION,
    userNote: noteCombined || undefined,
    image,
    maxTokens: 4000,
  });

  result.analysis = response.data;
  result.response = response;
  // Echo image metadata
  const { loadImage } = await import("../ai/vision.ts");
  const img = loadImage(image);
  result.image.sizeKB = img.sizeKB;
  result.image.mediaType = img.mediaType;

  return result;
}

export function formatAnalysis(result: AnalyzeResult): string {
  const lines: string[] = [];
  lines.push(`=== IMAGE ===`);
  lines.push(`Size: ${result.image.sizeKB} KB`);
  lines.push(`Type: ${result.image.mediaType}`);
  lines.push(`Pool: ${result.pool.length} TKPI items`);
  lines.push("");

  if (!result.analysis) {
    lines.push("(Dry run — no Claude vision call.)");
    lines.push(
      `Estimated input tokens (text only, image extra): ~${Math.round((result.prompt.system.length + result.prompt.context.length + result.prompt.instruction.length) / 4)}`,
    );
    lines.push(`Image will add ~1500-2500 tokens for typical food photo.`);
    return lines.join("\n");
  }

  const a = result.analysis;
  lines.push("=== DETECTED ITEMS ===");
  for (const item of a.detected_items) {
    const conf = item.confidence.toUpperCase().padEnd(6);
    const code = item.food_code ? `[${item.food_code}]` : "[--]";
    lines.push(
      `  ${conf} ${code} ${item.food_name} ${item.portion_g}g — ${item.kcal} kcal (P${item.protein_g} F${item.fat_g} C${item.carb_g})`,
    );
    if (item.reasoning) lines.push(`         ${item.reasoning}`);
  }
  lines.push("");
  lines.push("=== TOTALS ===");
  lines.push(`Kcal:    ${a.totals.kcal}`);
  lines.push(`Protein: ${a.totals.protein_g}g`);
  lines.push(`Fat:     ${a.totals.fat_g}g`);
  lines.push(`Carb:    ${a.totals.carb_g}g`);
  lines.push(`Confidence overall: ${a.confidence_overall.toUpperCase()}`);
  if (a.meal_type_guess) lines.push(`Meal type guess: ${a.meal_type_guess}`);
  if (a.notes && a.notes.length > 0) {
    lines.push("");
    lines.push("Notes:");
    for (const n of a.notes) lines.push(`  - ${n}`);
  }
  if (a.health_warnings && a.health_warnings.length > 0) {
    lines.push("");
    lines.push("🚨 HEALTH WARNINGS:");
    for (const w of a.health_warnings) lines.push(`  - ${w}`);
  }
  if (a.swap_suggestions && a.swap_suggestions.length > 0) {
    lines.push("");
    lines.push("Swap suggestions:");
    for (const s of a.swap_suggestions) {
      lines.push(`  - ${s.current} → ${s.swap_to}  (${s.benefit})`);
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
