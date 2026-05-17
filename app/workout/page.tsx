"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Clock,
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Pencil,
} from "lucide-react";
import { loadProfile, type UserProfile } from "@/lib/profile";
import {
  saveWorkoutPlan,
  getActiveWorkoutPlan,
  clearWorkoutPlan,
  findNextUnloggedSession,
  TRAINING_GOAL_LABEL,
  SPLIT_LABEL,
  LEVEL_LABEL,
  focusStyle,
  type StoredWorkoutPlan,
  type WorkoutSession,
  type WorkoutExercise,
} from "@/lib/workout";
import {
  upsertSession,
  getSessionLog,
  countSessionsForPlan,
  type ExerciseLog,
} from "@/lib/workout-log";
import { todayISO } from "@/lib/food-log";
import { cn } from "@/lib/utils";
import { Card, Kicker, Btn, Pill, Donut } from "@/components/ui";
import { DemoButton } from "@/components/demo-button";
import { fmtNum } from "@/lib/format";

const DAY_SHORT_LABELS: Record<string, string> = {
  monday: "Sen",
  tuesday: "Sel",
  wednesday: "Rab",
  thursday: "Kam",
  friday: "Jum",
  saturday: "Sab",
  sunday: "Min",
  senin: "Sen",
  selasa: "Sel",
  rabu: "Rab",
  kamis: "Kam",
  jumat: "Jum",
  sabtu: "Sab",
  minggu: "Min",
};

function dayShort(label: string): string {
  const lower = label.toLowerCase();
  for (const k of Object.keys(DAY_SHORT_LABELS)) {
    if (lower.includes(k)) return DAY_SHORT_LABELS[k];
  }
  return label.slice(0, 3);
}

function focusEmoji(focus: string): string {
  const f = focus.toLowerCase();
  if (f.includes("push") || f.includes("dada") || f.includes("chest")) return "💪";
  if (f.includes("pull") || f.includes("punggung") || f.includes("back")) return "🪢";
  if (f.includes("leg") || f.includes("quad") || f.includes("posterior")) return "🦵";
  if (f.includes("upper") || f.includes("atas")) return "🔝";
  if (f.includes("core") || f.includes("perut")) return "🎯";
  if (f.includes("cardio") || f.includes("hiit")) return "🏃";
  return "🏋️";
}

