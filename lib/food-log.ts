/**
 * Food log — client-side localStorage CRUD untuk daily food tracking.
 *
 * Two-tier storage:
 * - localStorage (sync) — array of FoodLogEntry; source for reads
 * - Supabase food_log table (async) — write-through + hydrate on login
 *
 * Storage key: sehatin:food_log:v1
 */

export type MealSlot = "sarapan" | "makan_siang" | "makan_malam" | "snack";

export const MEAL_SLOTS: MealSlot[] = [
  "sarapan",
  "makan_siang",
  "makan_malam",
  "snack",
];

export const MEAL_SLOT_LABEL: Record<MealSlot, string> = {
  sarapan: "Sarapan",
  makan_siang: "Makan Siang",
  makan_malam: "Makan Malam",
  snack: "Snack",
};

export const MEAL_SLOT_EMOJI: Record<MealSlot, string> = {
  sarapan: "🌅",
  makan_siang: "☀️",
  makan_malam: "🌆",
  snack: "🍪",
};

export const MEAL_SLOT_DEFAULT_HOUR: Record<MealSlot, number> = {
  sarapan: 7,
  makan_siang: 12,
  makan_malam: 19,
  snack: 16,
};

export interface FoodLogEntry {
  id: string;
  date: string; // YYYY-MM-DD (local timezone)
  meal_slot: MealSlot;
  food_code?: string; // TKPI code if from search
  food_name: string;
  portion_g: number;
  kcal: number;
  protein_g?: number;
  fat_g?: number;
  carb_g?: number;
  source: "search" | "plan" | "photo" | "manual";
  notes?: string;
  created_at: string; // ISO timestamp
}

const KEY = "sehatin:food_log:v1";

// ============ Helpers ============

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ============ Storage ============

function loadAll(): FoodLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FoodLogEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveAll(entries: FoodLogEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(entries));
}

// ============ Public API ============

export function addEntry(
  partial: Omit<FoodLogEntry, "id" | "created_at">,
): FoodLogEntry {
  const entry: FoodLogEntry = {
    ...partial,
    id: uuid(),
    created_at: new Date().toISOString(),
  };
  const all = loadAll();
  all.push(entry);
  saveAll(all);
  void syncEntryToSupabase("upsert", entry);
  return entry;
}

export function deleteEntry(id: string): boolean {
  const all = loadAll();
  const next = all.filter((e) => e.id !== id);
  if (next.length === all.length) return false;
  saveAll(next);
  void syncEntryToSupabase("delete", { id } as FoodLogEntry);
  return true;
}

export function updateEntry(
  id: string,
  patch: Partial<FoodLogEntry>,
): FoodLogEntry | null {
  const all = loadAll();
  const idx = all.findIndex((e) => e.id === id);
  if (idx < 0) return null;
  const cur = all[idx];
  if (!cur) return null;
  const updated: FoodLogEntry = { ...cur, ...patch, id: cur.id };
  all[idx] = updated;
  saveAll(all);
  void syncEntryToSupabase("upsert", updated);
  return updated;
}

export function getEntriesByDate(date: string): FoodLogEntry[] {
  return loadAll().filter((e) => e.date === date);
}

export function getEntriesByDateRange(
  startDate: string,
  endDate: string,
): FoodLogEntry[] {
  return loadAll().filter((e) => e.date >= startDate && e.date <= endDate);
}

export interface DailySummary {
  date: string;
  total_kcal: number;
  total_protein_g: number;
  total_fat_g: number;
  total_carb_g: number;
  entry_count: number;
  per_slot: Record<MealSlot, { kcal: number; count: number }>;
  entries: FoodLogEntry[];
}

