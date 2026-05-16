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
  ShoppingBag,
  Target,
  Plus,
  CheckCircle2,
  AlertCircle,
  Flame,
} from "lucide-react";
import { loadProfile, type UserProfile } from "@/lib/profile";
import {
  saveMealPlan,
  updateMealPlan,
  getActiveMealPlan,
  clearMealPlan,
  normalizeSlot,
  shortDateID,
  shiftISODate,
  createBlankPlan,
  addItemToMeal,
  removeItemFromMeal,
  type StoredMealPlan,
  type Meal,
  type MealItem,
} from "@/lib/meal-plan";
import {
  addEntry,
  todayISO,
  MEAL_SLOT_LABEL,
  MEAL_SLOT_EMOJI,
  type MealSlot,
} from "@/lib/food-log";
import { calculateTargets } from "@/src/nutrition/tdee";
import { AddFoodModal } from "@/components/add-food-modal";
import { cn, fmtNum } from "@/lib/utils";

const REQUIRED_FIELDS: (keyof UserProfile)[] = [
  "age",
  "sex",
  "weight_kg",
  "height_cm",
  "activity",
  "goal",
];

export default function PlanPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activePlan, setActivePlan] = useState<StoredMealPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [appliedDayIdx, setAppliedDayIdx] = useState<number | null>(null);

  // Config form
  const [days, setDays] = useState(3);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [contextNotes, setContextNotes] = useState("");

  // Edit modal: which slot to add an item to
  const [editTarget, setEditTarget] = useState<{
    dayIdx: number;
    mealIdx: number;
    slotLabel: string;
    slotEnum: MealSlot | null;
  } | null>(null);

  // Hydrate on mount
  useEffect(() => {
    setProfile(loadProfile());
    setActivePlan(getActiveMealPlan());
  }, []);

  const profileComplete = useMemo(() => {
    if (!profile) return false;
    return REQUIRED_FIELDS.every((k) => {
      const v = profile[k];
      return v !== undefined && v !== null && v !== "";
    });
  }, [profile]);

  const missingFields = useMemo(() => {
    if (!profile) return REQUIRED_FIELDS.map(String);
    return REQUIRED_FIELDS.filter((k) => {
      const v = profile[k];
      return v === undefined || v === null || v === "";
    }).map(String);
  }, [profile]);

  const handleGenerate = useCallback(async () => {
    if (!profile || !profileComplete) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          days,
          meals_per_day: mealsPerDay,
          context_notes: contextNotes.trim() || undefined,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        targets?: StoredMealPlan["targets"];
        plan?: StoredMealPlan["plan"];
        hint?: string;
      };
      if (!data.ok || !data.plan || !data.targets) {
        setError(
          [data.error, data.hint].filter(Boolean).join(" — ") ||
            "Gagal generate plan.",
        );
        return;
      }
      const stored = saveMealPlan({
        start_date: todayISO(),
        days,
        diet_method: profile.diet_method,
        budget_idr_per_day: profile.budget_idr_per_day,
        context_notes: contextNotes.trim() || undefined,
        targets: data.targets,
        plan: data.plan,
      });
      setActivePlan(stored);
      setActiveDayIdx(0);
      setShowConfig(false);
      setAppliedDayIdx(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }, [profile, profileComplete, days, mealsPerDay, contextNotes]);

  const handleClearPlan = useCallback(() => {
    if (!confirm("Hapus plan aktif? Aksi gak bisa di-undo.")) return;
    clearMealPlan();
    setActivePlan(null);
    setActiveDayIdx(0);
    setAppliedDayIdx(null);
  }, []);

  const handleCreateBlankPlan = useCallback(
    (n_days: number, n_meals: number) => {
      if (!profile) return;
      // Compute targets even though plan is blank — needed for display
      let targets;
      try {
        targets = calculateTargets({
          age: profile.age!,
          sex: profile.sex!,
          weight_kg: profile.weight_kg!,
          height_cm: profile.height_cm!,
          activity: profile.activity!,
          goal: profile.goal!,
        });
      } catch {
        setError("Profil belum cukup buat hitung target.");
        return;
      }
      const blank = createBlankPlan(n_days, n_meals);
      const stored = saveMealPlan({
        start_date: todayISO(),
        days: n_days,
        diet_method: profile.diet_method,
        budget_idr_per_day: profile.budget_idr_per_day,
        context_notes: contextNotes.trim() || undefined,
        targets,
        plan: blank,
      });
      setActivePlan(stored);
      setActiveDayIdx(0);
      setAppliedDayIdx(null);
      setShowConfig(false);
      setError(null);
    },
    [profile, contextNotes],
  );

  // Item editing handlers — mutate the stored plan in-place
  const handleAddItem = useCallback(
    (dayIdx: number, mealIdx: number, item: MealItem) => {
      setActivePlan((cur) => {
        if (!cur) return cur;
        const nextPlan = addItemToMeal(cur.plan, dayIdx, mealIdx, item);
        const updated: StoredMealPlan = { ...cur, plan: nextPlan };
        // Persist
        updateMealPlan(updated);
        return updated;
      });
    },
    [],
  );

  const handleRemoveItem = useCallback(
    (dayIdx: number, mealIdx: number, itemIdx: number) => {
      setActivePlan((cur) => {
        if (!cur) return cur;
        const nextPlan = removeItemFromMeal(cur.plan, dayIdx, mealIdx, itemIdx);
        const updated: StoredMealPlan = { ...cur, plan: nextPlan };
        updateMealPlan(updated);
        return updated;
      });
    },
    [],
  );

  const handleLogDay = useCallback(
    (dayIdx: number) => {
      if (!activePlan) return;
      const day = activePlan.plan.days[dayIdx];
      if (!day) return;
      const targetDate = shiftISODate(activePlan.start_date, dayIdx);
      let logged = 0;
      for (const meal of day.meals) {
        const slot = normalizeSlot(meal.slot);
        if (!slot) continue;
        for (const item of meal.items) {
          addEntry({
            date: targetDate,
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
          logged++;
        }
      }
      setAppliedDayIdx(dayIdx);
      alert(
        `${logged} item dari plan hari ${dayIdx + 1} (${shortDateID(targetDate)}) udah masuk ke catatan harian.`,
      );
    },
    [activePlan],
  );

  const handleLogMeal = useCallback(
    (dayIdx: number, meal: Meal) => {
      if (!activePlan) return;
      const targetDate = shiftISODate(activePlan.start_date, dayIdx);
      const slot = normalizeSlot(meal.slot);
      if (!slot) {
        alert(`Slot "${meal.slot}" tidak dikenali.`);
        return;
      }
      for (const item of meal.items) {
        addEntry({
          date: targetDate,
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
      }
    },
    [activePlan],
  );

  // ============ Render: no profile or incomplete ============

  if (!profileComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-500/15 text-brand-600 items-center justify-center mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Plan</h1>
          <p className="mt-2 text-text-muted">
            AI compose rencana makan personalized dari profil + harga lokal +
            kondisi medis kamu.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
          <div className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold mb-2">
            <AlertCircle className="w-5 h-5" />
            Setup profil dulu
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">
            Buat generate plan personalized, kita perlu data dasar dulu:{" "}
            <span className="font-semibold">
              {missingFields.length} field
            </span>{" "}
            belum lengkap ({missingFields.join(", ")}).
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-700 dark:bg-amber-500 text-white font-semibold text-sm hover:-translate-y-0.5 transition-transform"
          >
            Lengkapi profil <Plus className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // ============ Render: no plan yet (config + generate) ============

  if (!activePlan && !generating) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <PageHero />
        <ConfigForm
          days={days}
          mealsPerDay={mealsPerDay}
          contextNotes={contextNotes}
          onDaysChange={setDays}
          onMealsPerDayChange={setMealsPerDay}
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
          Generate Plan dengan AI
        </button>
        <p className="mt-3 text-xs text-text-muted text-center leading-relaxed">
          AI compose plan berdasar profil + kondisi medis + alergi + target +
          harga PIHPS lokal. Estimasi waktu: 30-60 detik.
        </p>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold text-text-muted">
            <span className="px-3 bg-bg">atau</span>
          </div>
        </div>

        <button
          onClick={() => handleCreateBlankPlan(days, mealsPerDay)}
          className="mt-4 w-full px-6 py-3 rounded-2xl font-semibold bg-surface border-2 border-border hover:border-brand-300 inline-flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Bikin plan manual ({days} hari × {mealsPerDay} meal kosong)
        </button>
        <p className="mt-2 text-xs text-text-muted text-center leading-relaxed">
          Plan kosong, isi sendiri item per meal pakai cari TKPI atau manual.
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
          Lagi compose plan kamu...
        </h1>
        <p className="mt-2 text-text-muted">
          AI lagi seleksi bahan dari 1.146 makanan TKPI, cek harga PIHPS, dan
          susun {days} hari × {mealsPerDay} meal.
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Biasanya 30-60 detik. Jangan refresh ya.
        </p>
      </div>
    );
  }

  // ============ Render: active plan view ============

  if (!activePlan) return null; // appeasing TS
  const plan = activePlan;
  const day = plan.plan.days[activeDayIdx];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Meal plan AI
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Plan {plan.days} hari
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {plan.diet_method && plan.diet_method !== "standard"
              ? `${plan.diet_method.replace(/_/g, " ")} · `
              : ""}
            Target {fmtNum(plan.targets.target_kcal)} kcal/hari · digenerate{" "}
            {new Date(plan.generated_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <button
            onClick={() => setShowConfig(true)}
            className="px-3 py-2 rounded-lg border border-border hover:border-brand-300 text-xs font-semibold inline-flex items-center gap-1.5"
            title="Generate ulang"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Ulangi
          </button>
          <button
            onClick={handleClearPlan}
            className="w-9 h-9 rounded-lg border border-border hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 flex items-center justify-center"
            title="Hapus plan"
            aria-label="Hapus plan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {plan.plan.days.map((d, i) => {
          const dateIso = shiftISODate(plan.start_date, i);
          const isToday = dateIso === todayISO();
          const isActive = i === activeDayIdx;
          return (
            <button
              key={i}
              onClick={() => {
                setActiveDayIdx(i);
                setAppliedDayIdx(null);
              }}
              className={cn(
                "flex-shrink-0 px-3 py-2 rounded-xl border-2 transition-colors text-left",
                isActive
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                  : "border-border hover:border-fg/20",
              )}
            >
              <div className="text-[10px] font-bold tracking-wide uppercase text-text-muted">
                Hari {d.day}
              </div>
              <div className="text-sm font-bold tabular-nums">
                {shortDateID(dateIso)}
                {isToday && (
                  <span className="ml-1 text-[10px] font-semibold text-brand-600 normal-case">
                    · ini
                  </span>
                )}
              </div>
              <div className="text-[10px] tabular-nums text-text-muted">
                {fmtNum(d.total_kcal)} kcal
              </div>
            </button>
          );
        })}
      </div>

      {/* Active day */}
      {day && (
        <>
          {/* Day totals card */}
          <div className="mb-4 p-5 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand-100 text-xs font-medium">
                <Flame className="w-3.5 h-3.5" />
                Plan total hari {day.day}
              </div>
              <div className="text-[10px] text-brand-100 inline-flex items-center gap-1">
                <Target className="w-3 h-3" /> target{" "}
                {fmtNum(plan.targets.target_kcal)}
              </div>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums">
                {fmtNum(day.total_kcal)}
              </span>
              <span className="text-brand-100 text-sm">kcal</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <Macro label="Protein" value={day.total_protein_g} unit="g" />
              <Macro label="Lemak" value={day.total_fat_g} unit="g" />
              <Macro label="Karbo" value={day.total_carb_g} unit="g" />
            </div>
            {day.est_cost_idr ? (
              <div className="mt-3 pt-3 border-t border-white/20 text-xs text-brand-100">
                Est. biaya hari ini: Rp{" "}
                {day.est_cost_idr.toLocaleString("id-ID")}
              </div>
            ) : null}
          </div>

          {/* Apply day button */}
          <button
            onClick={() => handleLogDay(activeDayIdx)}
            disabled={appliedDayIdx === activeDayIdx}
            className={cn(
              "w-full mb-5 px-4 py-3 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all",
              appliedDayIdx === activeDayIdx
                ? "bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 cursor-default"
                : "bg-fg text-bg hover:-translate-y-0.5 shadow-md",
            )}
          >
            {appliedDayIdx === activeDayIdx ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Udah di-log ke catatan
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Log seluruh hari ke catatan
              </>
            )}
          </button>

          {/* Meals */}
          <div className="space-y-3">
            {day.meals.map((meal, mi) => {
              const slot = normalizeSlot(meal.slot);
              return (
                <MealCard
                  key={`${activeDayIdx}-${mi}`}
                  meal={meal}
                  slot={slot}
                  targetKcal={
                    plan.targets.target_kcal
                      ? Math.round(
                          plan.targets.target_kcal / day.meals.length,
                        )
                      : null
                  }
                  onLog={() => handleLogMeal(activeDayIdx, meal)}
                  onAddItem={() =>
                    setEditTarget({
                      dayIdx: activeDayIdx,
                      mealIdx: mi,
                      slotLabel: meal.slot,
                      slotEnum: slot,
                    })
                  }
                  onRemoveItem={(itemIdx) =>
                    handleRemoveItem(activeDayIdx, mi, itemIdx)
                  }
                />
              );
            })}
          </div>
        </>
      )}

      {/* Summary notes */}
      {plan.plan.summary?.notes && plan.plan.summary.notes.length > 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-surface border border-border">
          <div className="text-xs font-bold uppercase tracking-wide text-text-muted mb-2 inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-brand-600" /> Catatan plan
          </div>
          <ul className="space-y-1">
            {plan.plan.summary.notes.map((n, i) => (
              <li key={i} className="text-sm leading-relaxed">
                • {n}
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-text-muted">Avg kcal</div>
              <div className="font-bold tabular-nums">
                {fmtNum(plan.plan.summary.avg_kcal)}
              </div>
            </div>
            <div>
              <div className="text-text-muted">Avg protein</div>
              <div className="font-bold tabular-nums">
                {plan.plan.summary.avg_protein_g}g
              </div>
            </div>
            {plan.plan.summary.avg_cost_idr ? (
              <div>
                <div className="text-text-muted">Avg biaya</div>
                <div className="font-bold tabular-nums">
                  Rp {plan.plan.summary.avg_cost_idr.toLocaleString("id-ID")}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Shopping list collapsible */}
      {plan.plan.shopping_list && plan.plan.shopping_list.length > 0 && (
        <div className="mt-3 rounded-2xl bg-surface border border-border">
          <button
            onClick={() => setShowShoppingList((v) => !v)}
            className="w-full p-4 flex items-center justify-between hover:bg-surface-muted rounded-2xl"
          >
            <div className="inline-flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-600" />
              <span className="font-semibold text-sm">
                Shopping list ({plan.plan.shopping_list.length} item)
              </span>
            </div>
            {showShoppingList ? (
              <ChevronUp className="w-4 h-4 text-text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            )}
          </button>
          {showShoppingList && (
            <div className="px-4 pb-4">
              <ul className="space-y-1.5 text-sm">
                {plan.plan.shopping_list.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-baseline justify-between gap-3 py-1 border-b border-border/50 last:border-0"
                  >
                    <span className="flex-1">{s.item}</span>
                    <span className="text-text-muted tabular-nums text-xs">
                      {s.total_g_or_unit}
                    </span>
                    {s.est_price_idr ? (
                      <span className="text-text-muted tabular-nums text-xs">
                        Rp {s.est_price_idr.toLocaleString("id-ID")}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Hint */}
      <div className="mt-6 p-4 rounded-2xl bg-brand-50/40 dark:bg-brand-500/10 border border-brand-200/50 dark:border-brand-500/20 text-xs text-brand-700/80 dark:text-brand-200 leading-relaxed">
        <Sparkles className="w-3 h-3 inline mr-1" />
        Plan ini rekomendasi — bukan paksaan. Realisasi makan kamu di-track di{" "}
        <Link href="/log" className="underline font-semibold">
          /log
        </Link>
        . Klik <strong>Log</strong> kalo bener makan sesuai plan, atau add
        manual di /log kalo makan beda.
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
                Generate plan ulang
              </h2>
              <button
                onClick={() => setShowConfig(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface-muted text-text-muted inline-flex items-center justify-center text-xl leading-none"
                aria-label="Tutup"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ConfigForm
                days={days}
                mealsPerDay={mealsPerDay}
                contextNotes={contextNotes}
                onDaysChange={setDays}
                onMealsPerDayChange={setMealsPerDay}
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
                Generate baru (ganti plan ini)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add item modal (plan edit) — reuse AddFoodModal with slot fixed */}
      <AddFoodModal
        open={editTarget !== null}
        defaultSlot={editTarget?.slotEnum ?? "sarapan"}
        defaultMode="search"
        hideSlotPicker
        hidePhotoMode
        title={
          editTarget
            ? `Tambah ke ${
                editTarget.slotEnum
                  ? MEAL_SLOT_LABEL[editTarget.slotEnum]
                  : editTarget.slotLabel
              }`
            : "Tambah item"
        }
        onClose={() => setEditTarget(null)}
        onAdd={(data) => {
          if (!editTarget) return;
          // Convert /log modal output to MealItem; require macros (default 0 if missing)
          const item: MealItem = {
            food_code: data.food_code ?? `manual-${Date.now()}`,
            food_name: data.food_name,
            portion_g: data.portion_g,
            kcal: data.kcal,
            protein_g: data.protein_g ?? 0,
            fat_g: data.fat_g ?? 0,
            carb_g: data.carb_g ?? 0,
          };
          handleAddItem(editTarget.dayIdx, editTarget.mealIdx, item);
          setEditTarget(null);
        }}
      />
    </div>
  );
}

function PageHero() {
  return (
    <div className="text-center mb-6">
      <div className="inline-flex w-14 h-14 rounded-2xl bg-brand-500/15 text-brand-600 items-center justify-center mb-3">
        <Sparkles className="w-7 h-7" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Meal Plan</h1>
      <p className="mt-2 text-text-muted leading-relaxed">
        AI compose rencana makan personalized dari profil kamu, kondisi medis,
        alergi, target kalori, dan harga PIHPS lokal.
      </p>
    </div>
  );
}

function ConfigForm({
  days,
  mealsPerDay,
  contextNotes,
  onDaysChange,
  onMealsPerDayChange,
  onContextNotesChange,
  profile,
  compact = false,
}: {
  days: number;
  mealsPerDay: number;
  contextNotes: string;
  onDaysChange: (v: number) => void;
  onMealsPerDayChange: (v: number) => void;
  onContextNotesChange: (v: string) => void;
  profile: UserProfile | null;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-4", !compact && "mt-2")}>
      <div>
        <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-2 block">
          Berapa hari? ({days})
        </label>
        <input
          type="range"
          min={1}
          max={7}
          step={1}
          value={days}
          onChange={(e) => onDaysChange(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
        <div className="flex justify-between text-[10px] text-text-muted mt-1 tabular-nums">
          <span>1</span>
          <span>3</span>
          <span>5</span>
          <span>7 hari</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-2 block">
          Berapa meal/hari?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[3, 4].map((m) => (
            <button
              key={m}
              onClick={() => onMealsPerDayChange(m)}
              className={cn(
                "px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors",
                mealsPerDay === m
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
                  : "border-border hover:border-fg/20",
              )}
            >
              {m === 3 ? "3 meal (basic)" : "4 meal (+ snack)"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold tracking-wide uppercase text-text-muted mb-2 block">
          Catatan konteks (opsional)
        </label>
        <textarea
          value={contextNotes}
          onChange={(e) => onContextNotesChange(e.target.value)}
          placeholder="contoh: minggu ini puasa, atau ada kondangan Sabtu malam"
          rows={2}
          className="w-full px-3 py-2 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 text-sm resize-none"
        />
      </div>

      {profile && (
        <div className="p-3 rounded-xl bg-surface-muted text-xs leading-relaxed">
          <div className="font-semibold text-text-muted uppercase tracking-wide text-[10px] mb-1">
            Plan akan pakai dari profil:
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span>
              <span className="text-text-muted">Goal:</span>{" "}
              <span className="font-semibold">{profile.goal}</span>
            </span>
            <span>
              <span className="text-text-muted">Diet:</span>{" "}
              <span className="font-semibold">
                {profile.diet_method ?? "standard"}
              </span>
            </span>
            {profile.budget_idr_per_day ? (
              <span>
                <span className="text-text-muted">Budget:</span>{" "}
                <span className="font-semibold">
                  Rp{" "}
                  {profile.budget_idr_per_day.toLocaleString("id-ID")}/hari
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
            {profile.food_allergies &&
            profile.food_allergies.filter((a) => a !== "lain").length > 0 ? (
              <span className="col-span-2">
                <span className="text-text-muted">Alergi:</span>{" "}
                <span className="font-semibold">
                  {profile.food_allergies
                    .filter((a) => a !== "lain")
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

function MealCard({
  meal,
  slot,
  targetKcal,
  onLog,
  onAddItem,
  onRemoveItem,
}: {
  meal: Meal;
  slot: MealSlot | null;
  targetKcal: number | null;
  onLog: () => void;
  onAddItem: () => void;
  onRemoveItem: (itemIdx: number) => void;
}) {
  const [logged, setLogged] = useState(false);
  const slotLabel = slot
    ? `${MEAL_SLOT_EMOJI[slot]} ${MEAL_SLOT_LABEL[slot]}`
    : meal.slot;
  const isEmpty = meal.items.length === 0;
  return (
    <div className="p-4 rounded-2xl bg-surface border border-border">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-semibold tracking-tight">{slotLabel}</div>
          <div className="text-xs text-text-muted tabular-nums">
            {fmtNum(meal.total_kcal)} kcal · P{meal.total_protein_g}g
            {targetKcal && (
              <span className="text-text-muted/70">
                {" "}
                · target ~{fmtNum(targetKcal)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            if (logged || isEmpty) return;
            onLog();
            setLogged(true);
          }}
          disabled={logged || isEmpty}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 flex-shrink-0",
            isEmpty
              ? "bg-surface-muted text-text-muted/50 cursor-not-allowed"
              : logged
                ? "bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 cursor-default"
                : "bg-fg/5 hover:bg-fg/10 text-fg",
          )}
          title={
            isEmpty
              ? "Tambah item dulu"
              : logged
                ? "Udah di-log"
                : "Log meal ini ke catatan harian"
          }
        >
          {logged ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> dilog
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> Log meal
            </>
          )}
        </button>
      </div>
      {meal.items.length > 0 ? (
        <ul className="space-y-1">
          {meal.items.map((item: MealItem, i: number) => (
            <li
              key={i}
              className="group flex items-baseline gap-2 text-sm py-1 px-2 -mx-2 rounded hover:bg-surface-muted/60"
            >
              <span className="flex-1 min-w-0 truncate">{item.food_name}</span>
              <span className="text-text-muted tabular-nums text-xs flex-shrink-0">
                {item.portion_g}g · {fmtNum(item.kcal)} kcal
              </span>
              <button
                onClick={() => {
                  if (confirm(`Hapus "${item.food_name}" dari plan?`)) {
                    onRemoveItem(i);
                  }
                }}
                className="w-6 h-6 rounded text-text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                aria-label="Hapus item"
                title="Hapus dari plan"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-xs text-text-muted text-center py-2">
          Belum ada item.
        </div>
      )}
      <button
        onClick={onAddItem}
        className="mt-2 w-full py-2 rounded-lg border-2 border-dashed border-border hover:border-brand-300 hover:bg-brand-50/40 dark:hover:bg-brand-500/10 text-xs text-text-muted hover:text-brand-600 font-semibold transition-colors inline-flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3 h-3" /> Tambah item
      </button>
      {meal.notes && (
        <p className="mt-2 pt-2 border-t border-border/50 text-xs text-text-muted italic leading-snug">
          {meal.notes}
        </p>
      )}
    </div>
  );
}
