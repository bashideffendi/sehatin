import { getDb, getDbPath } from "../src/db/client.ts";
import { createSchema } from "../src/db/schema.ts";

const dbPath = getDbPath();
const db = getDb(dbPath);
createSchema(db);

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all() as { name: string }[];

console.log(`DB initialized at ${dbPath}`);
console.log("Tables:");
for (const t of tables) console.log(`  - ${t.name}`);

const sources = db
  .prepare("SELECT name, url, license FROM sources")
  .all() as { name: string; url: string; license: string }[];
console.log("\nSeeded sources:");
for (const s of sources) console.log(`  - ${s.name} (${s.license})`);

db.close();
