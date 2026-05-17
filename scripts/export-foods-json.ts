/**
 * Export compact foods data → public/foods.json untuk client-side search.
 *
 * Includes:
 *   - TKPI Kemenkes (bahan + makanan tradisional Indonesia)
 *   - OpenFoodFacts ID (produk kemasan branded: Indomie, Sosro, Coca-Cola, dll)
 *
 * Output: { generated_at, count, foods: [{code, name, kategori, tipe, kcal, p, f, c, fib}] }
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getDb, getDbPath } from "../src/db/client.ts";

interface FoodRow {
  source: string;
  source_id: string;
  name: string;
  brand: string | null;
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

// Pull TKPI + OFF + USDA together. OFF always Olahan, USDA mostly Mentah.
const rows = db
  .prepare(`
    SELECT source, source_id, name, brand, categories,
           kcal_per_100g, protein_per_100g, fat_per_100g, carb_per_100g, fiber_per_100g
    FROM foods
    WHERE source IN ('tkpi', 'openfoodfacts', 'usda')
      AND kcal_per_100g IS NOT NULL
    ORDER BY source, name
  `)
  .all() as FoodRow[];

const foods: CompactFoodOut[] = rows.map((r) => {
  if (r.source === "tkpi") {
    const cats = (r.categories ?? "").split(",").map((s) => s.trim());
    const kategori = cats[0] ?? "Lain";
    const tipe: "Mentah" | "Olahan" = (cats[1] ?? "").includes("Olahan")
      ? "Olahan"
      : "Mentah";
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
  }
  if (r.source === "usda") {
    // USDA — international/global foods. Names in English, helpful for
    // user searches like 'salmon', 'kale', 'quinoa', 'greek yogurt'.
    const cats = (r.categories ?? "").toLowerCase();
    let kategori = "Global (USDA)";
    if (cats.includes("dairy")) kategori = "Susu/Yoghurt (USDA)";
    else if (cats.includes("fish") || cats.includes("seafood"))
      kategori = "Ikan/Seafood (USDA)";
    else if (cats.includes("poultry") || cats.includes("beef"))
      kategori = "Daging (USDA)";
    else if (cats.includes("vegetable")) kategori = "Sayur (USDA)";
    else if (cats.includes("fruit")) kategori = "Buah (USDA)";
    else if (cats.includes("nut")) kategori = "Kacang (USDA)";
    else if (cats.includes("grain") || cats.includes("cereal"))
      kategori = "Serealia (USDA)";
    return {
      code: `USDA-${r.source_id}`,
      name: r.name,
      kategori,
      tipe: r.name.toLowerCase().includes("cooked") ? "Olahan" : "Mentah",
      kcal: r.kcal_per_100g,
      p: r.protein_per_100g,
      f: r.fat_per_100g,
      c: r.carb_per_100g,
      fib: r.fiber_per_100g,
    };
  }
  // OpenFoodFacts — packaged branded product
  const name = r.brand
    ? `${r.name} (${r.brand.split(",")[0]?.trim()})`
    : r.name;
  const cats = (r.categories ?? "").toLowerCase();
  let kategori = "Produk kemasan";
  if (cats.includes("beverage") || cats.includes("drink") || cats.includes("minuman"))
    kategori = "Minuman kemasan";
  else if (cats.includes("snack") || cats.includes("chip") || cats.includes("camilan"))
    kategori = "Snack kemasan";
  else if (cats.includes("dairy") || cats.includes("milk") || cats.includes("susu"))
    kategori = "Susu kemasan";
  else if (cats.includes("noodle") || cats.includes("mie") || cats.includes("pasta"))
    kategori = "Mie kemasan";
  else if (cats.includes("bread") || cats.includes("roti") || cats.includes("bakery"))
    kategori = "Roti kemasan";
  else if (cats.includes("breakfast") || cats.includes("cereal") || cats.includes("sereal"))
    kategori = "Sarapan kemasan";
  return {
    code: `OFF-${r.source_id}`,
    name,
    kategori,
    tipe: "Olahan",
    kcal: r.kcal_per_100g,
    p: r.protein_per_100g,
    f: r.fat_per_100g,
    c: r.carb_per_100g,
    fib: r.fiber_per_100g,
  };
});

const output = {
  generated_at: new Date().toISOString(),
  source: "TKPI Kemenkes + OpenFoodFacts Indonesia via Sehatin SQLite",
  count: foods.length,
  foods,
};

const publicDir = join(process.cwd(), "public");
mkdirSync(publicDir, { recursive: true });
const outPath = join(publicDir, "foods.json");
writeFileSync(outPath, JSON.stringify(output));

const size = (JSON.stringify(output).length / 1024).toFixed(1);
const offCount = foods.filter((f) => f.code.startsWith("OFF-")).length;
const usdaCount = foods.filter((f) => f.code.startsWith("USDA-")).length;
const tkpiCount = foods.length - offCount - usdaCount;
console.log(`Exported ${foods.length} foods → ${outPath} (${size} KB)`);
console.log(`  TKPI: ${tkpiCount} · OpenFoodFacts: ${offCount} · USDA: ${usdaCount}`);

db.close();
