/**
 * Diet method presets — override macro split + add restrictions on top of TDEE.
 *
 * Macros: each preset returns proteinPct/fatPct/carbPct that summed = 100.
 * Restrictions: exclude kategori, max sugar/sodium, food emphasis list.
 *
 * Used by meal plan generator to constrain Claude's selection.
 */

export type DietMethod =
  | "standard" // balanced default, no special restriction
  | "keto" // <50g carb, high fat
  | "low_carb" // <150g carb, moderate fat
  | "high_protein" // 35%+ protein (athlete / muscle gain)
  | "mediterranean" // olive oil, ikan, sayur emphasis
  | "dash" // low sodium (anti-hipertensi)
  | "plant_based" // vegan, no animal product
  | "vegetarian" // ovo-lacto, susu + telur OK
  | "low_gi" // low glycemic index (diabetes-friendly)
  | "low_purine" // anti asam urat (gout)
  | "ramadan" // sahur-buka window + light fast-breaker
  | "if_general"; // intermittent fasting umum (16:8 default)

export interface MacroSplit {
  proteinPct: number;
  fatPct: number;
  carbPct: number;
}

export interface DietPreset {
  method: DietMethod;
  label_id: string;
  label_en: string;
  /**
   * Macro overrides — null berarti tidak override (pakai default TDEE).
   * Kalau di-set, system pakai split ini buat hitung target macro absolut.
   */
  macro_split?: MacroSplit;
  /**
   * Hard caps. Kalau di-set, meal plan harus mematuhi.
   */
  hard_caps?: {
    max_carb_g?: number;
    max_sugar_g?: number;
    max_sodium_mg?: number;
    max_purine_mg?: number;
    min_protein_g?: number;
    min_fiber_g?: number;
  };
  /**
   * Kategori TKPI yang excluded by default.
   */
  exclude_kategori?: string[];
  /**
   * Item-level exclusions (substring match pada name).
   */
  exclude_name_contains?: string[];
  /**
   * Kategori yang di-emphasis (Claude harus prioritize).
   */
  emphasize_kategori?: string[];
  /**
   * Specific food names to emphasize.
   */
  emphasize_examples?: string[];
  /**
   * Eating window (for IF / Ramadan). 24h clock.
   */
  eating_window?: { start_h: number; end_h: number };
  /**
   * Notes & rationale for the meal plan prompt.
   */
  notes: string[];
}

