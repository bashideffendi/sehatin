/**
 * Weight log — localStorage CRUD untuk weight tracking.
 */

export interface WeightLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight_kg: number;
  notes?: string;
  created_at: string;
}

const KEY = "sehatin:weight_log:v1";

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadAll(): WeightLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WeightLogEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveAll(entries: WeightLogEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(entries));
}

export function addWeight(
  partial: Omit<WeightLogEntry, "id" | "created_at">,
): WeightLogEntry {
  const entry: WeightLogEntry = {
    ...partial,
    id: uuid(),
    created_at: new Date().toISOString(),
  };
  const all = loadAll();
  // Replace existing entry for same date (1 per day)
  const filtered = all.filter((e) => e.date !== entry.date);
  filtered.push(entry);
  saveAll(filtered);
  return entry;
}

export function deleteWeight(id: string): boolean {
  const all = loadAll();
  const next = all.filter((e) => e.id !== id);
  if (next.length === all.length) return false;
  saveAll(next);
  return true;
}

export function getWeightHistory(): WeightLogEntry[] {
  return loadAll().sort((a, b) => a.date.localeCompare(b.date));
}

export function getLatestWeight(): WeightLogEntry | null {
  const all = getWeightHistory();
  return all.length > 0 ? (all[all.length - 1] ?? null) : null;
}

export function getWeightOnDate(date: string): WeightLogEntry | null {
  return loadAll().find((e) => e.date === date) ?? null;
}

export interface WeightTrend {
  start_kg: number;
  current_kg: number;
  delta_kg: number;
  days: number;
  rate_kg_per_week: number;
}

export function getWeightTrend(days = 7): WeightTrend | null {
  const history = getWeightHistory();
  if (history.length < 2) return null;
  const latest = history[history.length - 1];
  if (!latest) return null;
  // Find earliest in last N days
  const cutoff = new Date(latest.date);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const start = history.find((e) => e.date >= cutoffStr);
  if (!start || start.id === latest.id) return null;
  const startDate = new Date(start.date);
  const endDate = new Date(latest.date);
  const actualDays = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const delta = latest.weight_kg - start.weight_kg;
  return {
    start_kg: start.weight_kg,
    current_kg: latest.weight_kg,
    delta_kg: Math.round(delta * 10) / 10,
    days: actualDays,
    rate_kg_per_week: Math.round((delta / actualDays) * 7 * 100) / 100,
  };
}

export function clearAllWeight(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
