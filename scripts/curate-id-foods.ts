/**
 * Curated Indonesian foods — gap filler TKPI gak cover well.
 *
 * Estimated per-100g nutrition dari kombinasi:
 *  - Komposisi ingredient TKPI (e.g., nasi padang = nasi + rendang + sayur)
 *  - Public nutrition tables (Fatsecret, MyFitnessPal Indonesia entries, blog gizi)
 *  - Resto chain official nutrition pages (McD/KFC/Hokben/Starbucks ID)
 *
 * Values are APPROXIMATE (±15%) — sufficient for meal tracking/planning,
 * not for medical nutrition.
 */
import { getDb, getDbPath } from "../src/db/client.ts";
import { createSchema } from "../src/db/schema.ts";

interface CuratedFood {
  /** Slug code, e.g., "nasi-padang-rendang" */
  id: string;
  /** Display name for user */
  name: string;
  /** Indonesian-style category (use existing or new) */
  kategori: string;
  /** Typical serving size in grams (for reference) */
  serving_g?: number;
  /** Nutrition per 100g */
  kcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  fiber_g?: number;
  notes?: string;
}

const FOODS: CuratedFood[] = [
  // ============ NASI & LAUK ============
  {
    id: "nasi-padang-rendang",
    name: "Nasi Padang dengan Rendang (komplit)",
    kategori: "Makanan jadi Indonesia",
    serving_g: 350,
    kcal: 250,
    protein_g: 12,
    fat_g: 14,
    carb_g: 22,
    fiber_g: 1.5,
    notes: "Nasi + rendang + sayur singkong + sambal hijau + kuah",
  },
  {
    id: "nasi-uduk-komplit",
    name: "Nasi Uduk komplit (telur balado, bihun, kerupuk)",
    kategori: "Makanan jadi Indonesia",
    serving_g: 300,
    kcal: 220,
    protein_g: 7,
    fat_g: 9,
    carb_g: 29,
    fiber_g: 1,
    notes: "Nasi santan + telur + bihun goreng + kerupuk",
  },
  {
    id: "nasi-kuning-komplit",
    name: "Nasi Kuning komplit",
    kategori: "Makanan jadi Indonesia",
    serving_g: 320,
    kcal: 200,
    protein_g: 8,
    fat_g: 7,
    carb_g: 27,
    fiber_g: 1,
    notes: "Nasi kuning + telur balado + ayam + bihun + kering tempe",
  },
  {
    id: "nasi-liwet-sunda",
    name: "Nasi Liwet Sunda komplit",
    kategori: "Makanan jadi Indonesia",
    serving_g: 350,
    kcal: 195,
    protein_g: 9,
    fat_g: 7,
    carb_g: 25,
    notes: "Nasi liwet + ayam + tahu/tempe + sambal + lalap",
  },
  {
    id: "nasi-gudeg",
    name: "Nasi Gudeg Jogja komplit",
    kategori: "Makanan jadi Indonesia",
    serving_g: 350,
    kcal: 230,
    protein_g: 9,
    fat_g: 9,
    carb_g: 30,
    fiber_g: 2,
    notes: "Nasi + gudeg nangka + ayam + krecek + telur",
  },
  {
    id: "nasi-goreng-spesial",
    name: "Nasi Goreng Spesial (telur, ayam, sayur)",
    kategori: "Makanan jadi Indonesia",
    serving_g: 300,
    kcal: 200,
    protein_g: 8,
    fat_g: 8,
    carb_g: 24,
    notes: "Nasi goreng + suwiran ayam + telur dadar + acar",
  },
  {
    id: "nasi-campur-bali",
    name: "Nasi Campur Bali",
    kategori: "Makanan jadi Indonesia",
    serving_g: 350,
    kcal: 215,
    protein_g: 11,
    fat_g: 10,
    carb_g: 22,
    notes: "Nasi + lawar + ayam betutu + sate lilit + sambal matah",
  },
  {
    id: "nasi-rames",
    name: "Nasi Rames warteg (ayam + sayur + tempe)",
    kategori: "Makanan jadi Indonesia",
    serving_g: 320,
    kcal: 185,
    protein_g: 10,
    fat_g: 6,
    carb_g: 24,
    notes: "Porsi warteg standar",
  },
  // ============ MIE & SOTO ============
  {
    id: "mie-ayam-pangsit",
    name: "Mie Ayam Pangsit komplit",
    kategori: "Makanan jadi Indonesia",
    serving_g: 350,
    kcal: 145,
    protein_g: 7,
    fat_g: 5,
    carb_g: 19,
    notes: "Mie kuning + ayam kecap + pangsit + sawi + kuah kaldu",
  },
  {
    id: "mie-aceh-goreng",
    name: "Mie Aceh Goreng (udang)",
    kategori: "Makanan jadi Indonesia",
    serving_g: 300,
    kcal: 175,
    protein_g: 8,
    fat_g: 7,
    carb_g: 22,
    notes: "Mie kuning lebar + bumbu rempah pedas + udang/daging",
  },
  {
    id: "bakmi-gm-ayam-jamur",
    name: "Bakmi GM Ayam Jamur",
    kategori: "Makanan jadi Indonesia",
    serving_g: 350,
    kcal: 155,
    protein_g: 8,
    fat_g: 4,
    carb_g: 21,
    notes: "Mie + topping ayam jamur + acar + pangsit goreng",
  },
  {
    id: "soto-lamongan",
    name: "Soto Lamongan",
    kategori: "Makanan jadi Indonesia",
    serving_g: 400,
    kcal: 75,
    protein_g: 5,
    fat_g: 3,
    carb_g: 7,
    notes: "Soto ayam + soun + telur + nasi (1 mangkok)",
  },
  {
    id: "soto-betawi",
    name: "Soto Betawi (daging santan)",
    kategori: "Makanan jadi Indonesia",
    serving_g: 400,
    kcal: 115,
    protein_g: 6,
    fat_g: 7,
    carb_g: 7,
    notes: "Daging sapi + jeroan + santan + kentang",
  },
  {
    id: "coto-makassar",
    name: "Coto Makassar",
    kategori: "Makanan jadi Indonesia",
    serving_g: 400,
    kcal: 95,
    protein_g: 7,
    fat_g: 5,
    carb_g: 5,
    notes: "Kuah rempah + daging + jeroan",
  },
  // ============ BAKSO & OLAHAN ============
  {
    id: "bakso-urat-komplit",
    name: "Bakso Urat komplit (mie + tahu + kuah)",
    kategori: "Makanan jadi Indonesia",
    serving_g: 400,
    kcal: 85,
    protein_g: 6,
    fat_g: 3,
    carb_g: 8,
    notes: "5 bakso urat + mie + tahu + sayur + kuah",
  },
  {
    id: "siomay-bandung-komplit",
    name: "Siomay Bandung komplit (5 pcs + bumbu kacang)",
    kategori: "Makanan jadi Indonesia",
    serving_g: 250,
    kcal: 175,
    protein_g: 10,
    fat_g: 8,
    carb_g: 17,
    notes: "Siomay ikan + tahu + kentang + telur + kol + bumbu kacang",
  },
  {
    id: "batagor-komplit",
    name: "Batagor komplit (4 pcs)",
    kategori: "Makanan jadi Indonesia",
    serving_g: 200,
    kcal: 245,
    protein_g: 9,
    fat_g: 13,
    carb_g: 24,
    notes: "Goreng tahu + ikan + bumbu kacang",
  },
  {
    id: "pempek-kapal-selam",
    name: "Pempek Kapal Selam (cuko)",
    kategori: "Makanan jadi Indonesia",
    serving_g: 200,
    kcal: 170,
    protein_g: 9,
    fat_g: 5,
    carb_g: 22,
    notes: "Pempek ikan tenggiri isi telur + cuko asam manis pedas",
  },
  // ============ SATE ============
  {
    id: "sate-ayam-madura",
    name: "Sate Ayam Madura (10 tusuk + lontong + bumbu kacang)",
    kategori: "Makanan jadi Indonesia",
    serving_g: 350,
    kcal: 220,
    protein_g: 14,
    fat_g: 11,
    carb_g: 18,
    notes: "Sate ayam + lontong + bumbu kacang + acar",
  },
  {
    id: "sate-padang",
    name: "Sate Padang (10 tusuk + ketupat + kuah kacang)",
    kategori: "Makanan jadi Indonesia",
    serving_g: 300,
    kcal: 205,
    protein_g: 12,
    fat_g: 9,
    carb_g: 20,
  },
  // ============ GADO-GADO & PECEL ============
  {
    id: "gado-gado-komplit",
    name: "Gado-gado komplit (lontong + tahu + tempe + bumbu kacang)",
    kategori: "Makanan jadi Indonesia",
    serving_g: 350,
    kcal: 165,
    protein_g: 8,
    fat_g: 8,
    carb_g: 17,
    fiber_g: 3,
  },
  {
    id: "pecel-sayur-nasi",
    name: "Pecel sayur + nasi",
    kategori: "Makanan jadi Indonesia",
    serving_g: 350,
    kcal: 175,
    protein_g: 7,
    fat_g: 7,
    carb_g: 23,
    fiber_g: 4,
  },
  // ============ JAJANAN TRADISIONAL ============
  {
    id: "klepon",
    name: "Klepon (5 buah)",
    kategori: "Jajanan tradisional",
    serving_g: 75,
    kcal: 280,
    protein_g: 4,
    fat_g: 5,
    carb_g: 56,
    notes: "Bola ketan isi gula merah + kelapa parut",
  },
  {
    id: "onde-onde",
    name: "Onde-onde wijen (1 buah ~40g)",
    kategori: "Jajanan tradisional",
    serving_g: 40,
    kcal: 290,
    protein_g: 6,
    fat_g: 9,
    carb_g: 45,
    notes: "Tepung ketan goreng isi kacang hijau",
  },
  {
    id: "lemper-ayam",
    name: "Lemper Ayam (1 buah ~60g)",
    kategori: "Jajanan tradisional",
    serving_g: 60,
    kcal: 220,
    protein_g: 8,
    fat_g: 5,
    carb_g: 36,
  },
  {
    id: "lumpia-semarang",
    name: "Lumpia Semarang (1 buah ~50g)",
    kategori: "Jajanan tradisional",
    serving_g: 50,
    kcal: 235,
    protein_g: 7,
    fat_g: 11,
    carb_g: 27,
    notes: "Isi rebung + udang/ayam",
  },
  {
    id: "kue-cubit",
    name: "Kue Cubit (5 buah)",
    kategori: "Jajanan tradisional",
    serving_g: 80,
    kcal: 310,
    protein_g: 5,
    fat_g: 13,
    carb_g: 43,
  },
  {
    id: "pisang-goreng",
    name: "Pisang Goreng (1 buah ~60g)",
    kategori: "Jajanan tradisional",
    serving_g: 60,
    kcal: 230,
    protein_g: 2,
    fat_g: 10,
    carb_g: 33,
  },
  {
    id: "tahu-isi-goreng",
    name: "Tahu Isi Goreng (1 buah ~50g)",
    kategori: "Jajanan tradisional",
    serving_g: 50,
    kcal: 195,
    protein_g: 7,
    fat_g: 12,
    carb_g: 14,
  },
  {
    id: "bakwan-jagung",
    name: "Bakwan Jagung (1 buah ~50g)",
    kategori: "Jajanan tradisional",
    serving_g: 50,
    kcal: 265,
    protein_g: 4,
    fat_g: 16,
    carb_g: 27,
  },
  {
    id: "risol-mayo",
    name: "Risol Mayo (1 buah ~60g)",
    kategori: "Jajanan tradisional",
    serving_g: 60,
    kcal: 285,
    protein_g: 7,
    fat_g: 17,
    carb_g: 25,
  },
  {
    id: "martabak-telur",
    name: "Martabak Telur (1 potong ~120g)",
    kategori: "Jajanan tradisional",
    serving_g: 120,
    kcal: 245,
    protein_g: 9,
    fat_g: 14,
    carb_g: 21,
    notes: "Kulit + isi daging cincang + telur + daun bawang",
  },
  {
    id: "martabak-manis-coklat",
    name: "Martabak Manis Coklat-Keju (1 potong ~100g)",
    kategori: "Jajanan tradisional",
    serving_g: 100,
    kcal: 365,
    protein_g: 7,
    fat_g: 14,
    carb_g: 53,
    notes: "Adonan tebal + mentega + meises coklat + keju + susu kental",
  },
  // ============ MINUMAN TRADISIONAL ============
  {
    id: "es-teh-manis-warung",
    name: "Es Teh Manis warung (300ml)",
    kategori: "Minuman",
    serving_g: 300,
    kcal: 35,
    protein_g: 0,
    fat_g: 0,
    carb_g: 9,
    notes: "Teh + gula pasir 2-3 sdt",
  },
  {
    id: "es-jeruk-peras",
    name: "Es Jeruk Peras (300ml)",
    kategori: "Minuman",
    serving_g: 300,
    kcal: 45,
    protein_g: 0.5,
    fat_g: 0,
    carb_g: 11,
  },
  {
    id: "kopi-tubruk",
    name: "Kopi Tubruk (200ml + gula 2 sdt)",
    kategori: "Minuman",
    serving_g: 200,
    kcal: 30,
    protein_g: 0,
    fat_g: 0,
    carb_g: 8,
  },
  {
    id: "es-kelapa-muda",
    name: "Es Kelapa Muda (1 gelas, daging + air)",
    kategori: "Minuman",
    serving_g: 400,
    kcal: 55,
    protein_g: 1,
    fat_g: 2,
    carb_g: 9,
  },
  {
    id: "es-cendol",
    name: "Es Cendol (300ml)",
    kategori: "Minuman",
    serving_g: 300,
    kcal: 120,
    protein_g: 1,
    fat_g: 3,
    carb_g: 22,
    notes: "Cendol + santan + gula merah cair + es",
  },
  {
    id: "es-campur",
    name: "Es Campur komplit (1 mangkok)",
    kategori: "Minuman",
    serving_g: 350,
    kcal: 145,
    protein_g: 2,
    fat_g: 3,
    carb_g: 28,
  },
  {
    id: "wedang-jahe",
    name: "Wedang Jahe (200ml)",
    kategori: "Minuman",
    serving_g: 200,
    kcal: 50,
    protein_g: 0,
    fat_g: 0,
    carb_g: 12,
  },
  // ============ JAJANAN KEKINIAN ============
  {
    id: "boba-milk-tea",
    name: "Boba Milk Tea full sugar (500ml)",
    kategori: "Minuman kekinian",
    serving_g: 500,
    kcal: 95,
    protein_g: 1.5,
    fat_g: 3,
    carb_g: 16,
    notes: "Susu + teh + boba tapioka + gula",
  },
  {
    id: "korean-fried-chicken",
    name: "Korean Fried Chicken (200g, 4 potong)",
    kategori: "Resto chain",
    serving_g: 200,
    kcal: 295,
    protein_g: 18,
    fat_g: 19,
    carb_g: 14,
    notes: "Ayam goreng + saus gochujang/cheese",
  },
  {
    id: "dim-sum-mentai",
    name: "Dim Sum Mentai (5 pcs)",
    kategori: "Resto chain",
    serving_g: 150,
    kcal: 260,
    protein_g: 11,
    fat_g: 15,
    carb_g: 19,
  },
  // ============ RESTO CHAIN ============
  {
    id: "mcd-big-mac",
    name: "McDonald's Big Mac (1 burger)",
    kategori: "Resto chain",
    serving_g: 220,
    kcal: 250,
    protein_g: 12,
    fat_g: 14,
    carb_g: 20,
    notes: "Per 100g; satu burger ~550 kcal",
  },
  {
    id: "mcd-chicken-mcd-paket",
    name: "McD Ayam Goreng + Nasi + Coke (paket PaNas)",
    kategori: "Resto chain",
    serving_g: 450,
    kcal: 195,
    protein_g: 10,
    fat_g: 8,
    carb_g: 22,
    notes: "Per 100g; paket total ~900 kcal",
  },
  {
    id: "kfc-original-chicken",
    name: "KFC Original Recipe Chicken (1 potong dada)",
    kategori: "Resto chain",
    serving_g: 180,
    kcal: 245,
    protein_g: 18,
    fat_g: 16,
    carb_g: 8,
    notes: "Per 100g; satu potong ~440 kcal",
  },
  {
    id: "kfc-paket-snack",
    name: "KFC Paket Snack (ayam + nasi + Coke)",
    kategori: "Resto chain",
    serving_g: 400,
    kcal: 195,
    protein_g: 9,
    fat_g: 8,
    carb_g: 23,
  },
  {
    id: "hokben-bento-special",
    name: "Hokben Bento Special (chicken yakiniku + nasi)",
    kategori: "Resto chain",
    serving_g: 400,
    kcal: 170,
    protein_g: 9,
    fat_g: 6,
    carb_g: 22,
  },
  {
    id: "starbucks-caffe-latte-grande",
    name: "Starbucks Caffe Latte Grande (16oz)",
    kategori: "Resto chain",
    serving_g: 470,
    kcal: 45,
    protein_g: 2.5,
    fat_g: 2,
    carb_g: 4,
    notes: "Pakai whole milk",
  },
  {
    id: "starbucks-frappuccino-caramel",
    name: "Starbucks Caramel Frappuccino Grande (16oz)",
    kategori: "Resto chain",
    serving_g: 470,
    kcal: 90,
    protein_g: 1.5,
    fat_g: 3,
    carb_g: 15,
    notes: "Whipped cream included",
  },
];

