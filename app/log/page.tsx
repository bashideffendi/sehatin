"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Flame,
  Beef,
  Wheat,
  Droplet,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Scale,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Camera,
  Dumbbell,
} from "lucide-react";
import { AddFoodModal } from "@/components/add-food-modal";
import { DatePopover } from "@/components/date-popover";
import {
  addEntry,
  deleteEntry,
  getDailySummary,
  getLoggedDates,
  todayISO,
  MEAL_SLOTS,
  MEAL_SLOT_LABEL,
  MEAL_SLOT_EMOJI,
  type FoodLogEntry,
  type MealSlot,
  type DailySummary,
} from "@/lib/food-log";
import {
  addWeight,
  getLatestWeight,
  getWeightTrend,
  getWeightOnDate,
  getWeightHistory,
  type WeightLogEntry,
  type WeightTrend,
} from "@/lib/weight-log";
import { loadProfile, type UserProfile } from "@/lib/profile";
import { calculateTargets } from "@/src/nutrition/tdee";
import {
  getActiveMealPlan,
  getPlanDayForDate,
  normalizeSlot,
  type StoredMealPlan,
  type Meal,
  type MealItem,
} from "@/lib/meal-plan";
import {
  getActiveWorkoutPlan,
  findNextUnloggedSession,
  focusStyle,
  type StoredWorkoutPlan,
  type WorkoutSession,
} from "@/lib/workout";
import { countSessionsForPlan } from "@/lib/workout-log";
import {
  getWeekInsights,
  getStreak,
  buildWeightSpark,
  type WeekInsights,
  type WeightSparkData,
} from "@/lib/insights";
import { WeeklyChart } from "@/components/weekly-chart";
import { WeightSparkline } from "@/components/weight-sparkline";
import { Donut, Card, Kicker, Pill } from "@/components/ui";
import { LogTimeline } from "@/components/log-timeline";
import { LogQuickActions } from "@/components/log-quick-actions";
import { LogRecentPhotoCard } from "@/components/log-recent-photo-card";
import { VoiceQuickAddModal } from "@/components/voice-quick-add-modal";
import { fmtKcal } from "@/lib/format";
import { cn, fmtNum } from "@/lib/utils";

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDateID(iso: string): string {
  const d = new Date(iso);
  const today = todayISO();
  const yesterday = shiftDate(today, -1);
  if (iso === today) return "Hari ini";
  if (iso === yesterday) return "Kemarin";
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

type ModalMode = "search" | "manual" | "photo";

export default function LogPage() {
  const [date, setDate] = useState<string>("");
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSlot, setModalSlot] = useState<MealSlot>("sarapan");
  const [modalMode, setModalMode] = useState<ModalMode>("search");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestWeight, setLatestWeight] = useState<WeightLogEntry | null>(null);
  const [trend, setTrend] = useState<WeightTrend | null>(null);
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set());
  const [activePlan, setActivePlan] = useState<StoredMealPlan | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<StoredWorkoutPlan | null>(
    null,
  );
  const [weightSpark, setWeightSpark] = useState<WeightSparkData | null>(null);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Init on client
  useEffect(() => {
    setDate(todayISO());
    setProfile(loadProfile());
    setActivePlan(getActiveMealPlan());
    setActiveWorkout(getActiveWorkoutPlan());
    refreshWeight();
  }, []);

  const refreshSummary = useCallback((d: string) => {
    setSummary(getDailySummary(d));
    setLoggedDates(getLoggedDates());
  }, []);

  const refreshWeight = useCallback(() => {
    setLatestWeight(getLatestWeight());
    setTrend(getWeightTrend(7));
    setWeightSpark(buildWeightSpark(getWeightHistory(), 30));
  }, []);

  useEffect(() => {
    if (date) refreshSummary(date);
  }, [date, refreshSummary]);

  const targets = useMemo(() => {
    if (
      !profile?.age ||
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

  const handleAddFood = useCallback(
    (data: Parameters<NonNullable<React.ComponentProps<typeof AddFoodModal>["onAdd"]>>[0]) => {
      addEntry({ ...data, date });
      refreshSummary(date);
    },
    [date, refreshSummary],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteEntry(id);
      refreshSummary(date);
    },
    [date, refreshSummary],
  );

  const openModal = useCallback(
    (slot: MealSlot, mode: ModalMode = "search") => {
      setModalSlot(slot);
      setModalMode(mode);
      setModalOpen(true);
    },
    [],
  );

  const handleSaveWeight = useCallback(() => {
    const w = Number.parseFloat(weightInput);
    if (!Number.isFinite(w) || w < 20 || w > 250) return;
    addWeight({ date, weight_kg: w });
    setWeightInput("");
    setShowWeightForm(false);
    refreshWeight();
  }, [weightInput, date, refreshWeight]);

  const weightOnThisDate = useMemo(
    () => (date ? getWeightOnDate(date) : null),
    [date, summary], // re-eval on summary change as proxy for refresh
  );

  const planDay = useMemo(() => {
    if (!activePlan || !date) return null;
    return getPlanDayForDate(date, activePlan);
  }, [activePlan, date]);

  const nextWorkout = useMemo(
    () => (activeWorkout ? findNextUnloggedSession(activeWorkout) : null),
    [activeWorkout, summary], // summary as proxy for log changes
  );

  const workoutProgress = useMemo(() => {
    if (!activeWorkout) return null;
    const total = activeWorkout.program.weeks.reduce(
      (s, w) => s + w.sessions.length,
      0,
    );
    void summary; // dep
    return { done: countSessionsForPlan(activeWorkout.id), total };
  }, [activeWorkout, summary]);

  const weekInsights = useMemo(() => {
    if (!summary) return null;
    return getWeekInsights(todayISO(), targets?.target_kcal ?? null);
  }, [summary, targets]);

  // Streak is derived from food log entries; tied to summary changes
  const streak = useMemo(() => {
    void summary; // re-eval when summary updates
    return getStreak();
  }, [summary]);

  const plannedBySlot = useMemo(() => {
    const map = new Map<MealSlot, Meal>();
    if (!planDay) return map;
    for (const meal of planDay.meals) {
      const slot = normalizeSlot(meal.slot);
      if (slot) map.set(slot, meal);
    }
    return map;
  }, [planDay]);

  const handleLogPlannedItem = useCallback(
    (slot: MealSlot, item: MealItem) => {
      addEntry({
        date,
        meal_slot: slot,
        food_code: item.food_code,
        food_name: item.food_name,
        portion_g: item.portion_g,
        kcal: item.kcal,
        protein_g: item.protein_g,
        fat_g: item.fat_g,
        carb_g: item.carb_g,
        source: "plan",
      });
      refreshSummary(date);
    },
    [date, refreshSummary],
  );

  if (!date || !summary) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  const kcalTarget = targets?.target_kcal ?? null;
  const pct = kcalTarget ? Math.min(120, (summary.total_kcal / kcalTarget) * 100) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 pb-32">
      {/* Date nav + streak chip */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div className="min-w-0">
          <Kicker>Catatan harian</Kicker>
          <DatePopover
            value={date}
            max={todayISO()}
            onChange={(d) => setDate(d)}
            highlightedDates={loggedDates}
          >
            <h1
              className="font-extrabold tracking-tight leading-none mt-2"
              style={{ fontSize: 32 }}
            >
              {formatDateID(date) === "Hari ini" ||
              formatDateID(date) === "Kemarin"
                ? formatDateID(date)
                : new Date(date).toLocaleDateString("id-ID", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
            </h1>
          </DatePopover>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {streak > 0 && (
            <Pill tone="clay" size="md" icon={<Flame className="w-3 h-3" />}>
              <span className="tabular">{streak}</span> hari
            </Pill>
          )}
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            className="w-9 h-9 rounded-full bg-surface-2 hover:bg-surface text-ink border border-hairline flex items-center justify-center"
            aria-label="Hari sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={date >= todayISO()}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center border border-hairline",
              date >= todayISO()
                ? "bg-surface-2/50 text-muted/40 cursor-not-allowed"
                : "bg-surface-2 hover:bg-surface text-ink",
            )}
            aria-label="Hari berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Daily summary — Donut card */}
      <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6 mb-5">
        <div className="flex items-center gap-4 sm:gap-6">
          <Donut
            value={summary.total_kcal}
            target={kcalTarget ?? 2000}
            size={140}
            stroke={12}
            color="var(--color-forest)"
            track="var(--color-forest-100)"
          >
            <div className="text-[9px] font-bold uppercase tracking-wider text-muted">
              Kalori
            </div>
            <div
              className="tabular mt-0.5"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: 30,
                lineHeight: 1,
              }}
            >
              {fmtKcal(summary.total_kcal)}
            </div>
            {kcalTarget && (
              <div className="text-[10px] text-muted mt-0.5 tabular">
                / {fmtKcal(kcalTarget)}
              </div>
            )}
          </Donut>
          <div className="flex-1 min-w-0">
            {kcalTarget && pct !== null && pct < 100 && (
              <div className="text-[13.5px] font-bold mb-3">
                Sisa{" "}
                <span className="tabular">
                  {fmtKcal(kcalTarget - summary.total_kcal)}
                </span>{" "}
                kcal
              </div>
            )}
            <LogMacroBar
              label="Protein"
              value={summary.total_protein_g}
              target={targets?.protein_g ?? 0}
              tone="forest"
            />
            <LogMacroBar
              label="Lemak"
              value={summary.total_fat_g}
              target={targets?.fat_g ?? 0}
              tone="clay"
            />
            <LogMacroBar
              label="Karbo"
              value={summary.total_carb_g}
              target={targets?.carb_g ?? 0}
              tone="sun"
            />
          </div>
        </div>
        {!targets && (
          <div className="mt-4 pt-3 border-t border-hairline text-[12px] text-muted">
            Belum ada target.{" "}
            <Link
              href="/onboarding"
              className="underline font-semibold text-forest"
            >
              Setup profil
            </Link>{" "}
            biar tahu range optimal.
          </div>
        )}
      </Card>

      {/* Quick actions + Timeline — 2-col on desktop, stacked on mobile */}
      <div className="mb-5 grid lg:grid-cols-[1fr_1.1fr] gap-4">
        <div className="space-y-4">
          <LogQuickActions
            onFoto={() => openModal("sarapan", "photo")}
            onCari={() => openModal("sarapan", "search")}
            onVoice={() => setVoiceModalOpen(true)}
          />
          {(() => {
            const recentPhoto = summary?.entries
              ?.filter((e) => e.source === "photo")
              .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
            return recentPhoto ? (
              <LogRecentPhotoCard
                entry={recentPhoto}
                onEdit={() => openModal(recentPhoto.meal_slot, "manual")}
              />
            ) : null;
          })()}
        </div>
        <div>
          <LogTimeline
            entries={summary.entries}
            unloggedPlanned={(() => {
              const out: { slot: MealSlot; item: MealItem }[] = [];
              if (!planDay || date !== todayISO()) return out;
              const loggedCodes = new Set(
                summary.entries
                  .map((e) => e.food_code)
                  .filter((c): c is string => Boolean(c)),
              );
              for (const meal of planDay.meals) {
                const s = normalizeSlot(meal.slot);
                if (!s) continue;
                for (const item of meal.items) {
                  if (!loggedCodes.has(item.food_code)) {
                    out.push({ slot: s, item });
                  }
                }
              }
              return out;
            })()}
            onDelete={handleDelete}
            onLogPlanned={handleLogPlannedItem}
            onAddManual={() => openModal("sarapan", "manual")}
          />
        </div>
      </div>

      {/* Weekly insights */}
      {weekInsights &&
        (weekInsights.total_entries > 0 || streak > 0) && (
          <div className="mb-4 p-4 sm:p-5 rounded-2xl bg-surface border border-border">
            <div className="flex items-start justify-between mb-3 gap-4">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  7 hari terakhir
                </div>
                <div className="mt-0.5 text-2xl font-bold tabular-nums">
                  {fmtNum(weekInsights.avg_kcal)}{" "}
                  <span className="text-sm font-normal text-text-muted">
                    kcal/hari rata-rata
                  </span>
                </div>
              </div>
              {streak > 0 && (
                <div className="text-right flex-shrink-0">
                  <div className="inline-flex items-center gap-1 text-orange-500 dark:text-orange-400 font-bold text-lg">
                    <Flame className="w-5 h-5" fill="currentColor" />
                    <span className="tabular-nums">{streak}</span>
                  </div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wide font-semibold">
                    {streak === 1 ? "hari" : "hari berturut"}
                  </div>
                </div>
              )}
            </div>
            <WeeklyChart
              days={weekInsights.days}
              targetKcal={kcalTarget ?? undefined}
              activeDate={date}
              onSelectDay={(d) => setDate(d)}
            />
            {kcalTarget && weekInsights.total_entries > 0 && (
              <div className="mt-3 pt-3 border-t border-border grid grid-cols-4 gap-2 text-center text-xs">
                <Stat
                  label="Hit"
                  value={weekInsights.on_target_count}
                  tone="brand"
                />
                <Stat
                  label="Under"
                  value={weekInsights.under_target_count}
                  tone="amber"
                />
                <Stat
                  label="Over"
                  value={weekInsights.over_target_count}
                  tone="rose"
                />
                <Stat
                  label="Skip"
                  value={weekInsights.rest_count}
                  tone="muted"
                />
              </div>
            )}
          </div>
        )}

      {/* Plan banner (if active plan covers this date) */}
      {planDay && (
        <div className="mb-3 p-3 rounded-xl bg-brand-50/50 dark:bg-brand-500/10 border border-brand-200/60 dark:border-brand-500/25 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface text-brand-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-brand-700 dark:text-brand-300">
              Plan hari ini · {fmtNum(planDay.total_kcal)} kcal
            </div>
            <div className="text-[11px] text-text-muted tabular-nums">
              {planDay.meals.length} meal · P{planDay.total_protein_g}g · F
              {planDay.total_fat_g}g · C{planDay.total_carb_g}g
            </div>
          </div>
          <Link
            href="/plan"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface border border-brand-300 dark:border-brand-500/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-500/20"
          >
            Lihat plan
          </Link>
        </div>
      )}

      {/* Workout banner (next unlogged session, if active program) */}
      {activeWorkout && date === todayISO() && (
        <WorkoutBanner
          plan={activeWorkout}
          nextSession={nextWorkout}
          progress={workoutProgress}
        />
      )}

      {/* Weight check-in */}
      <div className="mb-6 p-4 rounded-2xl bg-surface border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-300 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-text-muted">Berat badan</div>
              <div className="font-semibold tabular-nums">
                {weightOnThisDate
                  ? `${weightOnThisDate.weight_kg} kg`
                  : latestWeight
                    ? `${latestWeight.weight_kg} kg`
                    : "Belum ada"}
                {trend && (
                  <span
                    className={cn(
                      "ml-2 text-xs font-medium inline-flex items-center gap-0.5",
                      trend.delta_kg < 0
                        ? "text-brand-600"
                        : trend.delta_kg > 0
                          ? "text-rose-600"
                          : "text-text-muted",
                    )}
                  >
                    {trend.delta_kg < 0 ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : trend.delta_kg > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                    {trend.delta_kg > 0 ? "+" : ""}
                    {trend.delta_kg} kg / 7 hari
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setShowWeightForm(!showWeightForm);
              if (!showWeightForm && weightOnThisDate) {
                setWeightInput(String(weightOnThisDate.weight_kg));
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/10"
          >
            {showWeightForm ? "Batal" : weightOnThisDate ? "Update" : "Catat"}
          </button>
        </div>
        {weightSpark && !showWeightForm && (
          <div className="mt-3 pt-3 border-t border-border/60">
            <WeightSparkline
              data={weightSpark}
              goodDirection={
                profile?.goal === "fat_loss" ||
                profile?.goal === "fat_loss_aggressive"
                  ? "down_is_good"
                  : profile?.goal === "muscle_gain" ||
                      profile?.goal === "slow_gain"
                    ? "up_is_good"
                    : "neutral"
              }
            />
            <div className="mt-1 flex justify-between text-[9px] text-text-muted tabular-nums">
              <span>min {weightSpark.min} kg</span>
              <span className="font-semibold">
                {weightSpark.points.length} catatan
              </span>
              <span>max {weightSpark.max} kg</span>
            </div>
          </div>
        )}
        {showWeightForm && (
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="65.5"
                step="0.1"
                min={20}
                max={250}
                autoFocus
                className="w-full px-3 py-2.5 pr-12 rounded-lg border-2 border-border bg-surface focus:outline-none focus:border-brand-500 tabular-nums font-semibold"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-semibold">
                kg
              </span>
            </div>
            <button
              onClick={handleSaveWeight}
              disabled={
                !weightInput ||
                !Number.isFinite(Number.parseFloat(weightInput))
              }
              className={cn(
                "px-4 py-2.5 rounded-lg font-semibold text-sm",
                weightInput
                  ? "bg-fg text-bg hover:-translate-y-0.5 shadow-sm"
                  : "bg-surface-muted text-text-muted cursor-not-allowed",
              )}
            >
              Simpan
            </button>
          </div>
        )}
      </div>

      {/* Meal slot cards */}
      <div className="space-y-3">
        {MEAL_SLOTS.map((slot) => {
          const slotData = summary.per_slot[slot];
          const entries = summary.entries.filter((e) => e.meal_slot === slot);
          const plannedMeal = plannedBySlot.get(slot);
          const loggedCodes = new Set(
            entries
              .map((e) => e.food_code)
              .filter((c): c is string => Boolean(c)),
          );
          const unloggedPlanned =
            plannedMeal?.items.filter((p) => !loggedCodes.has(p.food_code)) ??
            [];
          const showEmptyButtons =
            entries.length === 0 && unloggedPlanned.length === 0;
          return (
            <div
              key={slot}
              className="p-4 sm:p-5 rounded-2xl bg-surface border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{MEAL_SLOT_EMOJI[slot]}</span>
                  <div>
                    <div className="font-semibold tracking-tight">
                      {MEAL_SLOT_LABEL[slot]}
                    </div>
                    <div className="text-xs text-text-muted tabular-nums">
                      {plannedMeal ? (
                        <>
                          <span className="font-semibold text-fg">
                            {fmtNum(slotData.kcal)}
                          </span>{" "}
                          / {fmtNum(plannedMeal.total_kcal)} kcal ·{" "}
                          {slotData.count} item
                        </>
                      ) : (
                        <>
                          {fmtNum(slotData.kcal)} kcal · {slotData.count} item
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openModal(slot, "photo")}
                    className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/20 flex items-center justify-center"
                    aria-label={`Foto makanan untuk ${MEAL_SLOT_LABEL[slot]}`}
                    title="Catat dari foto"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openModal(slot)}
                    className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-500/20 flex items-center justify-center"
                    aria-label={`Tambah ${MEAL_SLOT_LABEL[slot]}`}
                    title="Cari atau input manual"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Per-slot progress bar (planned vs actual) */}
              {plannedMeal && plannedMeal.total_kcal > 0 && (
                <SlotProgressBar
                  actual={slotData.kcal}
                  planned={plannedMeal.total_kcal}
                />
              )}

              {/* Unlogged planned items (ghost rows) */}
              {unloggedPlanned.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400 inline-flex items-center gap-1 mb-1.5">
                    <Sparkles className="w-3 h-3" /> Dari plan
                  </div>
                  <ul className="space-y-1">
                    {unloggedPlanned.map((item, i) => (
                      <PlannedGhostRow
                        key={`${slot}-${i}-${item.food_code}`}
                        item={item}
                        onLog={() => handleLogPlannedItem(slot, item)}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {/* Actual entries OR empty state */}
              {showEmptyButtons ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openModal(slot, "photo")}
                    className="py-3 rounded-xl border-2 border-dashed border-border hover:border-sky-300 text-sm text-text-muted hover:text-sky-600 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" /> Foto
                  </button>
                  <button
                    onClick={() => openModal(slot)}
                    className="py-3 rounded-xl border-2 border-dashed border-border hover:border-brand-300 text-sm text-text-muted hover:text-brand-600 transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Cari / manual
                  </button>
                </div>
              ) : entries.length > 0 ? (
                <ul className="space-y-1.5">
                  {entries.map((e) => (
                    <FoodItemRow key={e.id} entry={e} onDelete={handleDelete} />
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Floating action cluster (mobile sticky) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3">
        <button
          onClick={() => openModal("sarapan", "photo")}
          className="w-12 h-12 rounded-full bg-surface border-2 border-brand-500 text-brand-600 shadow-lg shadow-brand-600/15 flex items-center justify-center hover:-translate-y-1 transition-transform"
          aria-label="Foto makanan"
          title="Catat dari foto"
        >
          <Camera className="w-5 h-5" />
        </button>
        <button
          onClick={() => openModal("sarapan")}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-xl shadow-brand-600/30 flex items-center justify-center hover:-translate-y-1 transition-transform"
          aria-label="Tambah makanan"
          title="Cari atau input manual"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Insights — empty state */}
      {summary.entry_count === 0 && date === todayISO() && (
        <div className="mt-6 p-5 rounded-2xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 text-center">
          <Sparkles className="w-6 h-6 text-brand-600 mx-auto mb-2" />
          <p className="text-sm">
            Belum catat apa-apa hari ini. Pilih cara tercepat:
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => openModal("sarapan", "photo")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-brand-300 dark:border-brand-500/40 text-sm font-semibold hover:bg-brand-100 dark:hover:bg-brand-500/20"
            >
              <Camera className="w-3.5 h-3.5 text-brand-600" /> Foto makanan
            </button>
            <button
              onClick={() => openModal("sarapan")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-sm font-semibold hover:bg-surface-muted"
            >
              <Plus className="w-3.5 h-3.5" /> Cari makanan
            </button>
            {!activePlan && (
              <Link
                href="/plan"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-sm font-semibold hover:bg-surface-muted"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-600" /> Generate
                meal plan AI
              </Link>
            )}
          </div>
        </div>
      )}

      <AddFoodModal
        open={modalOpen}
        defaultSlot={modalSlot}
        defaultMode={modalMode}
        onClose={() => setModalOpen(false)}
        onAdd={handleAddFood}
      />

      <VoiceQuickAddModal
        open={voiceModalOpen}
        defaultSlot="sarapan"
        onClose={() => setVoiceModalOpen(false)}
        onAdd={(item, slot) => {
          addEntry({
            date,
            meal_slot: slot,
            food_name: item.food_name,
            portion_g: item.portion_g,
            kcal: item.kcal,
            protein_g: item.protein_g,
            fat_g: item.fat_g,
            carb_g: item.carb_g,
            source: "manual",
            notes: "voice quick-add",
          });
          refreshSummary(date);
        }}
      />
    </div>
  );
}

function Macro({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="text-center">
      <div className="text-brand-100">{label}</div>
      <div className="font-bold tabular-nums text-base mt-0.5">
        {value}
        <span className="text-xs font-normal opacity-80 ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

function LogMacroBar({
  label,
  value,
  target,
  tone,
}: {
  label: string;
  value: number;
  target: number;
  tone: "forest" | "clay" | "sun";
}) {
  const pct = target > 0 ? Math.min(110, (value / target) * 100) : 0;
  const barColor =
    tone === "forest"
      ? "bg-forest"
      : tone === "clay"
        ? "bg-clay"
        : "bg-sun";
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-baseline justify-between text-[11.5px]">
        <span className="font-semibold text-ink">{label}</span>
        <span className="tabular text-muted">
          <span className="font-bold text-ink">{Math.round(value)}g</span>
          {target > 0 && <> / {Math.round(target)}</>}
        </span>
      </div>
      <div className="mt-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
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
  tone: "brand" | "amber" | "rose" | "muted";
}) {
  const toneClass = {
    brand: "text-brand-600 dark:text-brand-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
    muted: "text-text-muted",
  }[tone];
  return (
    <div>
      <div
        className={cn(
          "text-xl font-bold tabular-nums leading-none",
          toneClass,
        )}
      >
        {value}
      </div>
      <div className="text-[10px] text-text-muted uppercase tracking-wide font-semibold mt-0.5">
        {label}
      </div>
    </div>
  );
}

function WorkoutBanner({
  plan,
  nextSession,
  progress,
}: {
  plan: StoredWorkoutPlan;
  nextSession: {
    weekIdx: number;
    sessionIdx: number;
    session: WorkoutSession;
  } | null;
  progress: { done: number; total: number } | null;
}) {
  // Program-finished celebration state
  if (!nextSession) {
    return (
      <div className="mb-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/25 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-surface text-emerald-600 flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            🎉 Semua sesi udah dijalanin!
          </div>
          <div className="text-[11px] text-text-muted tabular-nums">
            {progress?.done ?? 0}/{progress?.total ?? 0} sesi · Generate program
            baru di /workout
          </div>
        </div>
        <Link
          href="/workout"
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
        >
          Lihat
        </Link>
      </div>
    );
  }

  const style = focusStyle(nextSession.session.focus);
  return (
    <div className="mb-3 p-3 rounded-xl bg-sky-50/50 dark:bg-sky-500/10 border border-sky-200/60 dark:border-sky-500/25 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-surface text-sky-600 flex items-center justify-center flex-shrink-0 text-base">
        {style.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-sky-700 dark:text-sky-300 inline-flex items-center gap-1.5 flex-wrap">
          Workout berikutnya
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
              style.className,
            )}
          >
            {nextSession.session.focus}
          </span>
        </div>
        <div className="text-[11px] text-fg/80 font-medium truncate">
          {nextSession.session.day_label}
        </div>
        <div className="text-[10px] text-text-muted tabular-nums">
          Minggu {nextSession.weekIdx + 1} ·{" "}
          {nextSession.session.duration_estimate_min} mnt ·{" "}
          {nextSession.session.main.length} main
          {progress && ` · progress ${progress.done}/${progress.total}`}
        </div>
      </div>
      <Link
        href="/workout"
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface border border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/20"
      >
        Mulai
      </Link>
    </div>
  );
}

function SlotProgressBar({
  actual,
  planned,
}: {
  actual: number;
  planned: number;
}) {
  const pct = planned > 0 ? actual / planned : 0;
  const fillPct = Math.min(120, pct * 100);
  const remaining = planned - actual;
  let barColor = "bg-text-muted/30";
  let label = "Belum mulai";
  if (actual > 0) {
    if (pct < 0.7) {
      barColor = "bg-amber-300 dark:bg-amber-500/60";
      label = `Sisa ${fmtNum(remaining)} kcal`;
    } else if (pct < 0.9) {
      barColor = "bg-brand-300 dark:bg-brand-500/60";
      label = `Sisa ${fmtNum(remaining)} kcal`;
    } else if (pct <= 1.1) {
      barColor = "bg-brand-500";
      label =
        remaining > 0
          ? `Sisa ${fmtNum(remaining)} kcal · hit target`
          : "Hit target ✓";
    } else if (pct <= 1.3) {
      barColor = "bg-amber-500";
      label = `Lewat ${fmtNum(-remaining)} kcal`;
    } else {
      barColor = "bg-rose-500";
      label = `Lewat ${fmtNum(-remaining)} kcal`;
    }
  }
  return (
    <div className="mb-3">
      <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <div className="mt-1 text-[10px] text-text-muted tabular-nums">
        {label}
      </div>
    </div>
  );
}

function PlannedGhostRow({
  item,
  onLog,
}: {
  item: MealItem;
  onLog: () => void;
}) {
  return (
    <li className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-50/40 dark:bg-brand-500/10 border border-dashed border-brand-300/60 dark:border-brand-500/30">
      <Sparkles className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.food_name}</div>
        <div className="text-xs text-text-muted tabular-nums">
          {item.portion_g}g · {fmtNum(item.kcal)} kcal · P{item.protein_g}g F
          {item.fat_g}g C{item.carb_g}g
        </div>
      </div>
      <button
        onClick={onLog}
        className="px-2.5 py-1 rounded-md bg-brand-600 text-white text-[10px] font-bold inline-flex items-center gap-1 hover:bg-brand-700 flex-shrink-0"
        title="Pindah ini dari plan ke Catatan harian"
      >
        <Plus className="w-3 h-3" /> Catat
      </button>
    </li>
  );
}

function FoodItemRow({
  entry,
  onDelete,
}: {
  entry: FoodLogEntry;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-muted">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{entry.food_name}</div>
        <div className="text-xs text-text-muted tabular-nums">
          {entry.portion_g}g · {fmtNum(entry.kcal)} kcal
          {entry.protein_g != null && ` · P${entry.protein_g}g`}
          {entry.fat_g != null && ` · F${entry.fat_g}g`}
          {entry.carb_g != null && ` · C${entry.carb_g}g`}
        </div>
      </div>
      <button
        onClick={() => {
          if (confirm(`Hapus "${entry.food_name}"?`)) {
            onDelete(entry.id);
          }
        }}
        className="w-7 h-7 rounded-md text-text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Hapus"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}
