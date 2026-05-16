/**
 * Export compact TKPI foods data → public/foods.json untuk client-side search.
 *
 * Output: { generated_at, count, foods: [{code, name, kategori, tipe, kcal, p, f, c}] }
 * Size estimate: ~150 KB untuk 1,146 items.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getDb, getDbPath } from "../src/db/client.ts";

interface FoodRow {
  source_id: string;
  name: string;
  categories: string | null;
  kcal_per_100g: number | null;
  protein_per_100g: number | null;
  fat_per_100g: number | null;
  carb_per_100g: number | null;
  fiber_per_100g: number | null;
}

interface CompactFoodOut {
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

const db = getDb(getDbPath());
const rows = db
  .prepare(`
    SELECT source_id, name, categories,
           kcal_per_100g, protein_per_100g, fat_per_100g, carb_per_100g, fiber_per_100g
    FROM foods
    WHERE source = 'tkpi'
    ORDER BY name
  `)
  .all() as FoodRow[];

const foods: CompactFoodOut[] = rows.map((r) => {
  const cats = (r.categories ?? "").split(",").map((s) => s.trim());
  const kategori = cats[0] ?? "Lain";
  const tipe = (cats[1] ?? "").includes("Olahan") ? "Olahan" : "Mentah";
  return {
    code: r.source_id,
    name: r.name,
    kategori,
    tipe,
    kcal: r.kcal_per_100g,
    p: r.protein_per_100g,
    f: r.fat_per_100g,
    c: r.carb_per_100g,
    fib: r.fiber_per_100g,
  };
});

const output = {
  generated_at: new Date().toISOString(),
  source: "TKPI Kemenkes RI via Sehatin SQLite",
  count: foods.length,
  foods,
};

const publicDir = join(process.cwd(), "public");
mkdirSync(publicDir, { recursive: true });
const outPath = join(publicDir, "foods.json");
writeFileSync(outPath, JSON.stringify(output));

const size = (JSON.stringify(output).length / 1024).toFixed(1);
console.log(`Exported ${foods.length} foods → ${outPath} (${size} KB)`);

db.close();
