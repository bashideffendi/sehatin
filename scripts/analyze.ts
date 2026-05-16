/**
 * Food photo analyzer CLI.
 *
 * Usage:
 *   tsx scripts/analyze.ts --image path/to/photo.jpg
 *   tsx scripts/analyze.ts --image photo.jpg --note "sarapan saya" --dry-run
 */
import dotenv from "dotenv";
dotenv.config({ override: true });
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getDb, getDbPath } from "../src/db/client.ts";
import { analyzePhoto, formatAnalysis } from "../src/nutrition/analyze.ts";

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const nxt = argv[i + 1];
      if (nxt === undefined || nxt.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = nxt;
        i++;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv);

if (!args.image) {
  console.error("Usage: tsx scripts/analyze.ts --image PATH [--note \"...\"] [--dry-run] [--no-olahan]");
  process.exit(1);
}

const imagePath = resolve(String(args.image));
if (!existsSync(imagePath)) {
  console.error(`Image not found: ${imagePath}`);
  process.exit(1);
}

const dryRun = args["dry-run"] === true;
const includeOlahan = args["no-olahan"] !== true;

console.log(`Image: ${imagePath}`);
if (args.note) console.log(`Note:  ${args.note}`);
console.log(`Mode:  ${dryRun ? "DRY RUN (no API call)" : "REAL (Claude vision)"}`);
console.log("");

const db = getDb(getDbPath());

const result = await analyzePhoto(
  db,
  { path: imagePath },
  {
    dryRun,
    includeOlahan,
    userNote: args.note ? String(args.note) : undefined,
  },
);

console.log(formatAnalysis(result));

if (dryRun) {
  console.log("");
  console.log("--- Pool sample (first 15 items) ---");
  for (const f of result.pool.slice(0, 15)) {
    console.log(`  ${f.code}  ${f.name.padEnd(45)} ${f.cat.padEnd(20)} ${f.kcal} kcal`);
  }
  console.log(`  ... ${result.pool.length - 15} more`);
}

db.close();
