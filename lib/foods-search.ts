/**
 * Client-side TKPI foods search.
 * Lazy-load /public/foods.json (156 KB) on first search, cache in module-level memo.
 */

export interface FoodSearchEntry {
  code: string;
  name: string;
  kategori: string;
  tipe: "Mentah" | "Olahan";
  kcal: number | null;
  p: number | null;
  f: number | null;
  c: number | null;
  fib: number | null;
}

interface FoodsManifest {
  generated_at: string;
  source: string;
  count: number;
  foods: FoodSearchEntry[];
}

let cache: FoodSearchEntry[] | null = null;
let loadingPromise: Promise<FoodSearchEntry[]> | null = null;

export async function loadFoods(): Promise<FoodSearchEntry[]> {
  if (cache) return cache;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    const res = await fetch("/foods.json");
    if (!res.ok) {
      throw new Error(`Failed to load /foods.json: ${res.status}`);
    }
    const manifest = (await res.json()) as FoodsManifest;
    cache = manifest.foods;
    return cache;
  })();
  try {
    return await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

/** Normalize string for matching: lower + strip diacritics + collapse whitespace. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchFoods(
  query: string,
  opts: { limit?: number; kategori?: string } = {},
): Promise<FoodSearchEntry[]> {
  const foods = await loadFoods();
  const q = norm(query);
  if (!q) return [];
  const limit = opts.limit ?? 30;

  const hits: { entry: FoodSearchEntry; score: number }[] = [];
  for (const f of foods) {
    if (opts.kategori && f.kategori !== opts.kategori) continue;
    const n = norm(f.name);
    if (!n.includes(q)) continue;
    // Scoring: prefer startsWith > contains, shorter name = better,
    // and prefer Olahan (cooked) so 'nasi' surfaces 'Nasi' before
    // 'Beras giling, mentah'.
    let score = 0;
    if (n.startsWith(q)) score += 100;
    else if (n.split(" ").some((w) => w.startsWith(q))) score += 50;
    score += Math.max(0, 50 - n.length); // shorter wins
    if (f.tipe === "Olahan") score += 30;
    if (n.includes("mentah")) score -= 25;
    hits.push({ entry: f, score });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit).map((h) => h.entry);
}

export async function getFoodByCode(code: string): Promise<FoodSearchEntry | null> {
  const foods = await loadFoods();
  return foods.find((f) => f.code === code) ?? null;
}

export function listKategori(): string[] {
  return [
    "Beras",
    "Buah",
    "Bumbu",
    "Daging",
    "Ikan/Kerang/Udang dll",
    "Kacang-Kacangan",
    "Konfeksioneri",
    "Minuman Non Alkohol",
    "Minyak/Lemak",
    "Sayuran",
    "Serealia",
    "Susu",
    "Telur",
    "Umbi Berpati",
  ];
}

/** Compute macros for given portion grams from per-100g values. */
export function macrosForPortion(
  food: FoodSearchEntry,
  portion_g: number,
): { kcal: number; protein_g: number; fat_g: number; carb_g: number } {
  const factor = portion_g / 100;
  return {
    kcal: Math.round((food.kcal ?? 0) * factor),
    protein_g: Math.round((food.p ?? 0) * factor * 10) / 10,
    fat_g: Math.round((food.f ?? 0) * factor * 10) / 10,
    carb_g: Math.round((food.c ?? 0) * factor * 10) / 10,
  };
}
