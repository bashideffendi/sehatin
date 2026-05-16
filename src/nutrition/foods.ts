/**
 * Food query helpers — abstraction over `foods` table for meal planning.
 * Returns plain objects, no Drizzle ORM (keep deps minimal).
 */
import type Database from "better-sqlite3";

export interface Food {
  id: string;
  source: string;
  source_id: string;
  name: string;
  name_id: string | null;
  categories: string | null;
  serving_size_g: number | null;
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  fat_per_100g: number | null;
  carb_per_100g: number | null;
  fiber_per_100g: number | null;
  sodium_per_100g: number | null;
  raw_json: string | null;
}

export interface FoodFilter {
  source?: string;
  kategori?: string; // first segment of categories (Buah, Daging, etc)
  tipe?: "Mentah (Raw)" | "Olahan (Processed)";
  minProtein?: number; // per 100g
  maxKcal?: number; // per 100g
  search?: string; // substring on name (case-insensitive)
  limit?: number;
  random?: boolean;
}

const ALL_KATEGORI = [
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

export function listKategori(): string[] {
  return ALL_KATEGORI.slice();
}

export function findFoods(db: Database.Database, filter: FoodFilter): Food[] {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filter.source) {
    where.push("source = ?");
    params.push(filter.source);
  }
  if (filter.kategori) {
    where.push("categories LIKE ?");
    params.push(`${filter.kategori}%`);
  }
  if (filter.tipe) {
    where.push("categories LIKE ?");
    params.push(`%${filter.tipe}`);
  }
  if (typeof filter.minProtein === "number") {
    where.push("protein_per_100g >= ?");
    params.push(filter.minProtein);
  }
  if (typeof filter.maxKcal === "number") {
    where.push("kcal_per_100g <= ?");
    params.push(filter.maxKcal);
  }
  if (filter.search) {
    where.push("(name LIKE ? OR name_id LIKE ?)");
    const pat = `%${filter.search}%`;
    params.push(pat, pat);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const orderClause = filter.random ? "ORDER BY RANDOM()" : "ORDER BY name";
  const limitClause =
    typeof filter.limit === "number" ? `LIMIT ${filter.limit}` : "";

  const sql = `SELECT * FROM foods ${whereClause} ${orderClause} ${limitClause}`;
  return db.prepare(sql).all(...params) as Food[];
}

export function countFoods(db: Database.Database, filter: FoodFilter): number {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filter.source) {
    where.push("source = ?");
    params.push(filter.source);
  }
  if (filter.kategori) {
    where.push("categories LIKE ?");
    params.push(`${filter.kategori}%`);
  }
  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const sql = `SELECT COUNT(*) as n FROM foods ${whereClause}`;
  return (db.prepare(sql).get(...params) as { n: number }).n;
}

/**
 * Build a curated meal pool for Claude.
 *
 * Strategy: balanced selection across kategori, biased toward whole foods
 * (Mentah > Olahan) for healthy default. Caller can override.
 */
export interface MealPoolOptions {
  perCategory?: number; // default 15 per category
  includeOlahan?: boolean; // default false (mostly raw)
  excludeKategori?: string[];
  maxKcalPer100g?: number; // optional cap
}

export interface CompactFood {
  code: string;
  name: string;
  cat: string;
  type: "raw" | "proc";
  kcal: number | null;
  p: number | null; // protein g
  f: number | null; // fat g
  c: number | null; // carb g
  fib: number | null; // fiber g
}

export function buildMealPool(
  db: Database.Database,
  opts: MealPoolOptions = {},
): CompactFood[] {
  const perCategory = opts.perCategory ?? 15;
  const includeOlahan = opts.includeOlahan ?? false;
  const excludeKategori = new Set(opts.excludeKategori ?? []);

  const pool: CompactFood[] = [];
  for (const kategori of ALL_KATEGORI) {
    if (excludeKategori.has(kategori)) continue;

    const filter: FoodFilter = {
      source: "tkpi",
      kategori,
      limit: perCategory,
      random: true,
    };
    if (!includeOlahan) filter.tipe = "Mentah (Raw)";
    if (opts.maxKcalPer100g) filter.maxKcal = opts.maxKcalPer100g;

    const foods = findFoods(db, filter);
    for (const f of foods) {
      const isProc = (f.categories ?? "").includes("Olahan");
      pool.push({
        code: f.source_id,
        name: f.name,
        cat: kategori,
        type: isProc ? "proc" : "raw",
        kcal: f.kcal_per_100g,
        p: f.protein_per_100g,
        f: f.fat_per_100g,
        c: f.carb_per_100g,
        fib: f.fiber_per_100g,
      });
    }
  }
  return pool;
}

/** Compact prices summary: median price per commodity at user's region/jenis pasar. */
export interface CompactPrice {
  c: number; // commodity_id
  name: string;
  province: string;
  price_idr: number; // per kg/unit
  market: "tradisional" | "modern";
  date: string;
}

export function getPricesForRegion(
  db: Database.Database,
  provinceId: number | "national",
  marketType: 1 | 2 = 1, // 1 = Tradisional, 2 = Modern
): CompactPrice[] {
  let sql: string;
  let params: unknown[];

  if (provinceId === "national") {
    // average across all provinces per commodity
    sql = `
      SELECT commodity_id as c,
             commodity_name as name,
             'Nasional' as province,
             ROUND(AVG(nilai)) as price_idr,
             tanggal_data as date,
             price_type_id as ptid
      FROM prices
      WHERE source = 'pihps' AND price_type_id = ?
      GROUP BY commodity_id, tanggal_data
      ORDER BY commodity_id
    `;
    params = [marketType];
  } else {
    sql = `
      SELECT commodity_id as c,
             commodity_name as name,
             province_name as province,
             nilai as price_idr,
             tanggal_data as date,
             price_type_id as ptid
      FROM prices
      WHERE source = 'pihps' AND price_type_id = ? AND province_id = ?
      ORDER BY commodity_id
    `;
    params = [marketType, provinceId];
  }

  const rows = db.prepare(sql).all(...params) as Array<{
    c: number;
    name: string;
    province: string;
    price_idr: number;
    date: string;
    ptid: number;
  }>;

  return rows.map((r) => ({
    c: r.c,
    name: r.name,
    province: r.province,
    price_idr: r.price_idr,
    market: r.ptid === 1 ? "tradisional" : "modern",
    date: r.date,
  }));
}
