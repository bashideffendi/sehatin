import type Database from "better-sqlite3";

export function createSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      url TEXT,
      license TEXT,
      last_scraped TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS foods (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      source_id TEXT NOT NULL,
      name TEXT NOT NULL,
      name_id TEXT,
      brand TEXT,
      categories TEXT,
      serving_size_g REAL,
      kcal_per_100g REAL,
      protein_per_100g REAL,
      fat_per_100g REAL,
      saturated_fat_per_100g REAL,
      carb_per_100g REAL,
      sugar_per_100g REAL,
      fiber_per_100g REAL,
      salt_per_100g REAL,
      sodium_per_100g REAL,
      countries TEXT,
      image_url TEXT,
      raw_json TEXT,
      scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(source, source_id)
    );

    CREATE INDEX IF NOT EXISTS idx_foods_source ON foods(source);
    CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
    CREATE INDEX IF NOT EXISTS idx_foods_brand ON foods(brand);

    CREATE TABLE IF NOT EXISTS scrape_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      pages_scraped INTEGER DEFAULT 0,
      items_inserted INTEGER DEFAULT 0,
      items_updated INTEGER DEFAULT 0,
      status TEXT NOT NULL,
      error TEXT,
      last_page INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_scrape_runs_source ON scrape_runs(source);

    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      commodity_id INTEGER NOT NULL,
      commodity_name TEXT NOT NULL,
      price_type_id INTEGER NOT NULL,
      price_type_name TEXT NOT NULL,
      province_id INTEGER NOT NULL,
      province_name TEXT NOT NULL,
      nilai INTEGER NOT NULL,
      diff_pct REAL,
      tanggal_data TEXT NOT NULL,
      scraped_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(source, commodity_id, price_type_id, province_id, tanggal_data)
    );

    CREATE INDEX IF NOT EXISTS idx_prices_commodity ON prices(commodity_id);
    CREATE INDEX IF NOT EXISTS idx_prices_province ON prices(province_id);
    CREATE INDEX IF NOT EXISTS idx_prices_date ON prices(tanggal_data);
    CREATE INDEX IF NOT EXISTS idx_prices_lookup ON prices(commodity_id, province_id, tanggal_data);
  `);

  const seedSources = db.prepare(`
    INSERT OR IGNORE INTO sources (name, url, license, notes)
    VALUES (?, ?, ?, ?)
  `);

  seedSources.run(
    "openfoodfacts",
    "https://world.openfoodfacts.org",
    "ODbL",
    "Open Food Facts — crowdsourced food database, Indonesia filter via countries_tags",
  );
  seedSources.run(
    "tkpi",
    "https://www.panganku.org",
    "CC-BY-NC (TBD, cek)",
    "Tabel Komposisi Pangan Indonesia, Kemenkes — pending implementation",
  );
  seedSources.run(
    "pihps",
    "https://www.bi.go.id/hargapangan",
    "Public gov data",
    "PIHPS BI — GetGridData1 endpoint (10 komoditas × 2 priceType, per provinsi)",
  );
}
