"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Sparkles,
  Dumbbell,
  Scale,
  Camera,
  Plus,
  ChevronRight,
  ClipboardList,
  Salad,
  Target,
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
  TRAINING_GOAL_LABEL,
  focusStyle,
  type StoredWorkoutPlan,
} from "@/lib/workout";
import { countSessionsForPlan } from "@/lib/workout-log";
import {
  getWeightHistory,
  type WeightLogEntry,
} from "@/lib/weight-log";
import { getWeekInsights, getStreak } from "@/lib/insights";
import { WeeklyChart } from "@/components/weekly-chart";
import { WeightChart } from "@/components/weight-chart";
import { cn, fmtNum } from "@/lib/utils";

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
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
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setSummary(getDailySummary(today));
    setActivePlan(getActiveMealPlan());
    setActiveWorkout(getActiveWorkoutPlan());
    setWeightHistory(getWeightHistory());
  }, [today, tick]);

  // touch tick so React tracks deps when log changes externally
  void tick;

  const targets = useMemo(() => {
    if (
      !profile.age ||
      !profile.sex ||
      !profile.weight_kg ||
      !profile.height_cm ||
      !profile.activity ||
      !profile.goal
    ) {
      return null;
    }
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
    [activeWorkout, tick],
  );

  const workoutProgress = useMemo(() => {
    if (!activeWorkout) return null;
    const total = activeWorkout.program.weeks.reduce(
      (s, w) => s + w.sessions.length,
      0,
    );
    const done = countSessionsForPlan(activeWorkout.id);
    void tick;
    return { done, total };
  }, [activeWorkout, tick]);

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
      <div className="max-w-5xl mx-auto px-4 py-8 text-text-muted">
        Loading...
      </div>
    );
  }

  const kcalTarget = targets?.target_kcal ?? null;
  const pct = kcalTarget
    ? Math.min(120, (summary.total_kcal / kcalTarget) * 100)
    : null;
  const remaining = kcalTarget
    ? Math.max(0, kcalTarget - summary.total_kcal)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 pb-16">
      {/* Greeting */}
      <div className="mb-6 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {timeOfDayGreeting()} 👋
          </h1>
          <p className="mt-0.5 text-sm text-text-muted">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        {streak > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
            <Flame className="w-4 h-4" fill="currentColor" />
            <span className="font-bold tabular-nums">{streak}</span>
            <span className="text-xs font-semibold">
              hari{streak > 1 ? " berturut" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Today kcal hero */}
      <div className="mb-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-brand-100 text-sm font-medium">
              <Flame className="w-4 h-4" />
              Kalori hari ini
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold tabular-nums">
                {fmtNum(summary.total_kcal)}
              </span>
              {kcalTarget && (
                <span className="text-brand-100 text-sm">
                  / {fmtNum(kcalTarget)} kcal
                </span>
              )}
            </div>
            {kcalTarget && remaining !== null && (
              <div className="mt-1 text-xs text-brand-100">
                {pct! >= 110
                  ? `Lewat target ${(pct! - 100).toFixed(0)}%`
                  : `Sisa ${fmtNum(remaining)} kcal`}
              </div>
            )}
          </div>
          <Link
            href="/log"
            className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-sm font-semibold transition-colors"
          >
            Lihat
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {kcalTarget && pct !== null && (
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <div className="text-brand-100">Protein</div>
            <div className="font-bold tabular-nums text-base mt-0.5">
              {summary.total_protein_g}
              <span className="text-xs font-normal opacity-80 ml-0.5">g</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-brand-100">Lemak</div>
            <div className="font-bold tabular-nums text-base mt-0.5">
              {summary.total_fat_g}
              <span className="text-xs font-normal opacity-80 ml-0.5">g</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-brand-100">Karbo</div>
            <div className="font-bold tabular-nums text-base mt-0.5">
              {summary.total_carb_g}
              <span className="text-xs font-normal opacity-80 ml-0.5">g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan + Workout (2-col on desktop) */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {/* Meal plan card */}
        {planDay ? (
          <Link
            href="/plan"
            className="group p-4 rounded-2xl bg-surface border border-border hover:border-brand-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center">
                <Salad className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
                  Plan makan hari ini
                </div>
                <div className="text-xs text-text-muted tabular-nums">
                  {planDay.meals.length} meal · {fmtNum(planDay.total_kcal)}{" "}
                  kcal
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-brand-600 transition-colors" />
            </div>
            <ul className="space-y-0.5 text-xs">
              {planDay.meals.slice(0, 4).map((m, i) => (
                <li
                  key={i}
                  className="flex items-baseline justify-between gap-2"
                >
                  <span className="capitalize text-fg/80 truncate">
                    {m.slot}
                  </span>
                  <span className="text-text-muted tabular-nums flex-shrink-0">
                    {fmtNum(m.total_kcal)} kcal
                  </span>
                </li>
              ))}
            </ul>
          </Link>
        ) : (
          <Link
            href="/plan"
            className="group p-4 rounded-2xl border-2 border-dashed border-border hover:border-brand-300 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-brand-50/50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center">
                <Salad className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold">Meal plan</div>
                <div className="text-xs text-text-muted">
                  Belum ada plan aktif
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:text-brand-700">
              <Sparkles className="w-3 h-3" /> Generate plan AI
              <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
        )}

        {/* Workout card */}
        {activeWorkout && workoutProgress ? (
          <Link
            href="/workout"
            className="group p-4 rounded-2xl bg-surface border border-border hover:border-brand-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/15 text-brand-600 flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
                  Program latihan
                </div>
                <div className="text-xs text-text-muted truncate">
                  {SPLIT_LABEL[activeWorkout.split] ?? activeWorkout.split} ·{" "}
                  {TRAINING_GOAL_LABEL[activeWorkout.goal] ?? activeWorkout.goal}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-brand-600 transition-colors" />
            </div>
            {nextSession ? (
              <div className="mt-2 p-2.5 rounded-lg bg-surface-muted">
                <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted">
                  Sesi berikutnya
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-base">
                    {focusStyle(nextSession.session.focus).emoji}
                  </span>
                  <span className="font-semibold text-sm truncate">
                    {nextSession.session.day_label}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-text-muted tabular-nums">
                  Minggu {nextSession.weekIdx + 1} ·{" "}
                  {nextSession.session.duration_estimate_min} mnt
                </div>
              </div>
            ) : (
              <div className="mt-2 text-xs text-brand-600 font-semibold">
                🎉 Semua sesi udah dijalanin!
              </div>
            )}
            <div className="mt-2 text-[10px] text-text-muted tabular-nums">
              Progress: {workoutProgress.done}/{workoutProgress.total} sesi
            </div>
          </Link>
        ) : (
          <Link
            href="/workout"
            className="group p-4 rounded-2xl border-2 border-dashed border-border hover:border-brand-300 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-brand-50/50 dark:bg-brand-500/10 text-brand-600 flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold">Workout</div>
                <div className="text-xs text-text-muted">
                  Belum ada program
                </div>
              </div>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:text-brand-700">
              <Sparkles className="w-3 h-3" /> Generate program AI
              <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
        )}
      </div>

      {/* Weekly chart */}
      {weekInsights &&
        (weekInsights.total_entries > 0 || streak > 0) && (
          <div className="mb-4 p-4 sm:p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-start justify-between mb-3 gap-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  7 hari terakhir
                </div>
                <div className="mt-0.5 text-xl font-bold tabular-nums">
                  {fmtNum(weekInsights.avg_kcal)}{" "}
                  <span className="text-xs font-normal text-text-muted">
                    kcal/hari avg
                  </span>
                </div>
              </div>
              {kcalTarget && weekInsights.total_entries > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <Stat label="Hit" value={weekInsights.on_target_count} tone="brand" />
                  <Stat label="Under" value={weekInsights.under_target_count} tone="amber" />
                  <Stat label="Over" value={weekInsights.over_target_count} tone="rose" />
                </div>
              )}
            </div>
            <WeeklyChart
              days={weekInsights.days}
              targetKcal={kcalTarget ?? undefined}
            />
            <div className="mt-3 text-right">
              <Link
                href="/log"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
              >
                Buka catatan lengkap
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

      {/* Weight chart */}
      <WeightChart
        history={weightHistory}
        targetWeight={profile.target_weight_kg}
        goodDirection={
          profile.goal === "fat_loss" ||
          profile.goal === "fat_loss_aggressive"
            ? "down_is_good"
            : profile.goal === "muscle_gain" ||
                profile.goal === "slow_gain"
              ? "up_is_good"
              : "neutral"
        }
      />

      {/* Quick actions */}
      <div className="mb-4 p-4 rounded-2xl bg-surface border border-border">
        <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-2">
          Cepat
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <QuickAction
            href="/log"
            icon={<Camera className="w-4 h-4" />}
            label="Foto makanan"
            tone="sky"
          />
          <QuickAction
            href="/log"
            icon={<Plus className="w-4 h-4" />}
            label="Cari makanan"
            tone="brand"
          />
          <QuickAction
            href="/log"
            icon={<Scale className="w-4 h-4" />}
            label="Catat berat"
            tone="sky"
          />
          <QuickAction
            href="/workout"
            icon={<Dumbbell className="w-4 h-4" />}
            label="Log workout"
            tone="brand"
          />
        </div>
      </div>

      {/* Targets summary footer */}
      {targets && (
        <div className="p-4 rounded-2xl bg-surface-muted/50 border border-border/60">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-text-muted">
              <Target className="w-3 h-3" /> Target harian kamu
            </div>
            <Link
              href="/settings"
              className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5"
            >
              <ClipboardList className="w-3 h-3" /> Edit profil
            </Link>
          </div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
            <div>
              <div className="text-text-muted">Kcal</div>
              <div className="font-bold">{fmtNum(targets.target_kcal)}</div>
            </div>
            <div>
              <div className="text-text-muted">Protein</div>
              <div className="font-bold">{targets.protein_g}g</div>
            </div>
            <div>
              <div className="text-text-muted">Lemak</div>
              <div className="font-bold">{targets.fat_g}g</div>
            </div>
            <div>
              <div className="text-text-muted">Karbo</div>
              <div className="font-bold">{targets.carb_g}g</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "brand" | "amber" | "rose";
}) {
  const toneClass = {
    brand: "text-brand-600 dark:text-brand-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
  }[tone];
  return (
    <div className="text-center px-1.5">
      <div className={cn("font-bold tabular-nums leading-none", toneClass)}>
        {value}
      </div>
      <div className="text-[9px] text-text-muted uppercase tracking-wide font-semibold mt-0.5">
        {label}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  tone: "brand" | "sky";
}) {
  const toneClass = {
    brand:
      "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20",
    sky: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/20",
  }[tone];
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-colors",
        toneClass,
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}
