/**
 * Middleware Supabase helper — refreshes session cookies on every request.
 * Used by app/middleware.ts to keep auth state in sync.
 *
 * Gracefully no-ops if Supabase env vars are missing (dev/preview without
 * Supabase configured) so the app still loads with localStorage fallback.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // No Supabase env → skip session refresh, pass through
  if (!url || !anon) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient<Database>(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    });

    // CRITICAL: do not put any code between createServerClient and supabase.auth.getUser().
    // It refreshes auth tokens.
    await supabase.auth.getUser();
  } catch (e) {
    console.warn("[middleware] supabase session refresh failed:", e);
    // Don't crash the app — pass through
  }

  return supabaseResponse;
}