const db = getDb(getDbPath());
createSchema(db);

const upsert = db.prepare(`
  INSERT INTO foods (
    id, source, source_id, name, categories,
    serving_size_g, kcal_per_100g, protein_per_100g, fat_per_100g,
    carb_per_100g, fiber_per_100g, raw_json, scraped_at
  ) VALUES (
    @id, 'curated_id', @source_id, @name, @kategori,
    @serving_g, @kcal, @protein_g, @fat_g, @carb_g, @fiber_g,
    @raw_json, datetime('now')
  )
  ON CONFLICT(source, source_id) DO UPDATE SET
    name=excluded.name,
    categories=excluded.categories,
    serving_size_g=excluded.serving_size_g,
    kcal_per_100g=excluded.kcal_per_100g,
    protein_per_100g=excluded.protein_per_100g,
    fat_per_100g=excluded.fat_per_100g,
    carb_per_100g=excluded.carb_per_100g,
    fiber_per_100g=excluded.fiber_per_100g,
    raw_json=excluded.raw_json,
    scraped_at=excluded.scraped_at
`);

const tx = db.transaction((items: CuratedFood[]) => {
  for (const f of items) {
    upsert.run({
      id: `curated_id:${f.id}`,
      source_id: f.id,
      name: f.name,
      kategori: f.kategori,
      serving_g: f.serving_g ?? null,
      kcal: f.kcal,
      protein_g: f.protein_g,
      fat_g: f.fat_g,
      carb_g: f.carb_g,
      fiber_g: f.fiber_g ?? null,
      raw_json: JSON.stringify(f),
    });
  }
});

tx(FOODS);

db.prepare(
  "INSERT OR IGNORE INTO sources (name, url, license, notes) VALUES ('curated_id', '', 'Internal', 'Hand-curated Indonesian dishes - gap filler for items TKPI does not cover well')",
).run();
db.prepare(
  "UPDATE sources SET last_scraped = datetime('now') WHERE name = 'curated_id'",
).run();

const count = db
  .prepare("SELECT COUNT(*) as c FROM foods WHERE source = 'curated_id'")
  .get() as { c: number };

console.log(`Curated Indonesian foods imported: ${FOODS.length} dishes`);
console.log(`DB now has ${count.c} foods with source='curated_id'`);

db.close();
