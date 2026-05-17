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

  // Vercel Deployment Protection gates BOTH VERCEL_URL (deployment-specific)
  // AND VERCEL_PROJECT_PRODUCTION_URL (sehatin-bashideffendi.vercel.app) with
  // 401. Only the random-hash production alias (e.g. sehatin-tan.vercel.app)
  // is public by default. Try several URLs in order — accept the first 200.
  const candidateUrls: string[] = [];
  if (process.env.SEHATIN_DB_BASE_URL) {
    candidateUrls.push(`${process.env.SEHATIN_DB_BASE_URL}/sehatin.db`);
  }
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    candidateUrls.push(`${process.env.NEXT_PUBLIC_BASE_URL}/sehatin.db`);
  }
  candidateUrls.push("https://sehatin-tan.vercel.app/sehatin.db");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    candidateUrls.push(
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/sehatin.db`,
    );
  }
  if (process.env.VERCEL_URL) {
    candidateUrls.push(`https://${process.env.VERCEL_URL}/sehatin.db`);
  }

  let lastError = "";
  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        lastError = `${url} → HTTP ${res.status}`;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      // Sanity check — SQLite header starts with "SQLite format 3\0"
      if (buf.length < 16 || buf.subarray(0, 6).toString() !== "SQLite") {
        lastError = `${url} → got ${buf.length} bytes, not a SQLite file (probably HTML auth page)`;
        continue;
      }
      writeFileSync(tmpPath, buf);
      _resolvedPath = tmpPath;
      return tmpPath;
    } catch (e) {
      lastError = `${url} → ${(e as Error).message}`;
    }
  }
  throw new Error(
    `Failed to fetch SQLite DB from any candidate URL. Last: ${lastError}. Disable Vercel Deployment Protection or set SEHATIN_DB_BASE_URL env to a public URL.`,
  );
}

/** Convenience: resolve path + open DB in one async call. */
export async function getDbAsync(): Promise<Database.Database> {
  const path = await resolveDbPath();
  return getDb(path);
}
