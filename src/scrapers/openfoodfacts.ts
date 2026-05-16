import type Database from "better-sqlite3";

const OFF_API_BASE = "https://world.openfoodfacts.org/api/v2/search";
const DEFAULT_FIELDS = [
  "code",
  "product_name",
  "product_name_id",
  "generic_name",
  "brands",
  "categories",
  "categories_tags",
  "serving_size",
  "serving_quantity",
  "nutriments",
  "countries_tags",
  "image_url",
  "image_small_url",
].join(",");

interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_id?: string;
  generic_name?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
  countries_tags?: string[];
  image_url?: string;
  image_small_url?: string;
}

interface OffResponse {
  count?: number;
  page?: number;
  page_count?: number;
  page_size?: number;
  products?: OffProduct[];
}

export interface ScrapeOffOptions {
  db: Database.Database;
  pages: number;
  pageSize?: number;
  startPage?: number;
  rateLimitMs?: number;
  userAgent?: string;
  country?: string;
  onProgress?: (info: ProgressInfo) => void;
}

export interface ProgressInfo {
  page: number;
  totalPages: number;
  itemsOnPage: number;
  inserted: number;
  updated: number;
  cumulativeInserted: number;
  cumulativeUpdated: number;
}

export interface ScrapeOffResult {
  pagesScraped: number;
  itemsInserted: number;
  itemsUpdated: number;
  totalAvailable: number;
  lastPage: number;
}

function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number.parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseServingGrams(product: OffProduct): number | null {
  const sq = parseNumber(product.serving_quantity);
  if (sq !== null) return sq;
  const ss = product.serving_size;
  if (!ss) return null;
  const match = ss.match(/(\d+(?:[.,]\d+)?)\s*g/i);
  if (!match || !match[1]) return null;
  return parseNumber(match[1].replace(",", "."));
}

function mapProduct(product: OffProduct): {
  source: string;
  source_id: string;
  name: string;
  name_id: string | null;
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
  salt_per_100g: number | null;
  sodium_per_100g: number | null;
  countries: string | null;
  image_url: string | null;
  raw_json: string;
} | null {
  const code = product.code;
  const name = product.product_name_id || product.product_name || product.generic_name;
  if (!code || !name) return null;

  const n = product.nutriments ?? {};
  return {
    source: "openfoodfacts",
    source_id: code,
    name: name.trim(),
    name_id: product.product_name_id?.trim() ?? null,
    brand: product.brands?.trim() ?? null,
    categories: product.categories?.trim() ?? null,
    serving_size_g: parseServingGrams(product),
    kcal_per_100g: parseNumber(n["energy-kcal_100g"]),
    protein_per_100g: parseNumber(n["proteins_100g"]),
    fat_per_100g: parseNumber(n["fat_100g"]),
    saturated_fat_per_100g: parseNumber(n["saturated-fat_100g"]),
    carb_per_100g: parseNumber(n["carbohydrates_100g"]),
    sugar_per_100g: parseNumber(n["sugars_100g"]),
    fiber_per_100g: parseNumber(n["fiber_100g"]),
    salt_per_100g: parseNumber(n["salt_100g"]),
    sodium_per_100g: parseNumber(n["sodium_100g"]),
    countries: product.countries_tags?.join(",") ?? null,
    image_url: product.image_url ?? product.image_small_url ?? null,
    raw_json: JSON.stringify(product),
  };
}

