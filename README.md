# Sehatin

> Fitness & wellness untuk Indonesia — program latihan, nutrisi budget-aware, IF timer.

**Status:** 🟡 Draft
**Live:** https://sehatin.masbash.id (coming soon)
**Repo:** _local_ (belum push)
**Stack:** Node TypeScript + SQLite (scraper foundation), Next.js 16 (app, nanti)

## What

Web app fitness & wellness yang **bener-bener cocok buat user Indonesia** — bukan port app Western:

- **Program latihan personal** — Claude API analyze jadwal kerja, waktu luang, equipment yang ada (rumah/gym/none), level pengalaman → workout schedule realistic.
- **Meal plan budget-aware** — input budget makanan/bulan, kondisi kesehatan, preferensi (halal default, alergi, vegan) → menu seminggu/sebulan dengan harga real per kota (scrape harga pangan harian).
- **Tracking kalori + foto makanan** — log harian + Claude vision recognize foto makanan Indonesia (nasi padang, soto, gado-gado, indomie) → estimate kalori.
- **Database makanan Indonesia** — TKPI Kemenkes + chain restaurant ID + Open Food Facts + warteg porsi standar (ini moat utamanya).
- **IF timer** — built-in intermittent fasting timer (16:8, 18:6, 20:4, OMAD) + program nutrisi disesuaikan window makan.
- **Lifestyle-aware** — Ramadan mode (sahur/buka programming), kondangan recovery, dinas luar kota.

## Features

- 🚧 Scraper foundation: Open Food Facts Indonesia (packaged products)
- 📅 TKPI komposisi gizi (TBD — via PDF parse atau community dataset)
- 📅 Chain restaurant ID nutrition (McD, KFC, Hokben, dll)
- 📅 PIHPS harga pangan harian per kota (deferred — butuh browser inspection)
- 📅 Onboarding wizard
- 📅 Claude API meal plan + workout generator
- 📅 IF timer
- 📅 Foto makanan recognition (Claude vision)
- 📅 Tracker harian

## Local Dev (scraper phase)

```bash
cd D:\Claude-Projects\web-apps\health\sehatin
npm install
cp .env.example .env
npm run db:init
npm run scrape:off -- --pages 5
npm run db:stats
```

Output: `data/sehatin.db` (SQLite).

## Environment Variables

| Var | Required | Default | Keterangan |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Later | - | Buat meal plan + workout gen (belum dipake di scraper phase) |
| `DB_PATH` | No | `./data/sehatin.db` | Path SQLite |
| `OFF_USER_AGENT` | No | default | User-Agent header buat Open Food Facts API (etiket) |
| `OFF_RATE_LIMIT_MS` | No | 1000 | Delay antar request (ms) |

## Data Sources

| Source | Type | Status | License | Catatan |
|---|---|---|---|---|
| Open Food Facts (ID products) | API JSON publik | ✅ Implemented | ODbL | Packaged food, crowdsourced quality bervariasi |
| TKPI Kemenkes (panganku.org) | SPA + PDF Kemenkes 2017 | 📅 Pending | Cek CC-BY-NC | ~1000 bahan, makro+mikro lengkap. Web-nya SPA jadi parse PDF |
| Chain restaurant ID (McD, KFC, Hokben, dll) | PDF nutrition guide | 📅 Pending | Public disclosure | Refresh 3-6 bulan sekali |
| PIHPS Bank Indonesia | SPA (hidden API) | 📅 Pending | Public gov data | Butuh browser network inspection |
| SP2KP Kemendag | Dashboard | 📅 Pending | Public gov data | Backup harga + komoditas lebih luas |
| BPS food CPI | API resmi | 📅 Pending | Public | Trend bulanan |
| Resep Cookpad/Endeus/Sajian Sedap | HTML | 📅 Pending | Personal/fair use | Buat compose dish kompleks |

## Deploy

- **Platform**: TBD (Vercel kalau full app, Railway kalau heavy backend)
- **URL**: sehatin.masbash.id
- **Cron scrape**: GitHub Actions atau Railway cron (TBD)

## Tech Stack

- TypeScript (strict mode)
- better-sqlite3 (sync SQLite, fast)
- tsx (run TS langsung tanpa build)
- Node 20+

App phase (TBD): Next.js 16 + Drizzle + Tailwind + shadcn/ui + Anthropic SDK.

## License

Personal project. © Bashid Effendi 2026. Data sources retain their original licenses (attributed per source).
