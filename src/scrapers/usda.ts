/**
 * USDA FoodData Central scraper.
 *
 * Source: https://api.nal.usda.gov/fdc/v1
 * Free API, 1000 req/hour per API key. DEMO_KEY allows 30 req/hour (testing).
 *
 * Strategy: curated query list of foods Indonesian users actually want but
 * TKPI doesn't cover well — international proteins, dairy, exotic veggies,
 * Western breakfast staples, chain restaurants. Filter to Foundation + SR
 * Legacy data types (values normalized per 100g, no per-serving headache).
 */
import type Database from "better-sqlite3";

const API_BASE = "https://api.nal.usda.gov/fdc/v1";

// USDA nutrient IDs (stable across API versions)
const NUTRIENT_IDS = {
  ENERGY_KCAL: 1008,
  PROTEIN: 1003,
  FAT_TOTAL: 1004,
  CARB_DIFF: 1005,
  FIBER: 1079,
  SUGAR: 2000,
  SATURATED_FAT: 1258,
  SODIUM: 1093,
} as const;

interface UsdaNutrient {
  nutrientId?: number;
  nutrientName?: string;
  unitName?: string;
  value?: number;
  // Detailed endpoint format
  nutrient?: { id: number; name: string; unitName: string };
  amount?: number;
}

interface UsdaFood {
  fdcId: number;
  description: string;
  dataType?: string;
  brandOwner?: string;
  brandName?: string;
  ingredients?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodCategory?: string;
  foodNutrients?: UsdaNutrient[];
}

interface UsdaSearchResponse {
  foods?: UsdaFood[];
  totalHits?: number;
  currentPage?: number;
  totalPages?: number;
}

export interface ScrapeUsdaOptions {
  db: Database.Database;
  apiKey?: string;
  queries: string[];
  resultsPerQuery?: number;
  dataTypes?: string[]; // default: Foundation, SR Legacy
  rateLimitMs?: number;
  onProgress?: (info: UsdaProgress) => void;
}

export interface UsdaProgress {
  query: string;
  found: number;
  inserted: number;
  updated: number;
  cumulativeInserted: number;
  cumulativeUpdated: number;
}

export interface ScrapeUsdaResult {
  queriesRun: number;
  itemsInserted: number;
  itemsUpdated: number;
  errors: { query: string; error: string }[];
}