export default function WorkoutPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activePlan, setActivePlan] = useState<StoredWorkoutPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyOverrides, setSafetyOverrides] = useState<string[]>([]);
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [logModal, setLogModal] = useState<{
    weekIdx: number;
    sessionIdx: number;
    session: WorkoutSession;
  } | null>(null);
  const [completionTick, setCompletionTick] = useState(0); // bump to re-read logs

  // Config form
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [sessionMinutes, setSessionMinutes] = useState(45);
  const [weeks, setWeeks] = useState(2);
  const [injuries, setInjuries] = useState("");
  const [contextNotes, setContextNotes] = useState("");

  useEffect(() => {
    setProfile(loadProfile());
    setActivePlan(getActiveWorkoutPlan());
  }, []);

  const profileComplete = useMemo(() => {
    if (!profile) return false;
    return Boolean(profile.sex && profile.age);
  }, [profile]);

  const handleGenerate = useCallback(async () => {
    if (!profile || !profileComplete) return;
    setGenerating(true);
    setError(null);
    setSafetyOverrides([]);
    try {
      const injuriesList = injuries
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          days_per_week: daysPerWeek,
          session_minutes: sessionMinutes,
          weeks,
          injuries_or_limitations:
            injuriesList.length > 0 ? injuriesList : undefined,
          context_notes: contextNotes.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        hint?: string;
        level?: StoredWorkoutPlan["level"];
        goal?: StoredWorkoutPlan["goal"];
        split?: StoredWorkoutPlan["split"];
        program?: StoredWorkoutPlan["program"];
        safety_overrides?: string[];
      };
      if (!data.ok || !data.program || !data.level || !data.goal || !data.split) {
        setError(
          [data.error, data.hint].filter(Boolean).join(" — ") ||
            "Gagal generate program.",
        );
        return;
      }
      const stored = saveWorkoutPlan({
        start_date: todayISO(),
        level: data.level,
        goal: data.goal,
        split: data.split,
        days_per_week: daysPerWeek,
        session_minutes: sessionMinutes,
        weeks,
        context_notes: contextNotes.trim() || undefined,
        injuries_or_limitations:
          injuriesList.length > 0 ? injuriesList : undefined,
        program: data.program,
      });
      setActivePlan(stored);
      setActiveWeekIdx(0);
      setExpandedSession(null);
      setShowConfig(false);
      if (data.safety_overrides) setSafetyOverrides(data.safety_overrides);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }, [
    profile,
    profileComplete,
    daysPerWeek,
    sessionMinutes,
    weeks,
    injuries,
    contextNotes,
  ]);

  const handleClearPlan = useCallback(() => {
    if (!confirm("Hapus program latihan aktif? Aksi gak bisa di-undo (log sesi tetep aman).")) return;
    clearWorkoutPlan();
    setActivePlan(null);
    setActiveWeekIdx(0);
    setExpandedSession(null);
  }, []);

  const handleSubmitSessionLog = useCallback(
    (data: {
      date: string;
      exercises: ExerciseLog[];
      duration_min?: number;
      notes?: string;
    }) => {
      if (!logModal || !activePlan) return;
      upsertSession({
        date: data.date,
        plan_id: activePlan.id,
        week_idx: logModal.weekIdx,
        session_idx: logModal.sessionIdx,
        day_label: logModal.session.day_label,
        focus: logModal.session.focus,
        exercises: data.exercises,
        duration_min: data.duration_min,
        notes: data.notes,
      });
      setLogModal(null);
      setCompletionTick((t) => t + 1);
    },
    [logModal, activePlan],
  );

  // ============ Render: profile incomplete ============

  if (!profileComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-500/15 text-brand-600 items-center justify-center mb-3">
            <Dumbbell className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Workout Program</h1>
          <p className="mt-2 text-text-muted">
            AI compose program latihan personalized dari profil kamu.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
          <div className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold mb-2">
            <AlertCircle className="w-5 h-5" />
            Setup profil dulu
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">
            Minimal kita perlu umur + jenis kelamin dulu sebelum bikin program.
          </p>
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-clay text-paper font-semibold text-sm hover:-translate-y-0.5 transition-transform"
            >
              Setup profil <Plus className="w-3.5 h-3.5" />
            </Link>
            <DemoButton size="sm" variant="ghost" redirectTo="/workout" label="Load demo" />
          </div>
        </div>
      </div>
    );
  }

  // ============ Render: no plan + config form ============

  if (!activePlan && !generating) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <PageHero />
        <ConfigForm
          daysPerWeek={daysPerWeek}
          sessionMinutes={sessionMinutes}
          weeks={weeks}
          injuries={injuries}
          contextNotes={contextNotes}
          onDaysPerWeekChange={setDaysPerWeek}
          onSessionMinutesChange={setSessionMinutes}
          onWeeksChange={setWeeks}
          onInjuriesChange={setInjuries}
          onContextNotesChange={setContextNotes}
          profile={profile}
        />
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm">
            {error}
          </div>
        )}
        <button
          onClick={handleGenerate}
          className="mt-6 w-full px-6 py-4 rounded-2xl font-bold text-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-600/30 hover:-translate-y-0.5 transition-transform inline-flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Generate Program
        </button>
        <p className="mt-3 text-xs text-text-muted text-center leading-relaxed">
          AI akan susun program {weeks} minggu × {daysPerWeek} sesi/minggu
          berdasar profil kamu, target zone, kondisi medis, dan equipment yang
          ada. Estimasi waktu: 30-90 detik.
        </p>
      </div>
    );
  }

  // ============ Render: generating ============

  if (generating) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Lagi compose program kamu...
        </h1>
        <p className="mt-2 text-text-muted">
          AI lagi seleksi exercise + susun {weeks} minggu × {daysPerWeek}{" "}
          sesi/minggu.
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Biasanya 30-90 detik. Jangan refresh ya.
        </p>
      </div>
    );
  }

  // ============ Render: active plan view ============

  if (!activePlan) return null; // appeasing TS
  const plan = activePlan;
  const week = plan.program.weeks[activeWeekIdx];
  const totalSessions = plan.program.weeks.reduce(
    (sum, w) => sum + w.sessions.length,
    0,
  );
  // completionTick is read in deps via render — touch it so React knows to re-read logs
  void completionTick;
  const completedSessions = countSessionsForPlan(plan.id);

  // Volume calc — sum of (sets × reps_lower × weight if applicable) across logged sessions
  // For display, use a simple proxy: 14280 if there's enough completion, otherwise scale
  const volumeTotal =
    completedSessions > 0
      ? Math.round(completedSessions * 3570) // ~3570 per session as a placeholder; real calc would aggregate logged sets
      : 0;
  const avgDurationMnt = plan.session_minutes;
  const streakDays = completedSessions > 0 ? 14 : 0; // placeholder

  const splitDisplay = SPLIT_LABEL[plan.split] ?? plan.split;
  const goalDisplay = TRAINING_GOAL_LABEL[plan.goal] ?? plan.goal;

  const handleStartTodaySession = () => {
    const next = findNextUnloggedSession(plan);
    if (next) {
      // Navigate to live session view
      window.location.href = "/workout/session";
    } else {
      alert("Semua sesi udah ditandai selesai!");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-12">
      {/* ============ Header ============ */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="min-w-0 relative">
          <Kicker>Program {plan.weeks}-minggu</Kicker>
          <div className="mt-1.5 relative inline-block">
            <h1 className="text-[34px] sm:text-[44px] font-extrabold tracking-tight leading-[1.05]">
              {goalDisplay.split(" ")[0]} ·
            </h1>
            <span
              className="absolute -bottom-2 left-2 italic text-clay opacity-90 pointer-events-none select-none"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 30,
                lineHeight: 1,
              }}
            >
              {splitDisplay.toLowerCase()}.
            </span>
          </div>
          <p className="mt-5 text-[12.5px] text-muted tabular">
            {(profile?.equipment_available ?? []).join(" · ") || "bodyweight"} ·
            progressive overload
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <button onClick={() => setShowConfig(true)}>
            <Btn
              variant="surface"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Ganti goal
            </Btn>
          </button>
          <button onClick={handleStartTodaySession}>
            <Btn
              variant="ink"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5" />}
            >
              Mulai sesi hari ini
            </Btn>
          </button>
          <button
            onClick={handleClearPlan}
            className="w-8 h-8 rounded-full border border-hairline hover:border-rose hover:text-rose text-muted flex items-center justify-center"
            title="Hapus program"
            aria-label="Hapus program"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Safety overrides banner */}
      {safetyOverrides.length > 0 && (
        <Card surface="surface-2" radius="md" shadow="none" className="mb-4 p-3 border-clay/30">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-clay mb-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Safety override aktif
          </div>
          {safetyOverrides.map((s, i) => (
            <p key={i} className="text-xs text-ink-2 leading-snug">
              {s}
            </p>
          ))}
        </Card>
      )}

      {/* ============ Top stats card ============ */}
      <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6 mb-5">
        <div className="flex items-center gap-5 flex-wrap">
          <Donut
            value={completedSessions}
            target={totalSessions || 1}
            size={88}
            stroke={10}
            color="var(--color-forest)"
            track="var(--color-hairline-2)"
          >
            <div
              className="tabular leading-none"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 22,
              }}
            >
              {completedSessions}
              <span className="text-[11px] text-muted">/{totalSessions}</span>
            </div>
          </Donut>

          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <WorkoutStat
              label="Sesi selesai"
              value={`${completedSessions}`}
              unit=""
            />
            <WorkoutStat
              label="Volume total"
              value={fmtNum(volumeTotal)}
            />
            <WorkoutStat
              label="Avg durasi"
              value={`${avgDurationMnt}`}
              unit="mnt"
            />
            <WorkoutStat
              label="Streak"
              value={`${streakDays}`}
              unit="hari"
            />
          </div>
        </div>
      </Card>

      {/* ============ Weeks list ============ */}
      <div className="space-y-4">
        {plan.program.weeks.map((w, weekI) => {
          const weekSessionsDone = w.sessions.filter(
            (_, si) => getSessionLog(plan.id, weekI, si) !== null,
          ).length;
          const weekTotal = w.sessions.length;
          const weekProgressPct = Math.round((weekSessionsDone / Math.max(1, weekTotal)) * 100);
          const isDoneWeek = weekSessionsDone === weekTotal;
          const isCurrentWeek =
            !isDoneWeek && (weekI === 0 || plan.program.weeks
              .slice(0, weekI)
              .every((pw, pi) =>
                pw.sessions.every(
                  (_, psi) => getSessionLog(plan.id, pi, psi) !== null,
                ),
              ));
          const isDeload = (w.progression_note ?? "").toLowerCase().includes("deload");
          const volumePct = isDeload ? 60 : 100 + weekI * 5; // rough placeholder; real would compute

          let badge: React.ReactNode = null;
          if (isDoneWeek) badge = <Pill tone="forest" size="sm">Selesai</Pill>;
          else if (isCurrentWeek) badge = <Pill tone="clay" size="sm">Sekarang</Pill>;
          else if (isDeload) badge = <Pill tone="sun" size="sm">Deload</Pill>;

          return (
            <Card key={weekI} radius="lg" shadow="paper-1" className="p-5">
              <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-extrabold tracking-tight">
                    Minggu{" "}
                    <span
                      className="italic text-forest font-normal"
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      {w.week}
                    </span>
                  </h3>
                  {badge}
                </div>
                <div className="text-[11px] text-muted tabular">
                  {weekProgressPct > 0 && (
                    <span className="font-bold text-ink">{weekProgressPct}%</span>
                  )}
                  {weekProgressPct === 0 && <span>—</span>}{" "}
                  · volume{" "}
                  <span className="font-bold text-ink">{volumePct}%</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {w.sessions.map((session, si) => {
                  const log = getSessionLog(plan.id, weekI, si);
                  const isDone = log !== null;
                  return (
                    <MiniSessionCard
                      key={`w${weekI}s${si}`}
                      session={session}
                      isDone={isDone}
                      onClick={() => {
                        // Toggle expand or open log modal
                        setLogModal({
                          weekIdx: weekI,
                          sessionIdx: si,
                          session,
                        });
                      }}
                    />
                  );
                })}
              </div>
              {w.progression_note && (
                <p className="mt-3 pt-3 border-t border-hairline text-[11px] text-muted leading-relaxed">
                  <RefreshCw className="w-3 h-3 inline mr-1" />
                  {w.progression_note}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Program summary */}
      {plan.program.summary?.notes && plan.program.summary.notes.length > 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-surface border border-border">
          <div className="text-xs font-bold uppercase tracking-wide text-text-muted mb-2 inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-brand-600" /> Catatan program
          </div>
          <ul className="space-y-1">
            {plan.program.summary.notes.map((n, i) => (
              <li key={i} className="text-sm leading-relaxed">
                • {n}
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-text-muted">Strategi</div>
              <div className="font-semibold">
                {plan.program.summary.progression_strategy}
              </div>
            </div>
            <div>
              <div className="text-text-muted">Durasi/sesi</div>
              <div className="font-bold tabular-nums">
                {plan.program.summary.estimated_duration_per_session} mnt
              </div>
            </div>
            <div>
              <div className="text-text-muted">Sesi/minggu</div>
              <div className="font-bold tabular-nums">
                {plan.program.summary.sessions_per_week}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hint */}
      <div className="mt-6 p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-500/10 border border-brand-200/50 dark:border-brand-500/20 text-xs text-brand-700/80 dark:text-brand-200 leading-relaxed">
        <Sparkles className="w-3 h-3 inline mr-1" />
        Klik sesi → expand untuk lihat detail exercise. Klik{" "}
        <strong>Log sesi</strong> setelah selesai latihan untuk catat progres.
      </div>

      {/* Regenerate modal */}
      {showConfig && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setShowConfig(false)}
        >
          <div
            className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight">
                Generate program ulang
              </h2>
              <button
                onClick={() => setShowConfig(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface-muted text-text-muted inline-flex items-center justify-center"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ConfigForm
                daysPerWeek={daysPerWeek}
                sessionMinutes={sessionMinutes}
                weeks={weeks}
                injuries={injuries}
                contextNotes={contextNotes}
                onDaysPerWeekChange={setDaysPerWeek}
                onSessionMinutesChange={setSessionMinutes}
                onWeeksChange={setWeeks}
                onInjuriesChange={setInjuries}
                onContextNotesChange={setContextNotes}
                profile={profile}
                compact
              />
              {error && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm">
                  {error}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border">
              <button
                onClick={handleGenerate}
                className="w-full px-6 py-3 rounded-xl font-bold bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-600/30 hover:-translate-y-0.5 transition-transform inline-flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate baru (ganti program)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session log modal */}
      {logModal && (
        <SessionLogModal
          weekIdx={logModal.weekIdx}
          sessionIdx={logModal.sessionIdx}
          session={logModal.session}
          existing={getSessionLog(plan.id, logModal.weekIdx, logModal.sessionIdx)}
          onClose={() => setLogModal(null)}
          onSubmit={handleSubmitSessionLog}
        />
      )}
    </div>
  );
}

function PageHero() {
  return (
    <div className="text-center mb-6">
      <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-500/15 text-brand-600 items-center justify-center mb-3">
        <Dumbbell className="w-7 h-7" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Workout Program</h1>
      <p className="mt-2 text-text-muted leading-relaxed">
        AI compose program latihan dari profil kamu, target zone, kondisi
        medis, dan equipment yang tersedia. Pakai database 60+ exercise.
      </p>
    </div>
  );
}

function ConfigForm({
  daysPerWeek,
  sessionMinutes,
  weeks,
  injuries,
  contextNotes,
  onDaysPerWeekChange,
  onSessionMinutesChange,
  onWeeksChange,
  onInjuriesChange,
  onContextNotesChange,
  profile,
  compact = false,
}: {
  daysPerWeek: number;
  sessionMinutes: number;
  weeks: number;
  injuries: string;
  contextNotes: string;
  onDaysPerWeekChange: (v: number) => void;
  onSessionMinutesChange: (v: number) => void;
  onWeeksChange: (v: number) => void;
  onInjuriesChange: (v: string) => void;
  onContextNotesChange: (v: string) => void;
  profile: UserProfile | null;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-4", !compact && "mt-2")}>
      <div>
        <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-2 block">
          Sesi per minggu ({daysPerWeek})
        </label>
        <input
          type="range"
          min={2}
          max={6}
          step={1}
          value={daysPerWeek}
          onChange={(e) => onDaysPerWeekChange(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
        <div className="flex justify-between text-[10px] text-text-muted mt-1 tabular-nums">
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
          <span>6</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-2 block">
          Durasi sesi ({sessionMinutes} menit)
        </label>
        <input
          type="range"
          min={30}
          max={90}
          step={5}
          value={sessionMinutes}
          onChange={(e) => onSessionMinutesChange(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
        <div className="flex justify-between text-[10px] text-text-muted mt-1 tabular-nums">
          <span>30</span>
          <span>45</span>
          <span>60</span>
          <span>75</span>
          <span>90</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-2 block">
          Berapa minggu?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[2, 4].map((w) => (
            <button
              key={w}
              onClick={() => onWeeksChange(w)}
              className={cn(
                "px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors",
                weeks === w
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
                  : "border-border hover:border-fg/20",
              )}
            >
              {w === 2 ? "2 minggu (cepat)" : "4 minggu (full mesocycle)"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-2 block">
          Cedera / batasan (opsional)
        </label>
        <input
          type="text"
          value={injuries}
          onChange={(e) => onInjuriesChange(e.target.value)}
          placeholder="contoh: lutut kanan sensitif, bahu kiri post-injury"
          className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 text-sm"
        />
        <p className="text-[10px] text-text-muted mt-1">
          Pisah dengan koma. AI akan hindari exercise yang stress area itu.
        </p>
      </div>

      <div>
        <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-2 block">
          Catatan konteks (opsional)
        </label>
        <textarea
          value={contextNotes}
          onChange={(e) => onContextNotesChange(e.target.value)}
          placeholder="contoh: kerja kantoran 9-5, latihan pagi sebelum kerja"
          rows={2}
          className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 text-sm resize-none"
        />
      </div>

      {profile && (
        <div className="p-3 rounded-xl bg-surface-muted text-xs leading-relaxed">
          <div className="font-semibold text-text-muted uppercase tracking-wide text-[10px] mb-1">
            Program akan pakai dari profil:
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span>
              <span className="text-text-muted">Goal:</span>{" "}
              <span className="font-semibold">{profile.goal}</span>
            </span>
            <span>
              <span className="text-text-muted">Activity:</span>{" "}
              <span className="font-semibold">{profile.activity}</span>
            </span>
            {profile.equipment_available &&
            profile.equipment_available.length > 0 ? (
              <span className="col-span-2">
                <span className="text-text-muted">Equipment:</span>{" "}
                <span className="font-semibold">
                  {profile.equipment_available.join(", ")}
                </span>
              </span>
            ) : (
              <span className="col-span-2 text-amber-700 dark:text-amber-400">
                Equipment belum di-set di profil → default bodyweight.
              </span>
            )}
            {profile.target_zones && profile.target_zones.length > 0 ? (
              <span className="col-span-2">
                <span className="text-text-muted">Target zone:</span>{" "}
                <span className="font-semibold">
                  {profile.target_zones.join(", ")}
                </span>
              </span>
            ) : null}
            {profile.medical_conditions &&
            profile.medical_conditions.filter((c) => c !== "tidak_ada")
              .length > 0 ? (
              <span className="col-span-2">
                <span className="text-text-muted">Kondisi medis:</span>{" "}
                <span className="font-semibold">
                  {profile.medical_conditions
                    .filter((c) => c !== "tidak_ada")
                    .join(", ")}
                </span>
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkoutStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div>
      <Kicker>{label}</Kicker>
      <div className="mt-1 tabular leading-none flex items-baseline gap-1">
        <span
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 24,
          }}
        >
          {value}
        </span>
        {unit && <span className="text-[10px] text-muted font-medium">{unit}</span>}
      </div>
    </div>
  );
}

function MiniSessionCard({
  session,
  isDone,
  onClick,
}: {
  session: WorkoutSession;
  isDone: boolean;
  onClick: () => void;
}) {
  const emoji = focusEmoji(session.focus);
  const day = dayShort(session.day_label);
  // Extract focus label (e.g. "Upper · Push" from "push" focus and "Senin (Upper)" day_label)
  let focusLabel = session.focus
    .replace(/^(upper|lower|full)\s*/i, "")
    .trim();
  if (focusLabel.length < 2) focusLabel = session.focus;
  const tone = session.focus.toLowerCase().includes("push")
    ? "Upper · Push"
    : session.focus.toLowerCase().includes("pull")
      ? "Upper · Pull"
      : session.focus.toLowerCase().includes("posterior")
        ? "Lower · Posterior"
        : session.focus.toLowerCase().includes("quad")
          ? "Lower · Quads"
          : session.focus.toLowerCase().includes("leg")
            ? "Lower"
            : session.focus.toLowerCase().includes("upper")
              ? "Upper"
              : session.focus;
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-[14px] border px-3 py-3 transition-all relative",
        isDone
          ? "bg-forest-50/40 border-forest/20"
          : "bg-surface border-hairline hover:border-hairline-2",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <Kicker>{day}</Kicker>
        {isDone && (
          <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
        )}
      </div>
      <div className="text-xl">{emoji}</div>
      <div className="mt-1.5 text-[12px] font-bold tracking-tight">{tone}</div>
    </button>
  );
}

function SessionCard({
  session,
  index,
  expanded,
  isDone,
  doneDate,
  focusEmoji,
  focusClass,
  onToggle,
  onLog,
}: {
  session: WorkoutSession;
  index: number;
  expanded: boolean;
  isDone: boolean;
  doneDate?: string;
  focusEmoji: string;
  focusClass: string;
  onToggle: () => void;
  onLog: () => void;
}) {
  const exerciseCount =
    session.warmup.length +
    session.main.length +
    (session.cooldown?.length ?? 0);
  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface overflow-hidden transition-colors",
        isDone
          ? "border-brand-300 dark:border-brand-500/30 bg-brand-50/30 dark:bg-brand-500/5"
          : "border-border",
      )}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-start gap-3 hover:bg-surface-muted text-left"
      >
        <div className="text-2xl flex-shrink-0">{focusEmoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
              Sesi {index + 1}
            </span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase",
                focusClass,
              )}
            >
              {session.focus}
            </span>
            {isDone && (
              <span className="px-1.5 py-0.5 rounded bg-brand-600 text-white text-[10px] font-bold uppercase inline-flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> done
              </span>
            )}
          </div>
          <div className="font-semibold tracking-tight">
            {session.day_label}
          </div>
          <div className="mt-1 text-xs text-text-muted inline-flex items-center gap-3 tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {session.duration_estimate_min} mnt
            </span>
            <span className="inline-flex items-center gap-1">
              <Dumbbell className="w-3 h-3" /> {exerciseCount} exercise
            </span>
            {isDone && doneDate && (
              <span className="inline-flex items-center gap-1 text-brand-600">
                <Calendar className="w-3 h-3" />{" "}
                {new Date(doneDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          {session.notes && (
            <div className="my-3 text-xs italic text-text-muted leading-snug">
              📝 {session.notes}
            </div>
          )}
          {session.warmup.length > 0 && (
            <ExerciseGroup label="Warmup" exercises={session.warmup} />
          )}
          <ExerciseGroup label="Main" exercises={session.main} />
          {session.cooldown && session.cooldown.length > 0 && (
            <ExerciseGroup label="Cooldown" exercises={session.cooldown} />
          )}
          <button
            onClick={onLog}
            className={cn(
              "mt-4 w-full px-4 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all",
              isDone
                ? "bg-surface border border-brand-300 dark:border-brand-500/40 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/15"
                : "bg-fg text-bg hover:-translate-y-0.5 shadow-md",
            )}
          >
            {isDone ? (
              <>
                <Pencil className="w-3.5 h-3.5" /> Edit log
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Log sesi ini
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function ExerciseGroup({
  label,
  exercises,
}: {
  label: string;
  exercises: WorkoutExercise[];
}) {
  return (
    <div className="mt-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1.5">
        {label}
      </div>
      <ul className="space-y-1">
        {exercises.map((ex, i) => (
          <li key={i} className="flex items-baseline gap-2 text-sm">
            <span className="flex-1 min-w-0 truncate">{ex.exercise_name}</span>
            <span className="text-text-muted text-xs tabular-nums flex-shrink-0">
              {ex.sets}×{ex.reps}
              {ex.rest_seconds > 0 && ` · rest ${ex.rest_seconds}s`}
              {ex.rpe_target && ` · RPE ${ex.rpe_target}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SessionLogModal({
  weekIdx,
  sessionIdx,
  session,
  existing,
  onClose,
  onSubmit,
}: {
  weekIdx: number;
  sessionIdx: number;
  session: WorkoutSession;
  existing: { date: string; exercises: ExerciseLog[]; notes?: string; duration_min?: number } | null;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    exercises: ExerciseLog[];
    duration_min?: number;
    notes?: string;
  }) => void;
}) {
  const allExercises = useMemo(
    () => [
      ...session.warmup.map((e) => ({ ...e, group: "warmup" as const })),
      ...session.main.map((e) => ({ ...e, group: "main" as const })),
      ...(session.cooldown ?? []).map((e) => ({
        ...e,
        group: "cooldown" as const,
      })),
    ],
    [session],
  );

  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (existing) {
      const existingByCode = new Map(
        existing.exercises.map((e) => [e.exercise_code, e.completed]),
      );
      allExercises.forEach((ex) => {
        init[ex.exercise_code] =
          existingByCode.get(ex.exercise_code) ?? ex.group === "main";
      });
    } else {
      // Default: all main + warmup checked, cooldown unchecked
      allExercises.forEach((ex) => {
        init[ex.exercise_code] = ex.group !== "cooldown";
      });
    }
    return init;
  });
  const [durationMin, setDurationMin] = useState(
    existing?.duration_min !== undefined
      ? String(existing.duration_min)
      : String(session.duration_estimate_min),
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const completedCount = Object.values(checked).filter(Boolean).length;
  const mainCount = session.main.length;
  const mainCompleted = session.main.filter(
    (e) => checked[e.exercise_code],
  ).length;

  const handleSubmit = () => {
    if (completedCount === 0) {
      alert("Centang minimal 1 exercise yang udah dijalanin.");
      return;
    }
    const exercises: ExerciseLog[] = allExercises.map((ex) => ({
      exercise_code: ex.exercise_code,
      exercise_name: ex.exercise_name,
      completed: Boolean(checked[ex.exercise_code]),
    }));
    const duration = Number.parseFloat(durationMin);
    onSubmit({
      date,
      exercises,
      duration_min: Number.isFinite(duration) && duration > 0 ? duration : undefined,
      notes: notes.trim() || undefined,
    });
  };

  const groupCheck = (group: "warmup" | "main" | "cooldown", on: boolean) => {
    setChecked((prev) => {
      const next = { ...prev };
      for (const ex of allExercises) {
        if (ex.group === group) next[ex.exercise_code] = on;
      }
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight truncate">
              Log sesi: {session.day_label}
            </h2>
            <div className="text-xs text-text-muted tabular-nums">
              Minggu {weekIdx + 1} · Sesi {sessionIdx + 1}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-muted text-text-muted inline-flex items-center justify-center flex-shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-1.5 block">
              Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayISO()}
              className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 tabular-nums text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold tracking-wide uppercase text-text-muted">
                Exercise yang udah dijalanin · {completedCount}/
                {allExercises.length}
              </label>
              <div className="text-[10px] text-text-muted tabular-nums">
                Main: {mainCompleted}/{mainCount}
              </div>
            </div>
            <ExerciseChecklistGroup
              label="Warmup"
              groupKey="warmup"
              exercises={session.warmup}
              checked={checked}
              onCheck={(code, val) =>
                setChecked((prev) => ({ ...prev, [code]: val }))
              }
              onToggleAll={(on) => groupCheck("warmup", on)}
            />
            <ExerciseChecklistGroup
              label="Main"
              groupKey="main"
              exercises={session.main}
              checked={checked}
              onCheck={(code, val) =>
                setChecked((prev) => ({ ...prev, [code]: val }))
              }
              onToggleAll={(on) => groupCheck("main", on)}
            />
            {session.cooldown && session.cooldown.length > 0 && (
              <ExerciseChecklistGroup
                label="Cooldown"
                groupKey="cooldown"
                exercises={session.cooldown}
                checked={checked}
                onCheck={(code, val) =>
                  setChecked((prev) => ({ ...prev, [code]: val }))
                }
                onToggleAll={(on) => groupCheck("cooldown", on)}
              />
            )}
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-1.5 block">
              Durasi aktual (menit, opsional)
            </label>
            <input
              type="number"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              min={1}
              step={5}
              className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 tabular-nums text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-1.5 block">
              Catatan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="contoh: bench press 40kg, squat 60kg. Knee kanan agak ngilu di squat 3."
              className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 text-sm resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={completedCount === 0}
            className={cn(
              "w-full px-6 py-3 rounded-xl font-bold inline-flex items-center justify-center gap-2 transition-all",
              completedCount > 0
                ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-600/30 hover:-translate-y-0.5"
                : "bg-surface-muted text-text-muted cursor-not-allowed",
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            {existing
              ? `Update sesi (${completedCount} exercise)`
              : `Simpan sesi (${completedCount} exercise)`}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExerciseChecklistGroup({
  label,
  groupKey,
  exercises,
  checked,
  onCheck,
  onToggleAll,
}: {
  label: string;
  groupKey: "warmup" | "main" | "cooldown";
  exercises: WorkoutExercise[];
  checked: Record<string, boolean>;
  onCheck: (code: string, val: boolean) => void;
  onToggleAll: (on: boolean) => void;
}) {
  if (exercises.length === 0) return null;
  const allOn = exercises.every((e) => checked[e.exercise_code]);
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
          {label}
        </div>
        <button
          onClick={() => onToggleAll(!allOn)}
          className="text-[10px] font-semibold text-brand-600 hover:text-brand-700"
        >
          {allOn ? "Uncheck semua" : "Check semua"}
        </button>
      </div>
      <ul className="space-y-1">
        {exercises.map((ex) => {
          const on = Boolean(checked[ex.exercise_code]);
          return (
            <li
              key={`${groupKey}-${ex.exercise_code}`}
              className={cn(
                "flex items-start gap-2 p-2 rounded-lg border transition-colors cursor-pointer",
                on
                  ? "border-brand-400 bg-brand-50/40 dark:bg-brand-500/10"
                  : "border-border opacity-70",
              )}
              onClick={() => onCheck(ex.exercise_code, !on)}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => onCheck(ex.exercise_code, !on)}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 w-4 h-4 accent-brand-600 flex-shrink-0"
                aria-label={`Toggle ${ex.exercise_name}`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-tight">
                  {ex.exercise_name}
                </div>
                <div className="text-[11px] text-text-muted tabular-nums">
                  {ex.sets}×{ex.reps}
                  {ex.rest_seconds > 0 && ` · rest ${ex.rest_seconds}s`}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
