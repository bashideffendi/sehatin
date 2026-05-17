/**
 * POST /api/voice-parse — Voice transcript → parsed meal items (kcal + macros).
 *
 * Body: {
 *   transcript: string,        // user's voice transcription, e.g. "2 piring nasi sama es teh"
 *   meal_slot?: string,        // optional slot hint ("sarapan" | "makan_siang" | etc)
 * }
 *
 * Response: {
 *   ok: true,
 *   items: [{
 *     food_name: string,
 *     portion_g: number,
 *     kcal: number,
 *     protein_g: number,
 *     fat_g: number,
 *     carb_g: number,
 *     confidence: "high" | "medium" | "low",
 *   }],
 *   summary: string,
 * }
 */
import { NextResponse } from "next/server";
import { callJson } from "@/src/ai/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RequestBody {
  transcript: string;
  meal_slot?: string;
}

interface ParsedItem {
  food_name: string;
  portion_g: number;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  confidence: "high" | "medium" | "low";
}

interface ParsedResponse {
  items: ParsedItem[];
  summary: string;
}

const SYSTEM_PROMPT = `Kamu adalah nutrition AI Indonesia. Tugas: parse user voice transcript jadi list makanan dengan estimasi gizi.

OUTPUT WAJIB JSON valid, tanpa markdown fence.

Format:
{
  "items": [
    {
      "food_name": "string — nama makanan dalam Bahasa Indonesia (e.g. 'Nasi putih', 'Es teh manis')",
      "portion_g": number — gram approximation. 1 piring nasi ≈ 150g, 1 gelas air ≈ 250g,
      "kcal": number — estimasi kalori,
      "protein_g": number,
      "fat_g": number,
      "carb_g": number,
      "confidence": "high" | "medium" | "low"
    }
  ],
  "summary": "string — ringkasan singkat dalam Bahasa Indonesia"
}

Aturan:
- Jika user nyebut "2 piring nasi" → 2 entry "Nasi putih" 150g masing-masing, ATAU 1 entry "Nasi putih" 300g.
- Jika ada minum (es teh, kopi, susu) → buat entry terpisah dengan portion_g sesuai (250g ≈ 1 gelas).
- Untuk makanan kompleks ("ayam geprek", "soto betawi") → 1 entry single makanan.
- Pakai estimasi nutrisi realistis berdasar data TKPI Kemenkes / USDA umum.
- Jika gak jelas user maksudnya apa, set confidence: "low".`;

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

  if (!body.transcript || typeof body.transcript !== "string") {
    return NextResponse.json(
      { ok: false, error: "transcript required" },
      { status: 400 },
    );
  }

  const transcript = body.transcript.trim();
  if (transcript.length === 0) {
    return NextResponse.json(
      { ok: false, error: "transcript empty" },
      { status: 400 },
    );
  }
  if (transcript.length > 500) {
    return NextResponse.json(
      { ok: false, error: "transcript too long (max 500 chars)" },
      { status: 400 },
    );
  }

  const userPrompt = `Transcript: "${transcript}"${
    body.meal_slot ? `\nMeal slot context: ${body.meal_slot}` : ""
  }\n\nParse ke JSON items.`;

  try {
    const response = await callJson<ParsedResponse>({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 1024,
    });

    const items = (response.data.items ?? []).map((it) => ({
      food_name: it.food_name,
      portion_g: Math.max(1, Math.round(it.portion_g)),
      kcal: Math.max(0, Math.round(it.kcal)),
      protein_g: Math.max(0, Math.round((it.protein_g ?? 0) * 10) / 10),
      fat_g: Math.max(0, Math.round((it.fat_g ?? 0) * 10) / 10),
      carb_g: Math.max(0, Math.round((it.carb_g ?? 0) * 10) / 10),
      confidence: it.confidence ?? "medium",
    }));

    return NextResponse.json({
      ok: true,
      items,
      summary: response.data.summary ?? "",
      transcript,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message ?? "voice-parse failed" },
      { status: 500 },
    );
  }
}
