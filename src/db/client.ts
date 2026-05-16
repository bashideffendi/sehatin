import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

export function getDb(path: string): Database.Database {
  // Skip mkdirSync on read-only filesystems (Vercel runtime)
  try {
    mkdirSync(dirname(path), { recursive: true });
  } catch {
    /* ignore — read-only fs is fine for read-only DB */
  }
  const db = new Database(path, { readonly: false, fileMustExist: false });
  try {
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  } catch {
    /* journal_mode may fail on read-only fs — fall through */
  }
  return db;
}

export function getDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  // Absolute path keyed off cwd so Vercel serverless / Node both resolve correctly
  return join(process.cwd(), "data", "sehatin.db");
}
