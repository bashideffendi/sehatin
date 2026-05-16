/**
 * Import TKPI JSONL → SQLite foods table.
 *
 * Source: data/tkpi-YYYY-MM-DD.jsonl (1 JSON object per line)
 *
 * Usage:
 *   tsx scripts/import-tkpi.ts                       # default: latest tkpi-*.jsonl
 *   tsx scripts/import-tkpi.ts --file tkpi-2026-05-16.jsonl
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getDb, getDbPath } from "../src/db/client.ts";
import { createSchema } from "../src/db/schema.ts";

interface TkpiRow {
  code: string;
  name: string;
  kategori: string;
  tipe: string;
  asal: string;
  nama_latin: string;
  keterangan: string;
  air_g: number | null;
  energi_kal: number | null;
  protein_g: number | null;
  lemak_g: number | null;
  karbo_g: number | null;
  serat_g: number | null;
  abu_g: number | null;
  ca_mg: number | null;
  p_mg: number | null;
  fe_mg: number | null;
  na_mg: number | null;
  k_mg: number | null;
  cu_mg: number | null;
  zn_mg: number | null;
  b_karoten_mcg: number | null;
  karoten_total_mcg: number | null;
  niasin_mg: number | null;
  retinol_mcg: number | null;
  riboflavin_b2_mg: number | null;
  thiamin_b1_mg: number | null;
  vit_c_mg: number | null;
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

function findLatestJsonl(dataDir: string): string {
  const files = readdirSync(dataDir).filter(
    (f) => f.startsWith("tkpi-") && f.endsWith(".jsonl"),
  );
  if (files.length === 0) {
    throw new Error(`No tkpi-*.jsonl files in ${dataDir}`);
  }
  files.sort();
  return files[files.length - 1];
}

function parseJsonl(content: string): TkpiRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  const rows: TkpiRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    try {
      rows.push(JSON.parse(lines[i]) as TkpiRow);
    } catch (e) {
      console.warn(`Line ${i + 1}: parse error, skipping`);
    }
  }
  return rows;
}

async function main() {
  const args = parseArgs(process.argv);
  const dataDir = join(process.cwd(), "data");
  const filename = args.file ?? findLatestJsonl(dataDir);
  const jsonlPath = join(dataDir, filename);

  console.log(`Loading JSONL: ${jsonlPath}`);
  const content = readFileSync(jsonlPath, "utf-8");
  const rows = parseJsonl(content);
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
    "tkpi",
    new Date().toISOString(),
    "running",
    0,
  );
  const runId = runResult.lastInsertRowid as number;

  // Upsert into foods. source_id = TKPI code (GP053, DR001, etc).
  const upsert = db.prepare(`
    INSERT INTO foods (
      id, source, source_id, name, name_id, categories,
      serving_size_g,
      kcal_per_100g, protein_per_100g, fat_per_100g, carb_per_100g, fiber_per_100g,
      sodium_per_100g,
      raw_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source, source_id) DO UPDATE SET
      name = excluded.name,
      name_id = excluded.name_id,
      categories = excluded.categories,
      kcal_per_100g = excluded.kcal_per_100g,
      protein_per_100g = excluded.protein_per_100g,
      fat_per_100g = excluded.fat_per_100g,
      carb_per_100g = excluded.carb_per_100g,
      fiber_per_100g = excluded.fiber_per_100g,
      sodium_per_100g = excluded.sodium_per_100g,
      raw_json = excluded.raw_json,
      scraped_at = datetime('now')
  `);

  let inserted = 0;
  const tx = db.transaction((rs: TkpiRow[]) => {
    for (const r of rs) {
      // Categories: combine kategori + tipe ("Buah, Mentah (Raw)")
      const categories = [r.kategori, r.tipe].filter(Boolean).join(", ");
      const name_id = r.name;

      // raw_json: full TKPI record incl. micronutrients & meta
      const raw_json = JSON.stringify({
        code: r.code,
        nama_latin: r.nama_latin,
        asal: r.asal,
        keterangan: r.keterangan,
        kategori: r.kategori,
        tipe: r.tipe,
        per_100g: {
          air_g: r.air_g,
          energi_kal: r.energi_kal,
          protein_g: r.protein_g,
          lemak_g: r.lemak_g,
          karbo_g: r.karbo_g,
          serat_g: r.serat_g,
          abu_g: r.abu_g,
          mineral_mg: {
            ca: r.ca_mg,
            p: r.p_mg,
            fe: r.fe_mg,
            na: r.na_mg,
            k: r.k_mg,
            cu: r.cu_mg,
            zn: r.zn_mg,
          },
          vitamin: {
            b_karoten_mcg: r.b_karoten_mcg,
            karoten_total_mcg: r.karoten_total_mcg,
            niasin_mg: r.niasin_mg,
            retinol_mcg: r.retinol_mcg,
            riboflavin_b2_mg: r.riboflavin_b2_mg,
            thiamin_b1_mg: r.thiamin_b1_mg,
            vit_c_mg: r.vit_c_mg,
          },
        },
      });

      upsert.run(
        `tkpi:${r.code}`,
        "tkpi",
        r.code,
        r.name,
        name_id,
        categories,
        100,
        r.energi_kal,
        r.protein_g,
        r.lemak_g,
        r.karbo_g,
        r.serat_g,
        r.na_mg,
        raw_json,
      );
      inserted++;
    }
  });

  tx(rows);

  db.prepare(`
    UPDATE scrape_runs
    SET finished_at = ?, status = ?, items_inserted = ?
    WHERE id = ?
  `).run(new Date().toISOString(), "success", inserted, runId);

  db.prepare(`UPDATE sources SET last_scraped = ? WHERE name = 'tkpi'`).run(
    new Date().toISOString(),
  );

  const total = (
    db.prepare(`SELECT COUNT(*) as n FROM foods WHERE source = 'tkpi'`).get() as {
      n: number;
    }
  ).n;

  const byKategori = db
    .prepare(`
    SELECT substr(categories, 1, instr(categories, ',') - 1) as kategori,
           COUNT(*) as n,
           ROUND(AVG(kcal_per_100g)) as avg_kcal,
           ROUND(MIN(kcal_per_100g)) as min_kcal,
           ROUND(MAX(kcal_per_100g)) as max_kcal,
           ROUND(AVG(protein_per_100g), 1) as avg_protein
    FROM foods
    WHERE source = 'tkpi'
    GROUP BY substr(categories, 1, instr(categories, ',') - 1)
    ORDER BY n DESC
  `)
    .all() as Array<{
    kategori: string;
    n: number;
    avg_kcal: number;
    min_kcal: number;
    max_kcal: number;
    avg_protein: number;
  }>;

  console.log(`\nInserted/updated: ${inserted}`);
  console.log(`Total TKPI in DB: ${total}`);

  console.log("\nPer kategori:");
  for (const r of byKategori) {
    const kat = (r.kategori || "(none)").padEnd(22);
    console.log(
      `  ${kat} ${String(r.n).padStart(4)} foods  kcal ${String(r.min_kcal).padStart(4)}-${String(r.max_kcal).padStart(4)} (avg ${String(r.avg_kcal).padStart(4)})  protein avg ${r.avg_protein}g`,
    );
  }

  db.close();
}

main().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