function getNutrient(food: UsdaFood, nutrientId: number): number | null {
  for (const n of food.foodNutrients ?? []) {
    const id = n.nutrientId ?? n.nutrient?.id;
    const value = n.value ?? n.amount;
    if (id === nutrientId && typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function mapUsdaFood(food: UsdaFood): {
  source: string;
  source_id: string;
  name: string;
  brand: string | null;
  categories: string | null;
  serving_size_g: number | null;
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  fat_per_100g: number | null;
  saturated_fat_per_100g: number | null;
  carb_per_100g: number | null;
  sugar_per_100g: number | null;
  fiber_per_100g: number | null;
  sodium_per_100g: number | null;
  raw_json: string;
} | null {
  const kcal = getNutrient(food, NUTRIENT_IDS.ENERGY_KCAL);
  if (kcal === null) return null; // skip foods without kcal
  return {
    source: "usda",
    source_id: String(food.fdcId),
    name: food.description.trim(),
    brand: food.brandOwner?.trim() ?? food.brandName?.trim() ?? null,
    categories: food.foodCategory ?? food.dataType ?? null,
    serving_size_g:
      food.servingSize && food.servingSizeUnit?.toLowerCase() === "g"
        ? food.servingSize
        : null,
    kcal_per_100g: kcal,
    protein_per_100g: getNutrient(food, NUTRIENT_IDS.PROTEIN),
    fat_per_100g: getNutrient(food, NUTRIENT_IDS.FAT_TOTAL),
    saturated_fat_per_100g: getNutrient(food, NUTRIENT_IDS.SATURATED_FAT),
    carb_per_100g: getNutrient(food, NUTRIENT_IDS.CARB_DIFF),
    sugar_per_100g: getNutrient(food, NUTRIENT_IDS.SUGAR),
    fiber_per_100g: getNutrient(food, NUTRIENT_IDS.FIBER),
    sodium_per_100g: getNutrient(food, NUTRIENT_IDS.SODIUM),
    raw_json: JSON.stringify(food),
  };
}

export async function scrapeUsda(
  opts: ScrapeUsdaOptions,
): Promise<ScrapeUsdaResult> {
  const {
    db,
    queries,
    apiKey = process.env.USDA_API_KEY ?? "DEMO_KEY",
    resultsPerQuery = 5,
    dataTypes = ["Foundation", "SR Legacy"],
    rateLimitMs = 1000,
    onProgress,
  } = opts;

  const upsert = db.prepare(`
    INSERT INTO foods (
      id, source, source_id, name, brand, categories, serving_size_g,
      kcal_per_100g, protein_per_100g, fat_per_100g, saturated_fat_per_100g,
      carb_per_100g, sugar_per_100g, fiber_per_100g, sodium_per_100g,
      raw_json, scraped_at
    ) VALUES (
      @id, @source, @source_id, @name, @brand, @categories, @serving_size_g,
      @kcal_per_100g, @protein_per_100g, @fat_per_100g, @saturated_fat_per_100g,
      @carb_per_100g, @sugar_per_100g, @fiber_per_100g, @sodium_per_100g,
      @raw_json, datetime('now')
    )
    ON CONFLICT(source, source_id) DO UPDATE SET
      name=excluded.name,
      brand=excluded.brand,
      categories=excluded.categories,
      serving_size_g=excluded.serving_size_g,
      kcal_per_100g=excluded.kcal_per_100g,
      protein_per_100g=excluded.protein_per_100g,
      fat_per_100g=excluded.fat_per_100g,
      saturated_fat_per_100g=excluded.saturated_fat_per_100g,
      carb_per_100g=excluded.carb_per_100g,
      sugar_per_100g=excluded.sugar_per_100g,
      fiber_per_100g=excluded.fiber_per_100g,
      sodium_per_100g=excluded.sodium_per_100g,
      raw_json=excluded.raw_json,
      scraped_at=excluded.scraped_at
  `);

  const runInsert = db.prepare(`
    INSERT INTO scrape_runs (source, started_at, status)
    VALUES ('usda', datetime('now'), 'running')
  `);
  const runUpdate = db.prepare(`
    UPDATE scrape_runs
    SET finished_at=datetime('now'),
        pages_scraped=?, items_inserted=?, items_updated=?,
        status=?, error=?
    WHERE id=?
  `);
  const runResult = runInsert.run();
  const runId = Number(runResult.lastInsertRowid);

  let totalInserted = 0;
  let totalUpdated = 0;
  const errors: { query: string; error: string }[] = [];

  try {
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]!;
      try {
        const url = new URL(`${API_BASE}/foods/search`);
        url.searchParams.set("query", query);
        url.searchParams.set("dataType", dataTypes.join(","));
        url.searchParams.set("pageSize", String(resultsPerQuery));
        url.searchParams.set("api_key", apiKey);
        const res = await fetch(url);
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(
            `HTTP ${res.status} ${res.statusText}: ${txt.slice(0, 200)}`,
          );
        }
        const json = (await res.json()) as
          | UsdaSearchResponse
          | { error?: { code?: string; message?: string } };
        if ("error" in json && json.error) {
          throw new Error(
            `USDA error ${json.error.code ?? "?"}: ${json.error.message ?? "unknown"}`,
          );
        }
        const foods = (json as UsdaSearchResponse).foods ?? [];

        let inserted = 0;
        let updated = 0;
        const insertMany = db.transaction((items: UsdaFood[]) => {
          for (const food of items) {
            const mapped = mapUsdaFood(food);
            if (!mapped) continue;
            const id = `${mapped.source}:${mapped.source_id}`;
            const existing = db
              .prepare("SELECT 1 FROM foods WHERE id = ?")
              .get(id);
            upsert.run({ ...mapped, id });
            if (existing) updated++;
            else inserted++;
          }
        });
        insertMany(foods);

        totalInserted += inserted;
        totalUpdated += updated;

        onProgress?.({
          query,
          found: foods.length,
          inserted,
          updated,
          cumulativeInserted: totalInserted,
          cumulativeUpdated: totalUpdated,
        });
      } catch (e) {
        const msg = (e as Error).message;
        errors.push({ query, error: msg });
        onProgress?.({
          query,
          found: 0,
          inserted: 0,
          updated: 0,
          cumulativeInserted: totalInserted,
          cumulativeUpdated: totalUpdated,
        });
      }

      if (i < queries.length - 1 && rateLimitMs > 0) {
        await new Promise((r) => setTimeout(r, rateLimitMs));
      }
    }

    runUpdate.run(
      queries.length,
      totalInserted,
      totalUpdated,
      errors.length === 0 ? "success" : "partial",
      errors.length > 0 ? JSON.stringify(errors).slice(0, 500) : null,
      runId,
    );
  } catch (err) {
    runUpdate.run(
      queries.length,
      totalInserted,
      totalUpdated,
      "error",
      (err as Error).message,
      runId,
    );
    throw err;
  }

  db.prepare(
    "INSERT OR IGNORE INTO sources (name, url, license, notes) VALUES ('usda', 'https://fdc.nal.usda.gov', 'Public domain (US federal)', 'USDA FoodData Central — global nutrition database, free API')",
  ).run();
  db.prepare(
    "UPDATE sources SET last_scraped = datetime('now') WHERE name = 'usda'",
  ).run();

  return {
    queriesRun: queries.length,
    itemsInserted: totalInserted,
    itemsUpdated: totalUpdated,
    errors,
  };
}
