/**
 * POST /api/debug-db — diagnostic endpoint to surface every step of
 * the DB resolution + open process. Helps debug "unable to open database
 * file" errors on Vercel.
 */
import { NextResponse } from "next/server";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Step {
  name: string;
  ok: boolean;
  detail: string;
}

export async function POST() {
  const steps: Step[] = [];
  const env = {
    cwd: process.cwd(),
    tmpdir: tmpdir(),
    vercel_url: process.env.VERCEL_URL ?? null,
    vercel_project_production_url:
      process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null,
    db_path_env: process.env.DB_PATH ?? null,
    anthropic_key_set: Boolean(process.env.ANTHROPIC_API_KEY),
  };

  // Step 1: Check candidate file paths
  const publicPath = join(process.cwd(), "public", "sehatin.db");
  const dataPath = join(process.cwd(), "data", "sehatin.db");
  const tmpPath = join(tmpdir(), "sehatin.db");

  steps.push({
    name: "public_path_exists",
    ok: existsSync(publicPath),
    detail: publicPath,
  });
  steps.push({
    name: "data_path_exists",
    ok: existsSync(dataPath),
    detail: dataPath,
  });
  steps.push({
    name: "tmp_path_exists_before",
    ok: existsSync(tmpPath),
    detail: tmpPath,
  });

  // Step 2: Try fetching from GitHub raw
  const ghUrl =
    "https://raw.githubusercontent.com/bashideffendi/sehatin/main/public/sehatin.db";
  try {
    const res = await fetch(ghUrl, { cache: "no-store" });
    steps.push({
      name: "fetch_github_raw",
      ok: res.ok,
      detail: `${ghUrl} → HTTP ${res.status}, content-length: ${res.headers.get("content-length")}`,
    });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      const magic = buf.subarray(0, 16).toString();
      steps.push({
        name: "github_response_body_check",
        ok: buf.length > 16 && buf.subarray(0, 6).toString() === "SQLite",
        detail: `bytes=${buf.length}, first 16 bytes (raw): ${JSON.stringify(magic)}`,
      });

      // Try write to /tmp
      try {
        writeFileSync(tmpPath, buf);
        steps.push({
          name: "writeFileSync_tmp",
          ok: true,
          detail: `wrote ${buf.length} bytes to ${tmpPath}`,
        });
      } catch (e) {
        steps.push({
          name: "writeFileSync_tmp",
          ok: false,
          detail: (e as Error).message,
        });
      }

      // Verify write
      try {
        const readBack = readFileSync(tmpPath);
        steps.push({
          name: "readback_tmp",
          ok: readBack.length === buf.length,
          detail: `read back ${readBack.length} bytes, magic: ${JSON.stringify(readBack.subarray(0, 16).toString())}`,
        });
      } catch (e) {
        steps.push({
          name: "readback_tmp",
          ok: false,
          detail: (e as Error).message,
        });
      }

      // Try opening with better-sqlite3
      try {
        const Database = (await import("better-sqlite3")).default;
        const db = new Database(tmpPath, {
          readonly: true,
          fileMustExist: true,
        });
        const row = db.prepare("SELECT COUNT(*) as n FROM foods").get() as {
          n: number;
        };
        steps.push({
          name: "open_and_query",
          ok: true,
          detail: `opened OK, foods count: ${row.n}`,
        });
        db.close();
      } catch (e) {
        steps.push({
          name: "open_and_query",
          ok: false,
          detail: `${(e as Error).name}: ${(e as Error).message}\n${(e as Error).stack ?? ""}`.slice(
            0,
            500,
          ),
        });
      }
    }
  } catch (e) {
    steps.push({
      name: "fetch_github_raw",
      ok: false,
      detail: (e as Error).message,
    });
  }

  return NextResponse.json({ env, steps });
}
