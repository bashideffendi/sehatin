import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

export interface DbOptions {
  /** Open in read-only mode. Required on Vercel (read-only filesystem). */
  readonly?: boolean;
}

export function getDb(path: string, opts: DbOptions = {}): Database.Database {
  // Auto-detect readonly mode if path is under public/ (Vercel-bundled assets)
  // or explicitly opted in via opts.readonly.
  const readonly =
    opts.readonly ??
    (path.includes("/public/") || path.includes("\\public\\"));

  if (!readonly) {
    try {
      mkdirSync(dirname(path), { recursive: true });
    } catch {
      /* ignore on read-only fs */
    }
  }

  const db = new Database(path, {
    readonly,
    fileMustExist: readonly,
  });

  if (!readonly) {
    try {
      db.pragma("journal_mode = WAL");
      db.pragma("foreign_keys = ON");
    } catch {
      /* ignore */
    }
  } else {
    try {
      db.pragma("foreign_keys = ON");
    } catch {
      /* ignore */
    }
  }
  return db;
}

/**
 * Resolve the canonical DB path.
 * Priority:
 *  1. DB_PATH env (explicit override)
 *  2. public/sehatin.db if exists (Vercel runtime — auto-bundled)
 *  3. data/sehatin.db (local dev default for write workflows)
 */
export function getDbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  const publicPath = join(process.cwd(), "public", "sehatin.db");
  try {
    if (existsSync(publicPath)) return publicPath;
  } catch {
    /* ignore */
  }
  return join(process.cwd(), "data", "sehatin.db");
}
