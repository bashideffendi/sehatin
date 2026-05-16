import { getDb, getDbPath } from "../src/db/client.ts";

const db = getDb(getDbPath());

const totals = db
  .prepare(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN kcal_per_100g IS NOT NULL THEN 1 ELSE 0 END) as with_kcal,
       SUM(CASE WHEN protein_per_100g IS NOT NULL THEN 1 ELSE 0 END) as with_protein,
       SUM(CASE WHEN brand IS NOT NULL AND brand != '' THEN 1 ELSE 0 END) as with_brand
     FROM foods`,
  )
  .get() as {
  total: number;
  with_kcal: number;
  with_protein: number;
  with_brand: number;
};

console.log("=== Sehatin Food DB Stats ===\n");
console.log(`Total foods:           ${totals.total.toLocaleString()}`);
console.log(`  with kcal data:      ${totals.with_kcal.toLocaleString()} (${pct(totals.with_kcal, totals.total)})`);
console.log(`  with protein data:   ${totals.with_protein.toLocaleString()} (${pct(totals.with_protein, totals.total)})`);
console.log(`  with brand:          ${totals.with_brand.toLocaleString()} (${pct(totals.with_brand, totals.total)})`);

const bySource = db
  .prepare("SELECT source, COUNT(*) as c FROM foods GROUP BY source ORDER BY c DESC")
  .all() as { source: string; c: number }[];
console.log("\nBy source:");
for (const s of bySource) console.log(`  - ${s.source}: ${s.c.toLocaleString()}`);

const topBrands = db
  .prepare(
    `SELECT brand, COUNT(*) as c FROM foods
     WHERE brand IS NOT NULL AND brand != ''
     GROUP BY brand ORDER BY c DESC LIMIT 10`,
  )
  .all() as { brand: string; c: number }[];
console.log("\nTop 10 brands:");
for (const b of topBrands) console.log(`  - ${b.brand}: ${b.c}`);

const runs = db
  .prepare(
    `SELECT source, started_at, finished_at, items_inserted, items_updated, status, error
     FROM scrape_runs ORDER BY id DESC LIMIT 5`,
  )
  .all() as Array<{
  source: string;
  started_at: string;
  finished_at: string | null;
  items_inserted: number;
  items_updated: number;
  status: string;
  error: string | null;
}>;
console.log("\nRecent scrape runs:");
for (const r of runs) {
  console.log(
    `  - ${r.source} @ ${r.started_at} [${r.status}]  ins=${r.items_inserted} upd=${r.items_updated}${r.error ? "  err=" + r.error : ""}`,
  );
}

const samples = db
  .prepare(
    `SELECT name, brand, kcal_per_100g, protein_per_100g, fat_per_100g, carb_per_100g
     FROM foods
     WHERE kcal_per_100g IS NOT NULL AND brand IS NOT NULL
     ORDER BY scraped_at DESC LIMIT 10`,
  )
  .all() as Array<{
  name: string;
  brand: string;
  kcal_per_100g: number;
  protein_per_100g: number | null;
  fat_per_100g: number | null;
  carb_per_100g: number | null;
}>;
console.log("\nSample 10 foods (most recent w/ kcal+brand):");
for (const s of samples) {
  console.log(
    `  - ${s.name} (${s.brand}) — ${s.kcal_per_100g} kcal, P${s.protein_per_100g ?? "-"} F${s.fat_per_100g ?? "-"} C${s.carb_per_100g ?? "-"} /100g`,
  );
}

db.close();

function pct(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}
