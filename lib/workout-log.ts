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
  void syncWorkoutLogToSupabase("upsert", entry);
  return entry;
}

export function deleteSession(id: string): boolean {
  const all = loadAll();
  const removed = all.find((s) => s.id === id);
  const next = all.filter((s) => s.id !== id);
  if (next.length === all.length) return false;
  saveAll(next);
  if (removed) void syncWorkoutLogToSupabase("delete", removed);
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

// ============ Supabase sync ============

async function syncWorkoutLogToSupabase(
  op: "upsert" | "delete",
  entry: WorkoutSessionLog,
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
        .from("workout_logs")
        .delete()
        .eq("id", entry.id)
        .eq("user_id", user.id);
      if (error)
        console.warn("[workout_log] delete sync failed:", error.message);
      return;
    }

    const row = {
      id: entry.id,
      user_id: user.id,
      date: entry.date,
      plan_id: entry.plan_id ?? null,
      week_idx: entry.week_idx ?? null,
      session_idx: entry.session_idx ?? null,
      day_label: entry.day_label ?? null,
      focus: entry.focus ?? null,
      exercises: entry.exercises,
      duration_min: entry.duration_min ?? null,
      notes: entry.notes ?? null,
      created_at: entry.created_at,
    };
    const { error } = await supabase.from("workout_logs").upsert(row, {
      onConflict: "id",
    });
    if (error)
      console.warn("[workout_log] upsert sync failed:", error.message);
  } catch (e) {
    console.warn("[workout_log] sync threw:", e);
  }
}

export async function hydrateWorkoutLogFromSupabase(): Promise<number> {
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
      .from("workout_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });
    if (error) {
      console.warn("[workout_log] hydrate failed:", error.message);
      return 0;
    }
    if (!data) return 0;

    const sessions: WorkoutSessionLog[] = data.map(
      (r: {
        id: string;
        date: string;
        plan_id: string | null;
        week_idx: number | null;
        session_idx: number | null;
        day_label: string | null;
        focus: string | null;
        exercises: ExerciseLog[];
        duration_min: number | null;
        notes: string | null;
        created_at: string;
      }) => ({
        id: r.id,
        date: r.date,
        plan_id: r.plan_id ?? undefined,
        week_idx: r.week_idx ?? undefined,
        session_idx: r.session_idx ?? undefined,
        day_label: r.day_label ?? undefined,
        focus: r.focus ?? undefined,
        exercises: r.exercises,
        duration_min: r.duration_min ?? undefined,
        notes: r.notes ?? undefined,
        created_at: r.created_at,
      }),
    );
    saveAll(sessions);
    return sessions.length;
  } catch (e) {
    console.warn("[workout_log] hydrate threw:", e);
    return 0;
  }
}
