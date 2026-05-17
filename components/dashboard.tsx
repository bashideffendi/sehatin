"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Plus,
  Camera,
  Search,
  Scan,
  Scale,
  RefreshCw,
  Dumbbell,
} from "lucide-react";
import { loadProfile, type UserProfile } from "@/lib/profile";
import { calculateTargets } from "@/src/nutrition/tdee";
import {
  getDailySummary,
  todayISO,
  type DailySummary,
} from "@/lib/food-log";
import {
  getActiveMealPlan,
  getPlanDayForDate,
  type StoredMealPlan,
  type DayPlan,
} from "@/lib/meal-plan";
import {
  getActiveWorkoutPlan,
  findNextUnloggedSession,
  SPLIT_LABEL,
  type StoredWorkoutPlan,
} from "@/lib/workout";
import { countSessionsForPlan } from "@/lib/workout-log";
import {
  getWeightHistory,
  type WeightLogEntry,
} from "@/lib/weight-log";
import { getWeekInsights, getStreak } from "@/lib/insights";
import { Pill, Btn, Card, Kicker, Donut, BarChart, Sparkline } from "@/components/ui";
import { fmtKcal, rupiah } from "@/lib/format";

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

function formatDateID(date: Date): string {
  return date
    .toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .toUpperCase();
}

function dayLabel3(weekday: number): string {
  return ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"][weekday] ?? "";
}

interface Props {
  profile: UserProfile;
}