export function getDailySummary(date: string): DailySummary {
  const entries = getEntriesByDate(date);
  const per_slot: DailySummary["per_slot"] = {
    sarapan: { kcal: 0, count: 0 },
    makan_siang: { kcal: 0, count: 0 },
    makan_malam: { kcal: 0, count: 0 },
    snack: { kcal: 0, count: 0 },
  };
  let total_kcal = 0;
  let total_protein_g = 0;
  let total_fat_g = 0;
  let total_carb_g = 0;
  for (const e of entries) {
    total_kcal += e.kcal || 0;
    total_protein_g += e.protein_g || 0;
    total_fat_g += e.fat_g || 0;
    total_carb_g += e.carb_g || 0;
    const slot = per_slot[e.meal_slot];
    if (slot) {
      slot.kcal += e.kcal || 0;
      slot.count += 1;
    }
  }
  return {
    date,
    total_kcal: Math.round(total_kcal),
    total_protein_g: Math.round(total_protein_g * 10) / 10,
    total_fat_g: Math.round(total_fat_g * 10) / 10,
    total_carb_g: Math.round(total_carb_g * 10) / 10,
    entry_count: entries.length,
    per_slot,
    entries: entries.sort(
      (a, b) =>
        MEAL_SLOT_DEFAULT_HOUR[a.meal_slot] -
          MEAL_SLOT_DEFAULT_HOUR[b.meal_slot] ||
        a.created_at.localeCompare(b.created_at),
    ),
  };
}

export function getWeekSummaries(endDate: string = todayISO()): DailySummary[] {
  const summaries: DailySummary[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    summaries.push(getDailySummary(`${y}-${m}-${day}`));
  }
  return summaries;
}

export function getLoggedDates(): Set<string> {
  return new Set(loadAll().map((e) => e.date));
}

export function clearAll(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function exportAllAsJSON(): string {
  return JSON.stringify(
    { exported_at: new Date().toISOString(), entries: loadAll() },
    null,
    2,
  );
}

// ============ Supabase sync ============

/**
 * Write-through to Supabase. Called as fire-and-forget from addEntry,
 * updateEntry, and deleteEntry. localStorage stays the sync source of truth.
 */
async function syncEntryToSupabase(
  op: "upsert" | "delete",
  entry: FoodLogEntry,
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { createClient } = await import("@/lib/supabase/client");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (op === "delete") {
      const { error } = await supabase
        .from("food_log")
        .delete()
        .eq("id", entry.id)
        .eq("user_id", user.id);
      if (error) console.warn("[food_log] delete sync failed:", error.message);
      return;
    }

    const row = {
      id: entry.id,
      user_id: user.id,
      date: entry.date,
      meal_slot: entry.meal_slot,
      food_code: entry.food_code ?? null,
      food_name: entry.food_name,
      portion_g: entry.portion_g,
      kcal: entry.kcal,
      protein_g: entry.protein_g ?? null,
      fat_g: entry.fat_g ?? null,
      carb_g: entry.carb_g ?? null,
      source: entry.source,
      notes: entry.notes ?? null,
      created_at: entry.created_at,
    };
    const { error } = await supabase.from("food_log").upsert(row, {
      onConflict: "id",
    });
    if (error) console.warn("[food_log] upsert sync failed:", error.message);
  } catch (e) {
    console.warn("[food_log] sync threw:", e);
  }
}

/**
 * Fetch all food log entries for the current user from Supabase and write
 * them to localStorage. Overwrites the local cache — call after sign-in.
 */
export async function hydrateFoodLogFromSupabase(): Promise<number> {
  if (typeof window === "undefined") return 0;
  try {
    const { createClient } = await import("@/lib/supabase/client");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from("food_log")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });
    if (error) {
      console.warn("[food_log] hydrate failed:", error.message);
      return 0;
    }
    if (!data) return 0;

    const entries: FoodLogEntry[] = data.map(
      (r: {
        id: string;
        date: string;
        meal_slot: MealSlot;
        food_code: string | null;
        food_name: string;
        portion_g: number;
        kcal: number;
        protein_g: number | null;
        fat_g: number | null;
        carb_g: number | null;
        source: FoodLogEntry["source"];
        notes: string | null;
        created_at: string;
      }) => ({
        id: r.id,
        date: r.date,
        meal_slot: r.meal_slot,
        food_code: r.food_code ?? undefined,
        food_name: r.food_name,
        portion_g: r.portion_g,
        kcal: r.kcal,
        protein_g: r.protein_g ?? undefined,
        fat_g: r.fat_g ?? undefined,
        carb_g: r.carb_g ?? undefined,
        source: r.source,
        notes: r.notes ?? undefined,
        created_at: r.created_at,
      }),
    );
    saveAll(entries);
    return entries.length;
  } catch (e) {
    console.warn("[food_log] hydrate threw:", e);
    return 0;
  }
}
