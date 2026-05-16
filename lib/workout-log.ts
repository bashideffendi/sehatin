/**
 * Workout log — actual workout session records.
 *
 * Storage key: sehatin:workout_log:v1
 *
 * Schema: array of WorkoutSessionLog. Each session = date + which exercises were
 * actually done. For MVP, per-exercise "done" checkbox + optional notes,
 * skipping per-set-rep-weight granularity (can be added later via SetEntry).
 */

export interface SetEntry {
  set_number: number;
  reps_completed?: number;
  weight_kg?: number;
  rpe?: number;
}

export interface ExerciseLog {
  exercise_code: string;
  exercise_name: string;
  completed: boolean;
  /** Optional detailed sets — UI doesn't surface in MVP but reserved. */
  sets?: SetEntry[];
  notes?: string;
}

export interface WorkoutSessionLog {
  id: string;
  date: string; // YYYY-MM-DD
  plan_id?: string; // ref to active StoredWorkoutPlan
  week_idx?: number; // 0-based
  session_idx?: number; // 0-based
  day_label?: string;
  focus?: string;
  exercises: ExerciseLog[];
  duration_min?: number;
  notes?: string;
  created_at: string;
}

const KEY = "sehatin:workout_log:v1";

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadAll(): WorkoutSessionLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WorkoutSessionLog[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveAll(sessions: WorkoutSessionLog[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(sessions));
}

/**
 * Add or REPLACE a session log for a given plan_id + week_idx + session_idx.
 * If user re-logs the same session, the previous entry is replaced.
 * If plan refs are absent, just appends.
 */
export function upsertSession(
  partial: Omit<WorkoutSessionLog, "id" | "created_at">,
): WorkoutSessionLog {
  const entry: WorkoutSessionLog = {
    ...partial,
    id: uuid(),
    created_at: new Date().toISOString(),
  };
  const all = loadAll();
  let next = all;
  if (
    partial.plan_id !== undefined &&
    partial.week_idx !== undefined &&
    partial.session_idx !== undefined
  ) {
    next = all.filter(
      (s) =>
        !(
          s.plan_id === partial.plan_id &&
          s.week_idx === partial.week_idx &&
          s.session_idx === partial.session_idx
        ),
    );
  }
  next.push(entry);
  saveAll(next);
  return entry;
}

export function deleteSession(id: string): boolean {
  const all = loadAll();
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  saveAll(next);
  return true;
}

export function getAllSessions(): WorkoutSessionLog[] {
  return loadAll().sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get the most recent log for a specific session slot in a plan.
 * Used to mark a session "✓ done" in the workout view.
 */
export function getSessionLog(
  planId: string,
  weekIdx: number,
  sessionIdx: number,
): WorkoutSessionLog | null {
  const matching = loadAll().filter(
    (s) =>
      s.plan_id === planId &&
      s.week_idx === weekIdx &&
      s.session_idx === sessionIdx,
  );
  if (matching.length === 0) return null;
  // Return most recent
  matching.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return matching[0] ?? null;
}

export function getSessionsByDate(date: string): WorkoutSessionLog[] {
  return loadAll().filter((s) => s.date === date);
}

export function getSessionsByDateRange(
  startDate: string,
  endDate: string,
): WorkoutSessionLog[] {
  return loadAll().filter(
    (s) => s.date >= startDate && s.date <= endDate,
  );
}

export function getLoggedSessionDates(): Set<string> {
  return new Set(loadAll().map((s) => s.date));
}

/** Total sessions logged for a plan, regardless of week/session. */
export function countSessionsForPlan(planId: string): number {
  return loadAll().filter((s) => s.plan_id === planId).length;
}

export function clearAllSessions(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
