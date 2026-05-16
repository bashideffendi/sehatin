/**
 * Import PIHPS CSV → SQLite prices table.
 *
 * Source: D:\Claude-Projects\web-apps\health\sehatin\data\pihps-YYYY-MM-DD.csv
 * Maps:   commodity-map.json, province-map.json, price-type-map.json
 *
 * Usage:
 *   tsx scripts/import-pihps.ts                       # default: latest CSV in data/
 *   tsx scripts/import-pihps.ts --file pihps-2026-05-16.csv
 *   tsx scripts/import-pihps.ts --date 2026-05-16
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getDb, getDbPath } from "../src/db/client.ts";
import { createSchema } from "../src/db/schema.ts";

interface Maps {
  commodity: Record<string, string>;
  province: Record<string, string>;
  priceType: Record<string, string>;
}

interface CsvRow {
  c: number;
  p: number;
  pid: number;
  nilai: number;
  diff: number | null;
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const value = argv[i + 1] ?? "";
      args[key] = value;
      i++;
    }
  }
  return args;
}

function loadMaps(dataDir: string): Maps {
  return {
    commodity: JSON.parse(
      readFileSync(join(dataDir, "commodity-map.json"), "utf-8"),
    ),
    province: JSON.parse(
      readFileSync(join(dataDir, "province-map.json"), "utf-8"),
    ),
    priceType: JSON.parse(
      readFileSync(join(dataDir, "price-type-map.json"), "utf-8"),
    ),
  };
}

function findLatestCsv(dataDir: string): string {
  const files = readdirSync(dataDir).filter(
    (f) => f.startsWith("pihps-") && f.endsWith(".csv"),
  );
  if (files.length === 0) {
    throw new Error(`No pihps-*.csv files in ${dataDir}`);
  }
  files.sort();
  return files[files.length - 1];
}

function dateFromFilename(filename: string): string {
  // pihps-2026-05-16.csv → 2026-05-16
  const m = filename.match(/pihps-(\d{4}-\d{2}-\d{2})\.csv/);
  if (!m) throw new Error(`Cannot parse date from filename: ${filename}`);
  return m[1];
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines[0];
  if (header !== "c,p,pid,nilai,diff") {
    throw new Error(`Unexpected header: ${header}`);
  }
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length !== 5) {
      console.warn(`Skipping row ${i + 1}: wrong column count: ${lines[i]}`);
      continue;
    }
    const diff = parts[4].trim() === "" ? null : Number.parseFloat(parts[4]);
    rows.push({
      c: Number.parseInt(parts[0], 10),
      p: Number.parseInt(parts[1], 10),
      pid: Number.parseInt(parts[2], 10),
      nilai: Number.parseInt(parts[3], 10),
      diff: Number.isNaN(diff ?? 0) ? null : diff,
    });
  }
  return rows;
}

async function main() {
  const args = parseArgs(process.argv);
  const dataDir = join(process.cwd(), "data");
  const filename = args.file ?? findLatestCsv(dataDir);
  const csvPath = join(dataDir, filename);
  const tanggal_data = args.date ?? dateFromFilename(filename);

  console.log(`Loading CSV: ${csvPath}`);
  console.log(`Tanggal data: ${tanggal_data}`);

  const maps = loadMaps(dataDir);
  const csvContent = readFileSync(csvPath, "utf-8");
  const rows = parseCsv(csvContent);
  console.log(`Parsed ${rows.length} rows`);

  const dbPath = getDbPath();
  const db = getDb(dbPath);
  createSchema(db);

  // Insert scrape_run record
  const runInsert = db.prepare(`
    INSERT INTO scrape_runs (source, started_at, status, items_inserted)
    VALUES (?, ?, ?, ?)
  `);
  const runResult = runInsert.run(
    "pihps",
    new Date().toISOString(),
    "running",
    0,
  );
  const runId = runResult.lastInsertRowid as number;

  // Prepare upsert
  const upsert = db.prepare(`
    INSERT INTO prices (
      source, commodity_id, commodity_name,
      price_type_id, price_type_name,
      province_id, province_name,
      nilai, diff_pct, tanggal_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source, commodity_id, price_type_id, province_id, tanggal_data)
    DO UPDATE SET
      nilai = excluded.nilai,
      diff_pct = excluded.diff_pct,
      scraped_at = datetime('now')
  `);

  let inserted = 0;
  let skipped = 0;
  const skippedDetails: string[] = [];

  const tx = db.transaction((rs: CsvRow[]) => {
    for (const r of rs) {
      const commodity_name = maps.commodity[String(r.c)];
      const price_type_name = maps.priceType[String(r.p)];
      const province_name = maps.province[String(r.pid)];

      if (!commodity_name || !price_type_name || !province_name) {
        skipped++;
        skippedDetails.push(
          `c=${r.c} p=${r.p} pid=${r.pid} (missing: ${[
            !commodity_name && "commodity",
            !price_type_name && "priceType",
            !province_name && "province",
          ]
            .filter(Boolean)
            .join(",")})`,
        );
        continue;
      }

      upsert.run(
        "pihps",
        r.c,
        commodity_name,
        r.p,
        price_type_name,
        r.pid,
        province_name,
        r.nilai,
        r.diff,
        tanggal_data,
      );
      inserted++;
    }
  });

  tx(rows);

  // Update scrape_run
  db.prepare(`
    UPDATE scrape_runs
    SET finished_at = ?, status = ?, items_inserted = ?
    WHERE id = ?
  `).run(new Date().toISOString(), "success", inserted, runId);

  // Update sources.last_scraped
  db.prepare(`UPDATE sources SET last_scraped = ? WHERE name = 'pihps'`).run(
    new Date().toISOString(),
  );

  // Stats
  const totalInDb = (
    db
      .prepare(
        `SELECT COUNT(*) as n FROM prices WHERE source = 'pihps' AND tanggal_data = ?`,
      )
      .get(tanggal_data) as { n: number }
  ).n;

  const byCommodity = db
    .prepare(`
    SELECT commodity_name, COUNT(*) as n,
           MIN(nilai) as min_price, MAX(nilai) as max_price,
           ROUND(AVG(nilai)) as avg_price
    FROM prices
    WHERE source = 'pihps' AND tanggal_data = ?
    GROUP BY commodity_id
    ORDER BY commodity_id
  `)
    .all(tanggal_data) as Array<{
    commodity_name: string;
    n: number;
    min_price: number;
    max_price: number;
    avg_price: number;
  }>;

  console.log(`\nInserted/updated: ${inserted}`);
  if (skipped > 0) {
    console.log(`Skipped: ${skipped}`);
    for (const s of skippedDetails.slice(0, 10)) console.log(`  - ${s}`);
  }
  console.log(`Total in DB for ${tanggal_data}: ${totalInDb}`);

  console.log("\nPer commodity:");
  const fmt = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
  for (const r of byCommodity) {
    console.log(
      `  ${r.commodity_name.padEnd(14)} ${String(r.n).padStart(3)} prov  ` +
        `min ${fmt(r.min_price).padStart(14)}  ` +
        `avg ${fmt(r.avg_price).padStart(14)}  ` +
        `max ${fmt(r.max_price).padStart(14)}`,
    );
  }

  db.close();
}

main().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