export function Dashboard({ profile }: Props) {
  const today = todayISO();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [activePlan, setActivePlan] = useState<StoredMealPlan | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<StoredWorkoutPlan | null>(
    null,
  );
  const [weightHistory, setWeightHistory] = useState<WeightLogEntry[]>([]);

  useEffect(() => {
    setSummary(getDailySummary(today));
    setActivePlan(getActiveMealPlan());
    setActiveWorkout(getActiveWorkoutPlan());
    setWeightHistory(getWeightHistory());
  }, [today]);

  const targets = useMemo(() => {
    if (
      !profile.age ||
      !profile.sex ||
      !profile.weight_kg ||
      !profile.height_cm ||
      !profile.activity ||
      !profile.goal
    )
      return null;
    try {
      return calculateTargets({
        age: profile.age,
        sex: profile.sex,
        weight_kg: profile.weight_kg,
        height_cm: profile.height_cm,
        activity: profile.activity,
        goal: profile.goal,
      });
    } catch {
      return null;
    }
  }, [profile]);

  const planDay: DayPlan | null = useMemo(
    () => (activePlan ? getPlanDayForDate(today, activePlan) : null),
    [activePlan, today],
  );

  const nextSession = useMemo(
    () => (activeWorkout ? findNextUnloggedSession(activeWorkout) : null),
    [activeWorkout],
  );

  const workoutProgress = useMemo(() => {
    if (!activeWorkout) return null;
    const total = activeWorkout.program.weeks.reduce(
      (s, w) => s + w.sessions.length,
      0,
    );
    return { done: countSessionsForPlan(activeWorkout.id), total };
  }, [activeWorkout]);

  const weekInsights = useMemo(() => {
    if (!summary) return null;
    return getWeekInsights(today, targets?.target_kcal ?? null);
  }, [summary, targets, today]);

  const streak = useMemo(() => {
    void summary;
    return getStreak();
  }, [summary]);

  if (!summary) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 text-muted">Loading...</div>
    );
  }

  const kcalTarget = targets?.target_kcal ?? null;
  const kcalToday = summary.total_kcal;
  const remaining = kcalTarget ? Math.max(0, kcalTarget - kcalToday) : null;
  const todayDate = new Date();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
      {/* ============ Header ============ */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6 sm:mb-8">
        <div>
          <Kicker>{formatDateID(todayDate)}</Kicker>
          <h1 className="mt-2 text-3xl sm:text-[44px] font-extrabold tracking-tight leading-tight">
            {timeOfDayGreeting()},{" "}
            <span
              className="font-normal italic text-forest"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              {profile.name ?? "kamu"}
            </span>
            .
          </h1>
          {remaining !== null && (
            <p className="mt-1 text-[13.5px] text-muted">
              Sisa{" "}
              <span className="tabular font-semibold text-ink">
                {fmtKcal(remaining)}
              </span>{" "}
              kcal · cukup buat 2-3 meal lagi
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <Pill tone="clay" size="md" icon={<Flame className="w-3 h-3" />}>
              <span className="tabular">{streak}</span> hari streak
            </Pill>
          )}
          <Btn
            variant="primary"
            size="sm"
            icon={<Plus />}
          >
            <Link href="/log" className="contents">
              Catat makan
            </Link>
          </Btn>
        </div>
      </div>

      {/* ============ Hero row: Kalori + IF Timer ============ */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] mb-4">
        {/* Kalori donut card — forest */}
        <Card surface="forest" radius="xl" shadow="paper-2" className="overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <Donut
              value={kcalToday}
              target={kcalTarget ?? 2000}
              size={180}
              stroke={16}
              color="var(--color-paper)"
              track="rgba(255,255,255,0.15)"
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-paper/70">
                Kalori
              </div>
              <div
                className="tabular mt-1 text-paper"
                style={{ fontFamily: "var(--font-serif)", fontSize: 40, lineHeight: 1 }}
              >
                {fmtKcal(kcalToday)}
              </div>
              {kcalTarget && (
                <div className="text-[10.5px] text-paper/75 mt-1 tabular">
                  / {fmtKcal(kcalTarget)} kcal
                </div>
              )}
            </Donut>
            <div className="flex-1 w-full">
              <MacroBar
                label="Protein"
                value={summary.total_protein_g}
                target={targets?.protein_g ?? 0}
              />
              <MacroBar
                label="Lemak"
                value={summary.total_fat_g}
                target={targets?.fat_g ?? 0}
              />
              <MacroBar
                label="Karbo"
                value={summary.total_carb_g}
                target={targets?.carb_g ?? 0}
              />
              <div className="mt-5 flex items-center gap-2 flex-wrap">
                <Btn variant="surface" size="xs">
                  <Link href="/log" className="contents">
                    Tambah snack
                  </Link>
                </Btn>
                <Btn
                  variant="ghost"
                  size="xs"
                  icon={<RefreshCw className="w-3 h-3" />}
                  className="bg-transparent text-paper/85 border-paper/20 hover:bg-paper/10 hover:border-paper/30"
                >
                  <Link href="/plan" className="contents">
                    Re-roll plan
                  </Link>
                </Btn>
              </div>
            </div>
          </div>
        </Card>

        {/* IF Timer card placeholder */}
        <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6 relative overflow-hidden paper-grain">
          <div className="flex items-start justify-between mb-3">
            <Kicker>IF Timer · 16:8</Kicker>
            <Pill tone="sun" size="sm">
              Coming soon
            </Pill>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-[88px] h-[88px] rounded-full border-2 border-clay/30 flex items-center justify-center text-center flex-shrink-0">
              <div>
                <div className="text-[8px] uppercase tracking-wider text-muted">
                  Eating
                </div>
                <div
                  className="tabular text-clay"
                  style={{ fontFamily: "var(--font-serif)", fontSize: 22, lineHeight: 1 }}
                >
                  —
                </div>
              </div>
            </div>
            <div className="text-[13px] text-muted leading-relaxed">
              Set IF window di <Link href="/tools/if" className="font-semibold text-clay underline">IF Timer</Link> buat tracking fasting + metabolic phases.
            </div>
          </div>
        </Card>
      </div>

      {/* ============ Plan Today + Workout row ============ */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] mb-4">
        {/* Meal plan today */}
        <PlanTodayCard planDay={planDay} activePlan={activePlan} />
        {/* Workout next */}
        <WorkoutNextCard
          activeWorkout={activeWorkout}
          nextSession={nextSession}
          progress={workoutProgress}
        />
      </div>

      {/* ============ Weekly chart + Weight ============ */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] mb-4">
        <WeeklyCard insights={weekInsights} kcalTarget={kcalTarget} today={today} />
        <WeightCard history={weightHistory} goal={profile.goal ?? null} />
      </div>

      {/* ============ Mobile quick actions ============ */}
      <div className="grid grid-cols-4 gap-2 mb-4 lg:hidden">
        <QuickAction
          href="/log"
          icon={<Camera className="w-4 h-4" />}
          label="Foto"
        />
        <QuickAction
          href="/log"
          icon={<Search className="w-4 h-4" />}
          label="Cari"
        />
        <QuickAction
          href="/log"
          icon={<Scan className="w-4 h-4" />}
          label="Scan"
        />
        <QuickAction
          href="/log"
          icon={<Scale className="w-4 h-4" />}
          label="Berat"
        />
      </div>
    </div>
  );
}

