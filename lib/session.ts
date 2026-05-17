/**
 * Session state — simulated "logged in" flag.
 *
 * Saat ini ga ada auth backend. Pakai localStorage flag untuk track apakah
 * user udah pernah "enter app" (klik Mulai quiz, Load demo, dll). Flag ini
 * SEPARATE dari profile completion.
 *
 * Flow:
 * - !hasEnteredApp() → user fresh, show landing
 * - hasEnteredApp() + profile complete → dashboard normal
 * - hasEnteredApp() + profile incomplete → dashboard with blocking modal
 */

const SESSION_KEY = "sehatin:session:v1";

export function markEnteredApp(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, "1");
}

export function hasEnteredApp(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SESSION_KEY) === "1";
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