export async function scrapeOpenFoodFacts(
  opts: ScrapeOffOptions,
): Promise<ScrapeOffResult> {
  const {
    db,
    pages,
    pageSize = 100,
    startPage = 1,
    rateLimitMs = Number(process.env.OFF_RATE_LIMIT_MS ?? 1000),
    userAgent = process.env.OFF_USER_AGENT ??
      "Sehatin/0.1 (research; sehatin.masbash.id)",
    country = "indonesia",
    onProgress,
  } = opts;

  const upsert = db.prepare(`
    INSERT INTO foods (
      id, source, source_id, name, name_id, brand, categories, serving_size_g,
      kcal_per_100g, protein_per_100g, fat_per_100g, saturated_fat_per_100g,
      carb_per_100g, sugar_per_100g, fiber_per_100g, salt_per_100g, sodium_per_100g,
      countries, image_url, raw_json, scraped_at
    ) VALUES (
      @id, @source, @source_id, @name, @name_id, @brand, @categories, @serving_size_g,
      @kcal_per_100g, @protein_per_100g, @fat_per_100g, @saturated_fat_per_100g,
      @carb_per_100g, @sugar_per_100g, @fiber_per_100g, @salt_per_100g, @sodium_per_100g,
      @countries, @image_url, @raw_json, datetime('now')
    )
    ON CONFLICT(source, source_id) DO UPDATE SET
      name=excluded.name,
      name_id=excluded.name_id,
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
      salt_per_100g=excluded.salt_per_100g,
      sodium_per_100g=excluded.sodium_per_100g,
      countries=excluded.countries,
      image_url=excluded.image_url,
      raw_json=excluded.raw_json,
      scraped_at=excluded.scraped_at
  `);

  const runInsert = db.prepare(`
    INSERT INTO scrape_runs (source, started_at, status)
    VALUES (?, datetime('now'), 'running')
  `);
  const runUpdate = db.prepare(`
    UPDATE scrape_runs
    SET finished_at=datetime('now'),
        pages_scraped=?, items_inserted=?, items_updated=?,
        status=?, error=?, last_page=?
    WHERE id=?
  `);

  const runResult = runInsert.run("openfoodfacts");
  const runId = Number(runResult.lastInsertRowid);

  let totalInserted = 0;
  let totalUpdated = 0;
  let totalAvailable = 0;
  let lastPage = startPage - 1;

  try {
    for (let i = 0; i < pages; i++) {
      const page = startPage + i;
      const url = new URL(OFF_API_BASE);
      url.searchParams.set("countries_tags_en", country);
      url.searchParams.set("fields", DEFAULT_FIELDS);
      url.searchParams.set("page", String(page));
      url.searchParams.set("page_size", String(pageSize));

      const res = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        throw new Error(`OFF API ${res.status} ${res.statusText} on page ${page}`);
      }
      const json = (await res.json()) as OffResponse;
      const products = json.products ?? [];
      totalAvailable = json.count ?? totalAvailable;

      let inserted = 0;
      let updated = 0;
      const insertMany = db.transaction((items: OffProduct[]) => {
        for (const p of items) {
          const mapped = mapProduct(p);
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
      insertMany(products);

      totalInserted += inserted;
      totalUpdated += updated;
      lastPage = page;

      onProgress?.({
        page,
        totalPages: json.page_count ?? 0,
        itemsOnPage: products.length,
        inserted,
        updated,
        cumulativeInserted: totalInserted,
        cumulativeUpdated: totalUpdated,
      });

      if (products.length === 0) break;
      if (json.page_count && page >= json.page_count) break;

      if (i < pages - 1 && rateLimitMs > 0) {
        await new Promise((r) => setTimeout(r, rateLimitMs));
      }
    }

    runUpdate.run(
      pages,
      totalInserted,
      totalUpdated,
      "success",
      null,
      lastPage,
      runId,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    runUpdate.run(
      lastPage - startPage + 1,
      totalInserted,
      totalUpdated,
      "error",
      msg,
      lastPage,
      runId,
    );
    throw err;
  }

  db.prepare("UPDATE sources SET last_scraped = datetime('now') WHERE name = ?").run(
    "openfoodfacts",
  );

  return {
    pagesScraped: lastPage - startPage + 1,
    itemsInserted: totalInserted,
    itemsUpdated: totalUpdated,
    totalAvailable,
    lastPage,
  };
}