const PRESETS: Record<DietMethod, DietPreset> = {
  standard: {
    method: "standard",
    label_id: "Standar (Seimbang)",
    label_en: "Standard balanced",
    notes: [
      "Pola makan seimbang sesuai Pedoman Gizi Seimbang Kemenkes — karbo + protein + lemak proporsional, sayur-buah ≥5 porsi/hari.",
    ],
  },

  keto: {
    method: "keto",
    label_id: "Keto (Ketogenik)",
    label_en: "Ketogenic",
    macro_split: { proteinPct: 25, fatPct: 70, carbPct: 5 },
    hard_caps: { max_carb_g: 50 },
    exclude_kategori: ["Beras", "Serealia", "Umbi Berpati", "Buah", "Konfeksioneri"],
    exclude_name_contains: ["gula", "tepung", "nasi", "mie", "roti"],
    emphasize_kategori: ["Minyak/Lemak", "Daging", "Ikan/Kerang/Udang dll", "Telur", "Susu", "Kacang-Kacangan"],
    emphasize_examples: ["alpukat", "minyak kelapa", "ikan salmon", "telur", "daging sapi"],
    notes: [
      "Karbo total ≤ 50g/hari, fat dominan ~70% energi.",
      "Hindari nasi, mie, roti, tepung, gula, buah manis. Sayur low-carb OK (selada, brokoli, kembang kol).",
      "Hati-hati: defisit elektrolit (Na, K, Mg) saat induksi 1-2 minggu pertama. Konsultasi medis kalau punya DM, ginjal, atau ibu hamil.",
    ],
  },

  low_carb: {
    method: "low_carb",
    label_id: "Low-Carb",
    label_en: "Low-carbohydrate",
    macro_split: { proteinPct: 30, fatPct: 40, carbPct: 30 },
    hard_caps: { max_carb_g: 150 },
    exclude_name_contains: ["gula", "sirup"],
    emphasize_kategori: ["Daging", "Ikan/Kerang/Udang dll", "Telur", "Sayuran", "Kacang-Kacangan"],
    emphasize_examples: ["ayam panggang", "ikan", "telur", "sayur hijau", "tempe"],
    notes: [
      "Karbo 100-150g/hari (vs standar 250-300g). Cocok buat fat loss tanpa ekstrem keto.",
      "Pilih karbo kompleks: ubi, beras merah, oat. Hindari gula tambah dan nasi putih dalam porsi besar.",
    ],
  },

  high_protein: {
    method: "high_protein",
    label_id: "Tinggi Protein",
    label_en: "High protein",
    macro_split: { proteinPct: 40, fatPct: 25, carbPct: 35 },
    hard_caps: { min_protein_g: 130 },
    emphasize_kategori: ["Daging", "Ikan/Kerang/Udang dll", "Telur", "Susu", "Kacang-Kacangan"],
    emphasize_examples: ["dada ayam", "ikan tongkol", "telur", "tempe", "tahu", "yoghurt"],
    notes: [
      "Protein 35-40% energi untuk muscle gain / preservasi saat defisit.",
      "Distribusi 4-5 meal × 25-40g protein lebih efektif daripada 2 meal × 70g.",
    ],
  },

  mediterranean: {
    method: "mediterranean",
    label_id: "Mediterania",
    label_en: "Mediterranean",
    macro_split: { proteinPct: 20, fatPct: 40, carbPct: 40 },
    emphasize_kategori: [
      "Ikan/Kerang/Udang dll",
      "Sayuran",
      "Buah",
      "Kacang-Kacangan",
      "Minyak/Lemak",
    ],
    emphasize_examples: [
      "minyak zaitun",
      "ikan salmon",
      "ikan kembung",
      "alpukat",
      "kacang almond",
      "tomat",
      "bayam",
    ],
    exclude_name_contains: ["margarin", "lemak babi"],
    notes: [
      "Lemak baik dominan (zaitun, alpukat, ikan berlemak), karbo dari biji-bijian utuh.",
      "Dikenal bukti kuat menurunkan risiko kardiovaskular & demensia.",
      "Indonesia adaptasi: ganti zaitun mahal dengan minyak kelapa virgin / minyak biji bunga matahari.",
    ],
  },

  dash: {
    method: "dash",
    label_id: "DASH (Anti-Hipertensi)",
    label_en: "DASH",
    macro_split: { proteinPct: 18, fatPct: 27, carbPct: 55 },
    hard_caps: { max_sodium_mg: 1500, min_fiber_g: 30 },
    emphasize_kategori: ["Buah", "Sayuran", "Susu", "Kacang-Kacangan", "Serealia"],
    exclude_name_contains: ["asin", "garam", "kecap", "ikan asin", "telur asin", "abon"],
    notes: [
      "DASH = Dietary Approaches to Stop Hypertension. Natrium maks 1500 mg/hari (1 sdt garam ≈ 2300 mg).",
      "Tinggi K, Ca, Mg, serat. Cocok buat hipertensi, prehipertensi, atau preventif.",
      "Hindari makanan olahan/instan, snack asin, kecap berlebihan.",
    ],
  },

  plant_based: {
    method: "plant_based",
    label_id: "Plant-Based / Vegan",
    label_en: "Plant-based vegan",
    macro_split: { proteinPct: 18, fatPct: 30, carbPct: 52 },
    exclude_kategori: ["Daging", "Ikan/Kerang/Udang dll", "Telur", "Susu"],
    emphasize_kategori: ["Sayuran", "Buah", "Kacang-Kacangan", "Serealia", "Umbi Berpati"],
    emphasize_examples: ["tempe", "tahu", "kacang kedelai", "kacang merah", "lentil", "biji chia", "oat"],
    notes: [
      "100% nabati. Sumber protein: kedelai (tempe/tahu), kacang-kacangan, biji-bijian.",
      "Hati-hati defisit B12 (suplementasi wajib), Fe non-heme (kombinasi dengan vit C), omega-3 (chia/flaxseed), Ca (sayur hijau / susu kedelai fortifikasi).",
    ],
  },

  vegetarian: {
    method: "vegetarian",
    label_id: "Vegetarian (Ovo-Lacto)",
    label_en: "Ovo-lacto vegetarian",
    macro_split: { proteinPct: 18, fatPct: 30, carbPct: 52 },
    exclude_kategori: ["Daging", "Ikan/Kerang/Udang dll"],
    emphasize_kategori: ["Telur", "Susu", "Kacang-Kacangan", "Sayuran", "Buah"],
    emphasize_examples: ["telur", "yoghurt", "keju", "tempe", "tahu", "kacang almond"],
    notes: [
      "Tanpa daging & ikan tapi telur dan susu masih OK.",
      "Lebih mudah memenuhi B12 dan protein lengkap dibanding vegan murni.",
    ],
  },

  low_gi: {
    method: "low_gi",
    label_id: "Low-GI (Diabetes-Friendly)",
    label_en: "Low glycemic index",
    macro_split: { proteinPct: 25, fatPct: 30, carbPct: 45 },
    hard_caps: { max_sugar_g: 25, min_fiber_g: 35 },
    exclude_name_contains: ["gula", "sirup", "permen", "manisan", "biskuit manis"],
    emphasize_examples: [
      "oat",
      "ubi jalar",
      "beras merah",
      "kacang merah",
      "lentil",
      "alpukat",
      "ikan",
      "sayur hijau",
    ],
    notes: [
      "Pilih karbo Low-GI: ubi, beras merah, oat, kacang-kacangan. Hindari nasi putih sendirian, gula, jus buah.",
      "Kombinasi karbo + protein + serat dalam 1 piring memperlambat naik gula darah.",
      "Untuk DM tipe 2 atau prediabetes — konsultasi medis untuk target spesifik.",
    ],
  },

  low_purine: {
    method: "low_purine",
    label_id: "Low-Purine (Anti Asam Urat)",
    label_en: "Low-purine",
    macro_split: { proteinPct: 20, fatPct: 30, carbPct: 50 },
    exclude_name_contains: [
      "jeroan",
      "hati",
      "limpa",
      "otak",
      "babat",
      "usus",
      "kerang",
      "udang",
      "sarden",
      "ikan teri",
      "ikan tongkol",
      "ikan tuna",
      "ekstrak daging",
    ],
    notes: [
      "Hindari makanan tinggi purin: jeroan, ikan kecil (teri, sarden), kerang/udang, ekstrak kaldu daging, kacang-kacangan tertentu (terbatas).",
      "Pilih protein moderat: ayam tanpa kulit, telur, tahu, tempe, susu rendah lemak.",
      "Banyak air putih (≥ 2.5L/hari) untuk pembuangan asam urat via ginjal.",
    ],
  },

  ramadan: {
    method: "ramadan",
    label_id: "Ramadan (Puasa)",
    label_en: "Ramadan fasting",
    macro_split: { proteinPct: 25, fatPct: 30, carbPct: 45 },
    eating_window: { start_h: 18, end_h: 4 }, // buka ~18, sahur cutoff ~4
    emphasize_examples: [
      "kurma",
      "air kelapa",
      "bubur ayam ringan",
      "ikan",
      "ubi",
      "oat",
      "telur",
      "yoghurt",
    ],
    exclude_name_contains: ["gorengan tinggi minyak"],
    notes: [
      "2 meal utama: BUKA (porsi medium, tidak heavy supaya tidak shock perut — kurma 3 butir + air + sup ringan, lalu makan utama setelah maghrib) + SAHUR (heavy meal, slow-digest: karbo kompleks + protein + lemak + serat untuk tahan 14-16 jam).",
      "Hindari gorengan berat & gula tinggi saat buka — bikin spike-crash energi.",
      "Minimal 1.5-2 L air dibagi: berbuka, antara maghrib-tidur, sahur.",
      "Untuk fat loss saat puasa: target -10% TDEE max, jangan agresif. Workout pindahkan ke pre-buka atau setelah tarawih.",
    ],
  },

  if_general: {
    method: "if_general",
    label_id: "Intermittent Fasting (16:8)",
    label_en: "Intermittent fasting",
    eating_window: { start_h: 12, end_h: 20 }, // default 16:8 eating 12-20
    notes: [
      "Default 16:8 — eating window 8 jam (12.00-20.00), puasa 16 jam.",
      "Bisa kombinasi dengan diet method lain (keto+IF, mediterranean+IF, dll).",
      "Air, kopi/teh tawar, garam (kalau elektrolit drop) OK saat fasting window.",
    ],
  },
};

export function getDietPreset(method: DietMethod): DietPreset {
  return PRESETS[method];
}

export function listDietMethods(): Array<{ method: DietMethod; label_id: string }> {
  return Object.values(PRESETS).map((p) => ({
    method: p.method,
    label_id: p.label_id,
  }));
}

/**
 * Apply preset macros override on top of base targets.
 * If preset has macro_split, recompute protein/fat/carb from target_kcal.
 */
export function applyDietPresetMacros(
  preset: DietPreset,
  target_kcal: number,
): MacroSplit & { protein_g: number; fat_g: number; carb_g: number } | null {
  if (!preset.macro_split) return null;
  const { proteinPct, fatPct, carbPct } = preset.macro_split;
  if (Math.abs(proteinPct + fatPct + carbPct - 100) > 1) {
    throw new Error(
      `Preset ${preset.method} macro_split tidak sum ke 100: ${proteinPct}+${fatPct}+${carbPct}`,
    );
  }
  return {
    proteinPct,
    fatPct,
    carbPct,
    protein_g: Math.round((target_kcal * proteinPct) / 100 / 4),
    fat_g: Math.round((target_kcal * fatPct) / 100 / 9),
    carb_g: Math.round((target_kcal * carbPct) / 100 / 4),
  };
}