function MacroBar({
  label,
  value,
  target,
}: {
  label: string;
  value: number;
  target: number;
}) {
  const pct = target > 0 ? Math.min(110, (value / target) * 100) : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between text-[11.5px] text-paper/85">
        <span className="font-semibold">{label}</span>
        <span className="tabular">
          <span className="text-paper">{Math.round(value)}g</span>
          <span className="text-paper/55"> / {Math.round(target)}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 bg-paper/15 rounded-full overflow-hidden">
        <div
          className="h-full bg-paper rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PlanTodayCard({
  planDay,
  activePlan,
}: {
  planDay: DayPlan | null;
  activePlan: StoredMealPlan | null;
}) {
  if (!planDay || !activePlan) {
    return (
      <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6 flex flex-col">
        <Kicker>Meal plan hari ini</Kicker>
        <p className="mt-3 text-[13.5px] text-muted flex-1">
          Belum ada plan aktif. Generate dari profil kamu dalam 60 detik.
        </p>
        <div className="mt-4">
          <Btn variant="primary" size="sm">
            <Link href="/plan" className="contents">
              Generate plan
            </Link>
          </Btn>
        </div>
      </Card>
    );
  }
  const dietLabel = activePlan.diet_method ?? "Standard";
  const cost = planDay.est_cost_idr ?? null;
  return (
    <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Kicker>Meal plan hari ini</Kicker>
          <div className="mt-1 font-extrabold text-lg tracking-tight">
            {dietLabel.replace(/_/g, " ")}
            {cost ? (
              <span className="text-muted font-medium tabular">
                {" "}
                · {rupiah(cost)}
              </span>
            ) : null}
          </div>
        </div>
        <Btn
          variant="ghost"
          size="xs"
          icon={<RefreshCw className="w-3 h-3" />}
        >
          <Link href="/plan" className="contents">
            Re-roll
          </Link>
        </Btn>
      </div>
      <ul className="space-y-2.5">
        {planDay.meals.slice(0, 5).map((m, i) => (
          <li
            key={i}
            className="flex items-center gap-3 py-1.5 border-t border-hairline first:border-t-0"
          >
            <span className="text-xl flex-shrink-0">🍲</span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold capitalize truncate">
                {m.slot}
              </div>
              <div className="text-[11px] text-muted truncate">
                {m.items
                  .slice(0, 3)
                  .map((it) => it.food_name)
                  .join(" · ")}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[12.5px] font-semibold tabular">
                {fmtKcal(m.total_kcal)} kcal
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function WorkoutNextCard({
  activeWorkout,
  nextSession,
  progress,
}: {
  activeWorkout: StoredWorkoutPlan | null;
  nextSession: ReturnType<typeof findNextUnloggedSession>;
  progress: { done: number; total: number } | null;
}) {
  if (!activeWorkout || !nextSession) {
    return (
      <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6">
        <Kicker>Workout</Kicker>
        <p className="mt-3 text-[13.5px] text-muted">
          Belum ada program aktif.
        </p>
        <div className="mt-4">
          <Btn variant="primary" size="sm" icon={<Dumbbell className="w-3.5 h-3.5" />}>
            <Link href="/workout" className="contents">
              Generate program
            </Link>
          </Btn>
        </div>
      </Card>
    );
  }
  return (
    <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6">
      <div className="flex items-start justify-between mb-2">
        <Kicker>Workout · sesi berikutnya</Kicker>
        <Pill tone="default" size="sm">
          W{nextSession.weekIdx + 1}
        </Pill>
      </div>
      <h3 className="text-xl font-extrabold tracking-tight leading-tight">
        {nextSession.session.day_label.split("·")[0]?.trim() ?? nextSession.session.day_label}{" "}
        <span
          className="font-normal italic text-forest"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          · {nextSession.session.focus}
        </span>
      </h3>
      <div className="mt-1 text-[12px] text-muted tabular">
        {nextSession.session.duration_estimate_min} mnt ·{" "}
        {nextSession.session.main.length} gerakan ·{" "}
        {SPLIT_LABEL[activeWorkout.split] ?? activeWorkout.split}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {nextSession.session.main.slice(0, 5).map((ex, i) => (
          <Pill key={i} tone="default" size="sm">
            {ex.exercise_name}
          </Pill>
        ))}
      </div>
      <div className="mt-4">
        <Btn variant="ink" size="md" fullWidth iconRight={<Dumbbell className="w-4 h-4" />}>
          <Link href="/workout" className="contents">
            Mulai sesi
          </Link>
        </Btn>
      </div>
      {progress && (
        <div className="mt-2 text-[11px] text-muted tabular">
          Progress: {progress.done}/{progress.total} sesi
        </div>
      )}
    </Card>
  );
}

function WeeklyCard({
  insights,
  kcalTarget,
  today,
}: {
  insights: ReturnType<typeof getWeekInsights> | null;
  kcalTarget: number | null;
  today: string;
}) {
  if (!insights || insights.total_entries === 0) {
    return (
      <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6">
        <Kicker>7 hari</Kicker>
        <p className="mt-3 text-[13.5px] text-muted">
          Catat 2-3 hari dulu buat lihat tren.
        </p>
      </Card>
    );
  }
  const barData = insights.days.map((d) => {
    const isToday = d.date === today;
    const isEmpty = d.entry_count === 0;
    const isOver = kcalTarget ? d.total_kcal > kcalTarget * 1.1 : false;
    const isUnder = !isEmpty && kcalTarget ? d.total_kcal < kcalTarget * 0.7 : isEmpty;
    return {
      label: dayLabel3(new Date(d.date).getDay()),
      value: d.total_kcal,
      isToday,
      isOver,
      isUnder,
    };
  });
  return (
    <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Kicker>7 hari · avg</Kicker>
          <div
            className="mt-1 tabular"
            style={{ fontFamily: "var(--font-serif)", fontSize: 32, lineHeight: 1 }}
          >
            {fmtKcal(insights.avg_kcal)}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Pill tone="forest" size="sm">
            <span className="tabular">{insights.on_target_count}</span> hit
          </Pill>
          {insights.under_target_count > 0 && (
            <Pill tone="default" size="sm">
              <span className="tabular">{insights.under_target_count}</span> under
            </Pill>
          )}
          {insights.over_target_count > 0 && (
            <Pill tone="clay" size="sm">
              <span className="tabular">{insights.over_target_count}</span> over
            </Pill>
          )}
        </div>
      </div>
      <BarChart
        data={barData}
        reference={kcalTarget ?? undefined}
        height={90}
      />
    </Card>
  );
}

function WeightCard({
  history,
  goal,
}: {
  history: WeightLogEntry[];
  goal: string | null;
}) {
  if (history.length === 0) {
    return (
      <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6">
        <Kicker>Berat · 30 hari</Kicker>
        <p className="mt-3 text-[13.5px] text-muted">Belum ada catatan.</p>
        <div className="mt-3">
          <Btn variant="ghost" size="xs" icon={<Scale className="w-3 h-3" />}>
            <Link href="/log" className="contents">
              Catat berat
            </Link>
          </Btn>
        </div>
      </Card>
    );
  }
  const slice = history.slice(-30);
  const first = slice[0]?.weight_kg ?? 0;
  const last = slice[slice.length - 1]?.weight_kg ?? 0;
  const delta = Math.round((last - first) * 10) / 10;
  const goodDown = goal === "fat_loss" || goal === "fat_loss_aggressive";
  const goodUp = goal === "muscle_gain" || goal === "slow_gain";
  let deltaTone: "forest" | "rose" | "default" = "default";
  if (delta !== 0) {
    const isUp = delta > 0;
    if ((goodDown && !isUp) || (goodUp && isUp)) deltaTone = "forest";
    else deltaTone = "rose";
  }
  return (
    <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <Kicker>Berat · 30 hari</Kicker>
          <div
            className="mt-1 tabular"
            style={{ fontFamily: "var(--font-serif)", fontSize: 32, lineHeight: 1 }}
          >
            {last.toFixed(1).replace(".", ",")}
          </div>
        </div>
        <Pill tone={deltaTone} size="sm">
          {delta > 0 ? "+" : ""}
          <span className="tabular">{delta}</span> kg
        </Pill>
      </div>
      <div className="h-[60px] mt-3">
        <Sparkline
          values={slice.map((e) => e.weight_kg)}
          color={
            deltaTone === "forest"
              ? "var(--color-forest)"
              : deltaTone === "rose"
                ? "var(--color-rose)"
                : "var(--color-sky)"
          }
        />
      </div>
    </Card>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-[14px] bg-surface border border-hairline hover:border-forest-300 hover:bg-surface-2 transition-colors"
    >
      <span className="text-forest">{icon}</span>
      <span className="text-[11px] font-semibold">{label}</span>
    </Link>
  );
}
