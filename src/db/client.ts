import type DatabaseType from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";

export interface DbOptions {
  /** Open in read-only mode. Required on Vercel (read-only filesystem). */
  readonly?: boolean;
}

// Synchronous open — for local scripts (db-init, import-*) where the native
// module is loaded at startup. Production code paths use getDbAsync.
// Use createRequire to load better-sqlite3 in an ESM-compatible way
// (package.json has "type": "module"). require lets Node resolve at runtime
// against serverExternalPackages.
let _SyncDatabase: typeof DatabaseType | null = null;
const _require = createRequire(import.meta.url);
function loadSyncDatabase(): typeof DatabaseType {
  if (_SyncDatabase) return _SyncDatabase;
  _SyncDatabase = _require("better-sqlite3") as typeof DatabaseType;
  return _SyncDatabase;
}

export function getDb(path: string, opts: DbOptions = {}): DatabaseType.Database {
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

  const Database = loadSyncDatabase();
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
  // On Vercel runtime, prefer public/ (gets bundled, copied to /tmp by
  // resolveDbPath). Locally, prefer data/ which is writable for scripts.
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  if (isVercel) {
    const publicPath = join(process.cwd(), "public", "sehatin.db");
    try {
      if (existsSync(publicPath)) return publicPath;
    } catch {
      /* ignore */
    }
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

  // On Vercel the filesystem is read-only everywhere EXCEPT /tmp. Opening
  // SQLite from read-only paths triggers "unable to open database file"
  // on first query because SQLite tries to create a journal/WAL file
  // alongside the DB. Always work from /tmp on Vercel.
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const tmpPath = join(tmpdir(), "sehatin.db");

  // Warm container — /tmp already has the DB from a previous request
  try {
    if (existsSync(tmpPath)) {
      _resolvedPath = tmpPath;
      return tmpPath;
    }
  } catch {
    /* ignore */
  }

  // Try bundled paths. On Vercel: COPY to /tmp then return /tmp path.
  // On local dev: open directly (cwd is writable).
  const bundledCandidates = [
    join(process.cwd(), "public", "sehatin.db"),
    join(process.cwd(), "data", "sehatin.db"),
  ];
  for (const p of bundledCandidates) {
    try {
      if (existsSync(p)) {
        if (isVercel) {
          const buf = readFileSync(p);
          writeFileSync(tmpPath, buf);
          _resolvedPath = tmpPath;
          return tmpPath;
        }
        _resolvedPath = p;
        return p;
      }
    } catch {
      /* ignore */
    }
  }

  // Vercel Deployment Protection gates BOTH VERCEL_URL (deployment-specific)
  // AND VERCEL_PROJECT_PRODUCTION_URL with 401. Some random-hash aliases
  // (e.g. sehatin-tan.vercel.app) might be public, but unreliable.
  //
  // Most reliable source: raw.githubusercontent.com which has NO auth and
  // is always public for public repos. The DB file is committed to the
  // repo at public/sehatin.db. Fetch that as the primary source.
  const candidateUrls: string[] = [];
  if (process.env.SEHATIN_DB_BASE_URL) {
    candidateUrls.push(`${process.env.SEHATIN_DB_BASE_URL}/sehatin.db`);
  }
  // Primary: GitHub raw (always public for public repos, no Vercel gating)
  candidateUrls.push(
    "https://raw.githubusercontent.com/bashideffendi/sehatin/main/public/sehatin.db",
  );
  // Fallbacks (Vercel-hosted URLs — may be auth-gated)
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

/**
 * Convenience: resolve path + open DB in one async call.
 * Uses dynamic import so Turbopack handles the native module load via
 * runtime resolution (serverExternalPackages) rather than static bundling.
 */
export async function getDbAsync(): Promise<DatabaseType.Database> {
  const path = await resolveDbPath();
  const mod = await import("better-sqlite3");
  const Database = mod.default;

  const isReadonlyLocation =
    path.includes("/public/") ||
    path.includes("\\public\\") ||
    path.startsWith(tmpdir()) ||
    path.includes("/tmp/");
  const readonly = isReadonlyLocation;

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
