import Database from "better-sqlite3";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

export interface DbOptions {
  /** Open in read-only mode. Required on Vercel (read-only filesystem). */
  readonly?: boolean;
}

export function getDb(path: string, opts: DbOptions = {}): Database.Database {
  // Auto-detect readonly mode based on path location.
  // public/ + /tmp are read-only / cache locations — never write.
  // data/ is the local dev write location.
  const isReadonlyLocation =
    path.includes("/public/") ||
    path.includes("\\public\\") ||
    path.startsWith(tmpdir()) ||
    path.includes("/tmp/");
  const readonly = opts.readonly ?? isReadonlyLocation;

  if (!readonly) {
    try {
      mkdirSync(dirname(path), { recursive: true });
    } catch {
      /* ignore */
    }
  }

  const db = new Database(path, {
    readonly,
    fileMustExist: readonly,
  });

  try {
    if (!readonly) db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  } catch {
    /* ignore */
  }
  return db;
}

/**
 * Sync resolver — used by local scripts (db-init, import-*) that know the
 * file is on disk. Don't use this in API routes on Vercel — public/ files
 * are NOT bundled into serverless functions, so this returns a non-existent
 * path at runtime. Use {@link resolveDbPath} (async) in routes instead.
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

// Cache the resolved path across requests in the same function container
let _resolvedPath: string | null = null;

/**
 * Async resolver for API routes — handles the Vercel case where the DB
 * file isn't in the serverless function bundle (only in static public/).
 *
 * Resolution order:
 *  1. DB_PATH env override
 *  2. public/sehatin.db on local fs (dev OR Vercel if Next bundled it)
 *  3. data/sehatin.db on local fs (dev fallback)
 *  4. /tmp/sehatin.db cached from previous fetch
 *  5. fetch from /sehatin.db public URL, write to /tmp, use that
 *
 * Once resolved, the path is cached for the lifetime of the function
 * container so subsequent requests skip the fs checks.
 */
export async function resolveDbPath(): Promise<string> {
  if (_resolvedPath) return _resolvedPath;

  if (process.env.DB_PATH) {
    _resolvedPath = process.env.DB_PATH;
    return _resolvedPath;
  }

  const candidates = [
    join(process.cwd(), "public", "sehatin.db"),
    join(process.cwd(), "data", "sehatin.db"),
  ];
  for (const p of candidates) {
    try {
      if (existsSync(p)) {
        _resolvedPath = p;
        return p;
      }
    } catch {
      /* ignore */
    }
  }

  // Vercel runtime fallback — fetch DB via public HTTPS URL into /tmp
  const tmpPath = join(tmpdir(), "sehatin.db");
  try {
    if (existsSync(tmpPath)) {
      _resolvedPath = tmpPath;
      return tmpPath;
    }
  } catch {
    /* ignore */
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL ||
      "https://sehatin-tan.vercel.app";
  const res = await fetch(`${baseUrl}/sehatin.db`);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch SQLite DB from ${baseUrl}/sehatin.db — HTTP ${res.status}`,
    );
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(tmpPath, buf);
  _resolvedPath = tmpPath;
  return tmpPath;
}

/** Convenience: resolve path + open DB in one async call. */
export async function getDbAsync(): Promise<Database.Database> {
  const path = await resolveDbPath();
  return getDb(path);
}
