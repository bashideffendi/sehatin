"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  MoreHorizontal,
  Zap,
  Clock,
  Check,
  Home,
  Timer,
  Plus,
} from "lucide-react";
import {
  getActiveWorkoutPlan,
  findNextUnloggedSession,
  type StoredWorkoutPlan,
  type WorkoutSession,
  type WorkoutExercise,
} from "@/lib/workout";
import { upsertSession, type ExerciseLog } from "@/lib/workout-log";
import { todayISO } from "@/lib/food-log";
import { Pill } from "@/components/ui";
import { useRouter } from "next/navigation";

const REST_TIMER_INITIAL = 60; // seconds

function focusEmojiBig(focus: string): string {
  const f = focus.toLowerCase();
  if (f.includes("push") || f.includes("dada") || f.includes("chest")) return "💪";
  if (f.includes("pull") || f.includes("punggung") || f.includes("back")) return "🪢";
  if (f.includes("leg") || f.includes("quad") || f.includes("posterior")) return "🦵";
  return "💪";
}

interface SetState {
  done: boolean;
}

export default function WorkoutSessionPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<StoredWorkoutPlan | null>(null);
  const [target, setTarget] = useState<{
    weekIdx: number;
    sessionIdx: number;
    session: WorkoutSession;
  } | null>(null);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setStates, setSetStates] = useState<Record<string, SetState[]>>({});
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load active plan + find next session
  useEffect(() => {
    const p = getActiveWorkoutPlan();
    setPlan(p);
    if (p) {
      const next = findNextUnloggedSession(p);
      if (next) {
        setTarget(next);
        // Initialize set states for all exercises in this session
        const all = [...next.session.warmup, ...next.session.main, ...(next.session.cooldown ?? [])];
        const init: Record<string, SetState[]> = {};
        for (let i = 0; i < all.length; i++) {
          const ex = all[i];
          init[`${i}`] = Array.from({ length: ex.sets }, () => ({ done: false }));
        }
        setSetStates(init);
      }
    }
  }, []);

  // Tick rest timer
  useEffect(() => {
    if (restRemaining === null) return;
    intervalRef.current = setInterval(() => {
      setRestRemaining((r) => {
        if (r === null) return null;
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return null;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [restRemaining]);

  const allExercises = useMemo(() => {
    if (!target) return [];
    return [
      ...target.session.warmup,
      ...target.session.main,
      ...(target.session.cooldown ?? []),
    ];
  }, [target]);

  const currentExercise = allExercises[exerciseIdx];
  const nextExercises = allExercises.slice(exerciseIdx + 1, exerciseIdx + 5);

  const toggleSet = useCallback(
    (exIdx: number, setIdx: number) => {
      setSetStates((cur) => {
        const next = { ...cur };
        const states = next[`${exIdx}`] ?? [];
        const states2 = states.map((s, i) =>
          i === setIdx ? { ...s, done: !s.done } : s,
        );
        next[`${exIdx}`] = states2;
        return next;
      });
      // Start rest timer when set is just marked done
      setRestRemaining(REST_TIMER_INITIAL);
    },
    [],
  );

  const totalProgress = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const states of Object.values(setStates)) {
      for (const s of states) {
        total++;
        if (s.done) done++;
      }
    }
    return { done, total };
  }, [setStates]);

  const handleFinishSession = useCallback(() => {
    if (!plan || !target) return;
    const exerciseLogs: ExerciseLog[] = allExercises.map((ex, i) => ({
      exercise_code: ex.exercise_code,
      exercise_name: ex.exercise_name,
      completed: (setStates[`${i}`] ?? []).some((s) => s.done),
    }));
    upsertSession({
      date: todayISO(),
      plan_id: plan.id,
      week_idx: target.weekIdx,
      session_idx: target.sessionIdx,
      day_label: target.session.day_label,
      focus: target.session.focus,
      exercises: exerciseLogs,
      duration_min: target.session.duration_estimate_min,
    });
    alert("Sesi tersimpan! Kembali ke /workout.");
    router.push("/workout");
  }, [plan, target, allExercises, setStates, router]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted text-sm">Belum ada program aktif.</p>
          <Link
            href="/workout"
            className="mt-3 inline-flex items-center px-4 py-2 rounded-full bg-forest text-paper font-semibold text-sm"
          >
            Generate program
          </Link>
        </div>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted text-sm">
            Semua sesi udah selesai! 🎉
          </p>
          <Link
            href="/workout"
            className="mt-3 inline-flex items-center px-4 py-2 rounded-full bg-forest text-paper font-semibold text-sm"
          >
            Kembali ke /workout
          </Link>
        </div>
      </div>
    );
  }

  const totalWeeks = plan.weeks;
  const currentWeek = target.weekIdx + 1;
  const completedSetsCount = Object.values(setStates).filter((states) =>
    states.every((s) => s.done),
  ).length;
  const totalExercisesInSession = allExercises.length;

  return (
    <div className="min-h-screen bg-ink text-paper relative pb-6">
      {/* ============ Top bar (ink theme) ============ */}
      <div className="px-4 pt-4 pb-2 sticky top-0 bg-ink z-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <Link
            href="/workout"
            className="w-9 h-9 rounded-full bg-paper/10 inline-flex items-center justify-center hover:bg-paper/20"
            aria-label="Kembali"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <span className="px-3 py-1.5 rounded-full bg-paper/10 text-[11.5px] font-semibold">
            Minggu {currentWeek} dari {totalWeeks}
          </span>
          <button
            className="w-9 h-9 rounded-full bg-paper/10 inline-flex items-center justify-center hover:bg-paper/20"
            aria-label="Menu"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Session title */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-paper/60">
            {target.session.day_label.toUpperCase()} · Sesi{" "}
            {plan.program.weeks
              .slice(0, target.weekIdx)
              .reduce((s, w) => s + w.sessions.length, 0) +
              target.sessionIdx +
              1}{" "}
            dari{" "}
            {plan.program.weeks.reduce((s, w) => s + w.sessions.length, 0)}
          </div>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight leading-tight">
            {target.session.focus.includes("push")
              ? "Push Day"
              : target.session.focus.includes("pull")
                ? "Pull Day"
                : target.session.focus.includes("leg") ||
                    target.session.focus.includes("lower")
                  ? "Leg Day"
                  : "Workout"}{" "}
            ·{" "}
            <span
              className="italic text-clay font-normal"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {target.session.focus}
            </span>
          </h1>
          <div className="mt-2 flex items-center gap-3 text-[11.5px] text-paper/65">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {target.session.duration_estimate_min} mnt
            </span>
            <span className="inline-flex items-center gap-1">
              💪 {totalExercisesInSession} gerakan
            </span>
            <span className="inline-flex items-center gap-1">
              <Home className="w-3 h-3" /> Home
            </span>
          </div>
        </div>
      </div>

      {/* ============ White content area ============ */}
      <div className="bg-paper text-ink rounded-t-[28px] mt-4 px-4 pt-4 pb-6 min-h-[60vh]">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-4">
          {allExercises.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all flex-1 ${
                i < exerciseIdx
                  ? "bg-forest"
                  : i === exerciseIdx
                    ? "bg-forest"
                    : "bg-hairline-2"
              }`}
            />
          ))}
          <span className="text-[11px] tabular text-muted ml-2 flex-shrink-0">
            {exerciseIdx + 1}/{allExercises.length}
          </span>
        </div>

        {/* Exercise hero card */}
        {currentExercise && (
          <div className="rounded-[20px] bg-forest text-paper overflow-hidden mb-4">
            <div className="relative h-32 flex items-center justify-center">
              <span className="text-6xl">
                {focusEmojiBig(target.session.focus)}
              </span>
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full bg-paper/15 text-[10.5px] font-bold uppercase">
                  Gerakan {exerciseIdx + 1}
                </span>
              </div>
              <button
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-paper/15 inline-flex items-center justify-center hover:bg-paper/25"
                aria-label="Detail"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Current exercise name + sub */}
        {currentExercise && (
          <>
            <h2 className="text-[18px] font-extrabold tracking-tight">
              {currentExercise.exercise_name}
            </h2>
            <p className="mt-1 text-[12.5px] text-muted">
              {target.session.focus} · {currentExercise.notes ?? "target hipertrofi"}
            </p>

            {/* Set rows */}
            <div className="mt-4 space-y-2.5">
              {(setStates[`${exerciseIdx}`] ?? []).map((st, si) => {
                const isNext =
                  !st.done &&
                  (setStates[`${exerciseIdx}`] ?? []).findIndex((s) => !s.done) ===
                    si;
                return (
                  <button
                    key={si}
                    onClick={() => toggleSet(exerciseIdx, si)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-[14px] border transition-colors ${
                      st.done
                        ? "bg-surface border-hairline"
                        : isNext
                          ? "bg-forest-50/40 border-forest/30"
                          : "bg-clay-50/40 border-clay/20"
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wide text-muted w-12 text-left">
                      Set {si + 1}
                    </span>
                    <span className="text-[14px] tabular flex-1 text-left">
                      <span className="font-bold">{currentExercise.reps}</span>
                      <span className="text-muted text-[12px]"> reps</span>
                    </span>
                    <span className="text-[14px] tabular font-bold">
                      12kg
                    </span>
                    <span
                      className={`w-6 h-6 rounded-full inline-flex items-center justify-center flex-shrink-0 ${
                        st.done
                          ? "bg-forest text-paper"
                          : "border border-hairline-2 text-transparent"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Rest timer */}
            {restRemaining !== null && (
              <div className="mt-4 rounded-[14px] bg-ink text-paper px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-sun/20 text-sun">
                    <Timer className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-paper/60">
                      Istirahat
                    </div>
                    <div
                      className="tabular leading-none"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: 22,
                      }}
                    >
                      {String(Math.floor(restRemaining / 60)).padStart(2, "0")}:
                      {String(restRemaining % 60).padStart(2, "0")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRestRemaining((r) => (r ?? 0) + 30)}
                    className="px-3 py-1.5 rounded-full bg-sun text-ink text-[11px] font-bold"
                  >
                    +30s
                  </button>
                  <button
                    onClick={() => setRestRemaining(null)}
                    className="px-3 py-1.5 rounded-full bg-paper/15 text-paper text-[11px] font-bold"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ============ Berikutnya list ============ */}
        {nextExercises.length > 0 && (
          <div className="mt-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted mb-2">
              Berikutnya
            </div>
            <ul className="space-y-2">
              {nextExercises.map((ex, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] bg-surface border border-hairline"
                >
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-paper-deep text-clay text-lg">
                    {ex.exercise_name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] tracking-tight truncate">
                      {ex.exercise_name}
                    </div>
                    <div className="text-[10.5px] text-muted truncate">
                      {ex.sets} × {ex.reps}
                      {ex.rest_seconds > 0 && ` · rest ${ex.rest_seconds}s`}
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-muted rotate-180 flex-shrink-0" />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ============ Bottom navigation ============ */}
        <div className="mt-6 flex gap-2">
          <button
            disabled={exerciseIdx === 0}
            onClick={() => setExerciseIdx((i) => Math.max(0, i - 1))}
            className="px-4 py-2.5 rounded-full bg-surface-2 text-ink text-[12px] font-bold disabled:opacity-40"
          >
            ← Prev
          </button>
          {exerciseIdx < allExercises.length - 1 ? (
            <button
              onClick={() =>
                setExerciseIdx((i) =>
                  Math.min(allExercises.length - 1, i + 1),
                )
              }
              className="flex-1 py-2.5 rounded-full bg-forest text-paper font-bold text-[12.5px]"
            >
              Next gerakan →
            </button>
          ) : (
            <button
              onClick={handleFinishSession}
              className="flex-1 py-2.5 rounded-full bg-ink text-paper font-bold text-[12.5px] inline-flex items-center justify-center gap-2"
            >
              <Check className="w-3.5 h-3.5" /> Selesai sesi
            </button>
          )}
        </div>

        <p className="mt-3 text-center text-[10.5px] text-muted">
          {totalProgress.done}/{totalProgress.total} set selesai
        </p>
      </div>
    </div>
  );
}
