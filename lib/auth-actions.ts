/**
 * Auth-related client helpers that span both Supabase and localStorage.
 *
 * Sign-out flow: kill the Supabase session, then clear EVERY sehatin
 * localStorage key so the next user signing in on this device doesn't see
 * stale data from the previous user.
 */
"use client";

import { createClient } from "@/lib/supabase/client";

// Every localStorage key the app writes to. Keep this in sync with each
// lib that uses window.localStorage.
const SEHATIN_LOCALSTORAGE_KEYS = [
  "sehatin:profile:v2",
  "sehatin:food_log:v1",
  "sehatin:weight_log:v1",
  "sehatin:meal_plan:v1",
  "sehatin:workout_plan:v1",
  "sehatin:workout_log:v1",
  "sehatin:session:v1",
  "sehatin:migrated_to_supabase:v1",
];

export function clearAllSehatinLocalStorage(): void {
  if (typeof window === "undefined") return;
  for (const key of SEHATIN_LOCALSTORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

/**
 * Sign out: revoke Supabase session, clear localStorage, navigate to home.
 * Caller should redirect after this resolves (e.g. `router.push("/")` or
 * `window.location.assign("/")`).
 */
export async function signOut(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (e) {
    console.warn("[auth] Supabase signOut failed (continuing cleanup):", e);
  }
  clearAllSehatinLocalStorage();
}
