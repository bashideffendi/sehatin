/**
 * Scrape USDA FoodData Central buat foods yang TKPI gak punya/jelek:
 *  - International proteins (salmon, sardines, tuna kalengan)
 *  - Dairy modern (greek yogurt, cottage cheese, mozzarella)
 *  - Western breakfast (oats, granola, peanut butter)
 *  - Exotic veggies (kale, asparagus, brussels sprouts)
 *  - Western fruits (blueberry, strawberry, raspberry, kiwi)
 *  - Grains alt (quinoa, barley, buckwheat)
 *  - Chain restaurant items (McDonald's, KFC, Starbucks, Subway)
 *
 * Run: USDA_API_KEY=xxx npm run scrape:usda
 * Tanpa API key, pake DEMO_KEY (30 req/hour limit).
 * Daftar API key gratis: https://api.data.gov/signup/
 */
import "dotenv/config";
import { getDb, getDbPath } from "../src/db/client.ts";
import { createSchema } from "../src/db/schema.ts";
import { scrapeUsda } from "../src/scrapers/usda.ts";

// Curated query list — fokus ke gap yang TKPI gak cover well.
// Skip nasi/ayam/sayur dasar yang TKPI udah punya.
const QUERIES = [
  // === International proteins ===
  "salmon raw",
  "salmon cooked",
  "sardines canned",
  "tuna canned in water",
  "shrimp cooked",
  "chicken breast skinless roasted",
  "ground beef cooked",
  "egg whole boiled",
  // === Dairy modern ===
  "greek yogurt plain nonfat",
  "cottage cheese low fat",
  "mozzarella cheese",
  "cheddar cheese",
  "ricotta cheese",
  "milk whole",
  "almond milk unsweetened",
  // === Western breakfast ===
  "oats rolled",
  "granola",
  "peanut butter smooth",
  "almond butter",
  "honey",
  "maple syrup",
  // === Exotic veggies ===
  "kale raw",
  "asparagus raw",
  "brussels sprouts raw",
  "bell pepper red raw",
  "zucchini raw",
  "mushroom button",
  // === Western fruits ===
  "blueberry raw",
  "strawberry raw",
  "raspberry raw",
  "kiwi green raw",
  "grapes raw",
  "pineapple raw",
  // === Grain alternatives ===
  "quinoa cooked",
  "barley cooked",
  "buckwheat cooked",
  "wild rice cooked",
  "pasta whole wheat cooked",
  // === Nuts & seeds ===
  "almonds raw",
  "walnuts raw",
  "cashew nuts raw",
  "chia seeds",
  "flax seeds",
  "sunflower seeds",
  // === Fats ===
  "olive oil",
  "coconut oil",
  "avocado oil",
  // === Chain restaurant ===
  "McDonald's Big Mac",
  "McDonald's chicken nuggets",
  "KFC Original Recipe Chicken",
  "Starbucks Caffe Latte",
  "Subway 6 inch turkey",
];

const db = getDb(getDbPath());
createSchema(db);

const apiKey = process.env.USDA_API_KEY ?? "DEMO_KEY";
const isDemo = apiKey === "DEMO_KEY";

console.log(`USDA FoodData Central — ${QUERIES.length} queries`);
if (isDemo) {
  console.log("⚠️  Pakai DEMO_KEY (30 req/hour). Set USDA_API_KEY env buat 1000/hour.");
  console.log("    Daftar gratis: https://api.data.gov/signup/");
}
console.log("");

const t0 = Date.now();
try {
  const result = await scrapeUsda({
    db,
    apiKey,
    queries: QUERIES,
    resultsPerQuery: 3,
    rateLimitMs: isDemo ? 2500 : 600,
    onProgress: (p) => {
      const status = p.found === 0 ? "❌" : "✓";
      console.log(
        `  ${status} "${p.query}" — ${p.found} found, ${p.inserted} new, ${p.updated} updated`,
      );
    },
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log("");
  console.log(`Done in ${elapsed}s`);
  console.log(`  Queries run:     ${result.queriesRun}`);
  console.log(`  Items inserted:  ${result.itemsInserted}`);
  console.log(`  Items updated:   ${result.itemsUpdated}`);
  if (result.errors.length > 0) {
    console.log(`  Errors:          ${result.errors.length}`);
    for (const e of result.errors.slice(0, 5)) {
      console.log(`    - "${e.query}": ${e.error.slice(0, 100)}`);
    }
  }

  const totalUsda = db
    .prepare("SELECT COUNT(*) as c FROM foods WHERE source = 'usda'")
    .get() as { c: number };
  const total = db.prepare("SELECT COUNT(*) as c FROM foods").get() as {
    c: number;
  };
  console.log("");
  console.log(`DB now has ${total.c} foods total (${totalUsda.c} from USDA)`);
} catch (err) {
  console.error("USDA scrape failed:", err);
  process.exit(1);
} finally {
  db.close();
}
