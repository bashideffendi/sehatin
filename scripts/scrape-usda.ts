/**
 * Scrape USDA FoodData Central — broad coverage of foods Indonesian users
 * search for. Includes Branded foods (chain restaurants + packaged products)
 * for much wider coverage.
 *
 * Run: USDA_API_KEY=xxx npm run scrape:usda
 */
import "dotenv/config";
import { getDb, getDbPath } from "../src/db/client.ts";
import { createSchema } from "../src/db/schema.ts";
import { scrapeUsda } from "../src/scrapers/usda.ts";

// Broader query list — single-word terms get more results.
// Mix of: proteins, dairy, veggies, fruits, grains, nuts/seeds, oils,
// snacks, drinks, condiments, restaurant chains.
const QUERIES = [
  // === Proteins ===
  "salmon",
  "tuna",
  "sardines",
  "mackerel",
  "shrimp",
  "lobster",
  "crab",
  "chicken breast",
  "chicken thigh",
  "chicken wing",
  "turkey breast",
  "beef sirloin",
  "beef ground",
  "pork chop",
  "lamb",
  "duck",
  "tofu firm",
  "tempeh",
  "egg whole",
  "egg white",
  // === Dairy ===
  "yogurt greek",
  "yogurt regular",
  "cheese mozzarella",
  "cheese cheddar",
  "cheese feta",
  "cheese cottage",
  "milk whole",
  "milk skim",
  "milk almond",
  "milk soy",
  "milk oat",
  "butter unsalted",
  "cream cheese",
  // === Vegetables ===
  "spinach",
  "kale",
  "broccoli",
  "cauliflower",
  "carrot",
  "tomato",
  "cucumber",
  "lettuce",
  "onion",
  "garlic",
  "ginger",
  "bell pepper",
  "zucchini",
  "asparagus",
  "brussels sprouts",
  "mushroom",
  "eggplant",
  "celery",
  "sweet potato",
  "potato",
  // === Fruits ===
  "banana",
  "apple",
  "orange",
  "mango",
  "strawberry",
  "blueberry",
  "raspberry",
  "grapes",
  "watermelon",
  "papaya",
  "pineapple",
  "kiwi",
  "avocado",
  "lemon",
  "lime",
  // === Grains & legumes ===
  "rice white",
  "rice brown",
  "quinoa",
  "oats",
  "barley",
  "pasta",
  "bread whole wheat",
  "lentils",
  "chickpeas",
  "black beans",
  "kidney beans",
  // === Nuts & seeds ===
  "almonds",
  "walnuts",
  "cashews",
  "peanuts",
  "pistachios",
  "chia seeds",
  "flax seeds",
  "sunflower seeds",
  "pumpkin seeds",
  "sesame seeds",
  // === Oils & fats ===
  "olive oil",
  "coconut oil",
  "avocado oil",
  "canola oil",
  // === Sweeteners ===
  "honey",
  "maple syrup",
  "sugar brown",
  // === Snacks ===
  "popcorn",
  "potato chips",
  "tortilla chips",
  "protein bar",
  "granola bar",
  // === Beverages ===
  "coffee black",
  "tea green",
  "orange juice",
  "coconut water",
  // === Restaurant chains (Branded) ===
  "McDonald's",
  "KFC",
  "Starbucks",
  "Subway",
  "Burger King",
  "Pizza Hut",
  "Domino's",
  // === Condiments ===
  "soy sauce",
  "mayonnaise",
  "ketchup",
  "mustard",
  "hot sauce",
  "salsa",
];

const db = getDb(getDbPath());
createSchema(db);

const apiKey = process.env.USDA_API_KEY ?? "DEMO_KEY";
const isDemo = apiKey === "DEMO_KEY";

console.log(`USDA FoodData Central — ${QUERIES.length} queries`);
if (isDemo) {
  console.log("⚠️  DEMO_KEY: 30 req/jam. Set USDA_API_KEY di .env.");
}
console.log("");

const t0 = Date.now();
try {
  const result = await scrapeUsda({
    db,
    apiKey,
    queries: QUERIES,
    resultsPerQuery: 10,
    dataTypes: ["Foundation", "SR Legacy", "Branded"],
    rateLimitMs: isDemo ? 2500 : 350,
    onProgress: (p) => {
      const status = p.found === 0 ? "❌" : "✓";
      console.log(
        `  ${status} "${p.query}" — ${p.found} found, ${p.inserted} new, ${p.updated} upd`,
      );
    },
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log("");
  console.log(`Done in ${elapsed}s`);
  console.log(`  Queries:         ${result.queriesRun}`);
  console.log(`  Items inserted:  ${result.itemsInserted}`);
  console.log(`  Items updated:   ${result.itemsUpdated}`);
  if (result.errors.length > 0) {
    console.log(`  Errors:          ${result.errors.length}`);
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
