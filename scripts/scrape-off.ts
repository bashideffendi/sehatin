import { parseArgs } from "node:util";
import { getDb, getDbPath } from "../src/db/client.ts";
import { createSchema } from "../src/db/schema.ts";
import { scrapeOpenFoodFacts } from "../src/scrapers/openfoodfacts.ts";

const { values } = parseArgs({
  options: {
    pages: { type: "string", default: "5" },
    "page-size": { type: "string", default: "100" },
    "start-page": { type: "string", default: "1" },
    country: { type: "string", default: "indonesia" },
    "rate-limit": { type: "string" },
  },
});

const pages = Number(values.pages);
const pageSize = Number(values["page-size"]);
const startPage = Number(values["start-page"]);
const country = String(values.country);
const rateLimitMs = values["rate-limit"]
  ? Number(values["rate-limit"])
  : undefined;

if (!Number.isInteger(pages) || pages < 1) {
  console.error("--pages harus integer >= 1");
  process.exit(1);
}

const db = getDb(getDbPath());
createSchema(db);

console.log(`Scraping Open Food Facts — country=${country}, pages=${pages}, pageSize=${pageSize}, startPage=${startPage}`);
console.log("");

const t0 = Date.now();
try {
  const result = await scrapeOpenFoodFacts({
    db,
    pages,
    pageSize,
    startPage,
    country,
    rateLimitMs,
    onProgress: (p) => {
      const totalStr = p.totalPages ? `/${p.totalPages}` : "";
      console.log(
        `  page ${p.page}${totalStr}: ${p.itemsOnPage} items (${p.inserted} new, ${p.updated} updated) — cumulative: ${p.cumulativeInserted + p.cumulativeUpdated}`,
      );
    },
  });

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log("");
  console.log(`Done in ${elapsed}s`);
  console.log(`  Pages scraped:     ${result.pagesScraped}`);
  console.log(`  Items inserted:    ${result.itemsInserted}`);
  console.log(`  Items updated:     ${result.itemsUpdated}`);
  console.log(`  Total available:   ${result.totalAvailable.toLocaleString()}`);
  console.log(`  Last page:         ${result.lastPage}`);

  const total = db.prepare("SELECT COUNT(*) as c FROM foods").get() as { c: number };
  const withKcal = db
    .prepare("SELECT COUNT(*) as c FROM foods WHERE kcal_per_100g IS NOT NULL")
    .get() as { c: number };
  console.log("");
  console.log(`DB now has ${total.c} foods total (${withKcal.c} with kcal data)`);
} catch (err) {
  console.error("Scrape failed:", err);
  process.exit(1);
} finally {
  db.close();
}
