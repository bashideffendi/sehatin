"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  ShoppingBag,
  Store,
  RotateCcw,
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
  MEAL_SLOT_DEFAULT_HOUR,
  type MealSlot,
} from "@/lib/food-log";
import { calculateTargets } from "@/src/nutrition/tdee";
import { AddFoodModal } from "@/components/add-food-modal";
import { Card, Kicker, Btn, Pill } from "@/components/ui";
import { DemoButton } from "@/components/demo-button";
import { fmtKcal, rupiah, rupiahShort } from "@/lib/format";
import { cn } from "@/lib/utils";

const REQUIRED_FIELDS: (keyof UserProfile)[] = [
  "age",
  "sex",
  "weight_kg",
  "height_cm",
  "activity",
  "goal",
];

const DIET_LABEL_MAP: Record<string, string> = {
  standard: "Standard",
  keto: "Keto",
  low_carb: "Low carb",
  high_protein: "High protein",
  mediterranean: "Mediterranean",
  dash: "DASH",
  plant_based: "Plant-based",
  vegetarian: "Vegetarian",
  low_gi: "Low GI",
  low_purine: "Low purine",
  ramadan: "Ramadan",
  if_general: "IF 16:8",
};

const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

// Warteg / alternative ideas for the day sidebar (static for now — could be wired to PIHPS proximity later)
const ALTERNATIF_WARTEG = [
  { name: "Warteg Berkah", sub: "Soto + nasi · 540 kcal", price: 17000 },
  { name: "Padang Sederhana", sub: "Ayam pop + sayur · 580 kcal", price: 18000 },
  { name: "Ayam Geprek", sub: "Set komplit + telur · 720 kcal", price: 22000 },
];

type ActiveTab = "makanan" | "workout" | "belanja";

export default function PlanPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activePlan, setActivePlan] = useState<StoredMealPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>("makanan");
  const [showConfig, setShowConfig] = useState(false);
  const [appliedDayIdx, setAppliedDayIdx] = useState<number | null>(null);

  // Config form
  const [days, setDays] = useState(7);
  const [mealsPerDay, setMealsPerDay] = useState(5);
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

  const handleAddItem = useCallback(
    (dayIdx: number, mealIdx: number, item: MealItem) => {
      setActivePlan((cur) => {
        if (!cur) return cur;
        const nextPlan = addItemToMeal(cur.plan, dayIdx, mealIdx, item);
        const updated: StoredMealPlan = { ...cur, plan: nextPlan };
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
          <div className="inline-flex w-14 h-14 rounded-2xl bg-forest-50 text-forest items-center justify-center mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Plan{" "}
            <span
              className="font-normal italic text-clay"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              kamu.
            </span>
          </h1>
          <p className="mt-2 text-muted leading-relaxed">
            AI compose rencana makan personalized dari profil + harga PIHPS +
            kondisi medis kamu.
          </p>
        </div>
        <Card surface="surface-2" radius="lg" className="p-5">
          <div className="inline-flex items-center gap-2 text-clay font-semibold mb-2">
            <AlertCircle className="w-5 h-5" /> Setup profil dulu
          </div>
          <p className="text-sm leading-relaxed text-ink-2">
            Buat generate plan personalized, kita perlu{" "}
            <span className="font-semibold">{missingFields.length} field</span>{" "}
            lagi: {missingFields.join(", ")}.
          </p>
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Link href="/onboarding" className="inline-block">
              <Btn variant="clay" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Lengkapi profil
              </Btn>
            </Link>
            <DemoButton size="sm" variant="ghost" redirectTo="/plan" label="Load demo" />
          </div>
        </Card>
      </div>
    );
  }

  // ============ Render: no plan yet ============

  if (!activePlan && !generating) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <PageHero />
        <Card radius="lg" className="p-5 sm:p-6 mt-4">
          <ConfigForm
            days={days}
            mealsPerDay={mealsPerDay}
            contextNotes={contextNotes}
            onDaysChange={setDays}
            onMealsPerDayChange={setMealsPerDay}
            onContextNotesChange={setContextNotes}
            profile={profile}
          />
        </Card>
        {error && (
          <Card surface="surface-2" radius="md" shadow="none" className="mt-3 p-3 border-rose/30">
            <p className="text-rose text-sm">{error}</p>
          </Card>
        )}
        <button
          onClick={handleGenerate}
          className="mt-6 w-full px-6 py-4 rounded-full font-bold bg-forest text-paper hover:bg-forest-700 transition-colors inline-flex items-center justify-center gap-2 shadow-[var(--shadow-forest)]"
        >
          <Sparkles className="w-5 h-5" />
          Generate plan dengan AI
        </button>
        <p className="mt-3 text-[11px] text-muted text-center leading-relaxed">
          AI compose plan berdasar profil + kondisi medis + alergi + budget PIHPS.
          Estimasi: 30-60 detik.
        </p>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-hairline" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold text-muted">
            <span className="px-3 bg-paper">atau</span>
          </div>
        </div>

        <button
          onClick={() => handleCreateBlankPlan(days, mealsPerDay)}
          className="mt-4 w-full px-6 py-3 rounded-full font-semibold border border-hairline-2 hover:border-forest hover:bg-forest-50 inline-flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Bikin plan manual ({days} hari × {mealsPerDay} meal kosong)
        </button>

        <div className="mt-6 text-center">
          <DemoButton size="sm" variant="ghost" redirectTo="/plan" label="Atau pakai demo plan" />
        </div>
      </div>
    );
  }

  // ============ Render: generating ============

  if (generating) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-forest-50 text-forest items-center justify-center mb-4">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Lagi compose{" "}
          <span
            className="font-normal italic text-clay"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            plan
          </span>{" "}
          kamu...
        </h1>
        <p className="mt-2 text-muted">
          AI lagi seleksi bahan dari 2.015 makanan, cek harga PIHPS, dan susun{" "}
          {days} hari × {mealsPerDay} meal.
        </p>
        <p className="mt-1 text-xs text-muted">
          Biasanya 30-60 detik. Jangan refresh ya.
        </p>
      </div>
    );
  }

  // ============ Render: active plan view ============

  if (!activePlan) return null;
  const plan = activePlan;
  const day = plan.plan.days[activeDayIdx];
  const dietLabel =
    plan.diet_method && DIET_LABEL_MAP[plan.diet_method]
      ? DIET_LABEL_MAP[plan.diet_method]
      : "Standard";

  const budgetPerDay = plan.budget_idr_per_day;
  const halal = profile?.preferences?.halal !== false ? "halal-default" : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 pb-12">
      {/* ============ Header ============ */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="min-w-0">
          <Kicker>Plan · minggu ini</Kicker>
          <h1 className="mt-1.5 text-[34px] sm:text-[44px] font-extrabold tracking-tight leading-[1.05]">
            {dietLabel}{" "}
            <span className="text-clay font-extrabold">+</span>{" "}
            <span
              className="italic text-clay font-normal whitespace-nowrap"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "0.78em",
              }}
            >
              warteg.
            </span>
          </h1>
          <p className="mt-2 text-[12.5px] text-muted tabular">
            {budgetPerDay ? `${rupiahShort(budgetPerDay)}/hari · ` : ""}
            {plan.targets.target_kcal} kcal/hari
            {halal ? ` · ${halal}` : ""}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <Btn variant="surface" size="sm" icon={<SlidersHorizontal className="w-3.5 h-3.5" />}>
            Filter
          </Btn>
          <button
            onClick={() => setShowConfig(true)}
            className="inline-flex"
          >
            <Btn variant="surface" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Ganti diet
            </Btn>
          </button>
          <button onClick={() => setShowConfig(true)} className="inline-flex">
            <Btn variant="primary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Re-roll minggu
            </Btn>
          </button>
          <button
            onClick={handleClearPlan}
            className="w-8 h-8 rounded-full border border-hairline hover:border-rose hover:text-rose text-muted flex items-center justify-center"
            title="Hapus plan"
            aria-label="Hapus plan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ============ Tab switcher ============ */}
      <div className="inline-flex p-1 bg-surface-2 rounded-full border border-hairline mb-5">
        <TabButton
          active={activeTab === "makanan"}
          onClick={() => setActiveTab("makanan")}
        >
          Makanan
        </TabButton>
        <TabButton
          active={activeTab === "workout"}
          onClick={() => setActiveTab("workout")}
        >
          Workout · W2/4
        </TabButton>
        <TabButton
          active={activeTab === "belanja"}
          onClick={() => setActiveTab("belanja")}
        >
          Belanja
        </TabButton>
      </div>

      {/* ============ Day strip ============ */}
      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {plan.plan.days.map((d, i) => {
          const dateIso = shiftISODate(plan.start_date, i);
          const isToday = dateIso === todayISO();
          const isActive = i === activeDayIdx;
          const dayDate = new Date(`${dateIso}T00:00:00`);
          const dayName = DAY_SHORT[dayDate.getDay()];
          const dayNum = dayDate.getDate();
          return (
            <button
              key={i}
              onClick={() => {
                setActiveDayIdx(i);
                setAppliedDayIdx(null);
              }}
              className={cn(
                "rounded-[14px] border px-3 py-3 text-left transition-all",
                isActive
                  ? "bg-forest text-paper border-forest shadow-[var(--shadow-forest)]"
                  : "bg-surface border-hairline hover:border-hairline-2",
              )}
            >
              <div
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isActive ? "text-paper/70" : "text-muted",
                )}
              >
                {dayName}
              </div>
              <div
                className="tabular leading-none mt-1"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 22,
                }}
              >
                {dayNum}
              </div>
              <div
                className={cn(
                  "text-[10.5px] mt-1 tabular flex items-baseline gap-1",
                  isActive ? "text-paper/75" : "text-muted",
                )}
              >
                <span>{d.total_kcal > 0 ? `${(d.total_kcal / 1000).toFixed(1)}k` : "—"}</span>
                {isToday && (
                  <span
                    className={cn(
                      "text-[8.5px] font-bold uppercase tracking-wider",
                      isActive ? "text-paper" : "text-forest",
                    )}
                  >
                    ini
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ============ Tab: Makanan (2-col layout) ============ */}
      {activeTab === "makanan" && day && (
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-4">
          {/* ===== LEFT: Day meal list ===== */}
          <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6">
            <DayHeader
              dateIso={shiftISODate(plan.start_date, activeDayIdx)}
              mealCount={day.meals.filter((m) => m.items.length > 0).length}
              totalKcal={day.total_kcal}
              totalCost={day.est_cost_idr}
            />

            <div className="mt-5 space-y-3">
              {day.meals.map((meal, mi) => {
                const slot = normalizeSlot(meal.slot);
                return (
                  <MealRow
                    key={`${activeDayIdx}-${mi}`}
                    meal={meal}
                    slot={slot}
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
          </Card>

          {/* ===== RIGHT: Sidebar ===== */}
          <div className="space-y-4">
            {/* Ringkasan hari */}
            <Card radius="lg" shadow="paper-1" className="p-5">
              <Kicker>Ringkasan hari</Kicker>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <SidebarStat
                  label="Kalori"
                  value={fmtKcal(day.total_kcal)}
                  unit="kcal"
                />
                <SidebarStat
                  label="Biaya"
                  prefix="Rp "
                  value={
                    day.est_cost_idr
                      ? `${Math.round(day.est_cost_idr / 1000)}rb`
                      : "—"
                  }
                />
                <SidebarStat
                  label="Protein"
                  value={`${day.total_protein_g}`}
                  unit="g"
                />
                <SidebarStat label="Serat" value="34" unit="g" />
              </div>
              {plan.targets.target_kcal && (
                <p className="mt-3 text-[11px] text-muted leading-relaxed">
                  Profile defisit kalori{" "}
                  <span className="font-bold text-clay">
                    {Math.round(day.total_kcal - plan.targets.target_kcal)} kcal
                  </span>{" "}
                  dari target — match target loss{" "}
                  <span className="font-semibold text-ink">0,5 kg/minggu</span>.
                </p>
              )}
            </Card>

            {/* Belanja minggu ini */}
            {plan.plan.shopping_list && plan.plan.shopping_list.length > 0 && (
              <Card
                surface="surface-2"
                radius="lg"
                shadow="paper-1"
                className="p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-forest-50 text-forest">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="font-bold text-[14px]">Belanja minggu ini</div>
                    <div className="text-[10.5px] text-muted">
                      {plan.plan.shopping_list.length} item
                      {plan.plan.shopping_list.some((s) => s.est_price_idr) && (
                        <>
                          {" · "}
                          <span className="tabular">
                            {rupiah(
                              plan.plan.shopping_list.reduce(
                                (s, item) => s + (item.est_price_idr ?? 0),
                                0,
                              ),
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <ul className="space-y-1 text-[12px]">
                  {plan.plan.shopping_list.slice(0, 4).map((s, i) => (
                    <li
                      key={i}
                      className="flex items-baseline justify-between gap-2 py-1"
                    >
                      <span className="flex-1 truncate">
                        {s.item} {s.total_g_or_unit}
                      </span>
                      <span className="text-muted tabular text-[11px]">
                        {s.est_price_idr ? rupiah(s.est_price_idr) : "Rp—"}
                      </span>
                    </li>
                  ))}
                  {plan.plan.shopping_list.length > 4 && (
                    <li className="text-[11px] text-muted pt-1">
                      +{plan.plan.shopping_list.length - 4} item lain
                    </li>
                  )}
                </ul>
                <button
                  onClick={() => setActiveTab("belanja")}
                  className="mt-4 w-full py-2.5 rounded-full bg-forest text-paper font-semibold text-[12px] hover:bg-forest-700 transition-colors"
                >
                  Buka shopping list
                </button>
              </Card>
            )}

            {/* Alternatif warteg dekat */}
            <Card radius="lg" shadow="paper-1" className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Store className="w-3.5 h-3.5 text-clay" />
                <Kicker>Alternatif warteg dekat</Kicker>
              </div>
              <ul className="space-y-2.5">
                {ALTERNATIF_WARTEG.map((w, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 py-2 px-3 rounded-[12px] bg-surface-2 border border-hairline"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-[12.5px] truncate">{w.name}</div>
                      <div className="text-[10.5px] text-muted truncate">{w.sub}</div>
                    </div>
                    <span className="text-[12px] font-semibold tabular text-ink flex-shrink-0">
                      {rupiah(w.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* ============ Tab: Workout ============ */}
      {activeTab === "workout" && (
        <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6">
          <div className="text-center py-10">
            <Kicker>Workout · minggu 2 dari 4</Kicker>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
              Lanjut ke{" "}
              <Link href="/workout">
                <span
                  className="italic text-forest underline-offset-4 hover:underline cursor-pointer"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  Workout page
                </span>
              </Link>
            </h2>
            <p className="mt-2 text-muted text-[13px]">
              Buat lihat split + sesi minggu ini.
            </p>
          </div>
        </Card>
      )}

      {/* ============ Tab: Belanja ============ */}
      {activeTab === "belanja" && plan.plan.shopping_list && (
        <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <Kicker>Shopping list</Kicker>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight">
                {plan.plan.shopping_list.length}{" "}
                <span
                  className="italic text-clay font-normal"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  item
                </span>
              </h2>
            </div>
            <div className="text-right tabular">
              <div className="text-[10px] font-bold uppercase text-muted">Total</div>
              <div
                className="leading-none"
                style={{ fontFamily: "var(--font-serif)", fontSize: 24 }}
              >
                {rupiah(
                  plan.plan.shopping_list.reduce(
                    (s, item) => s + (item.est_price_idr ?? 0),
                    0,
                  ),
                )}
              </div>
            </div>
          </div>
          <ul className="divide-y divide-hairline">
            {plan.plan.shopping_list.map((s, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-3 py-2.5"
              >
                <span className="flex-1 text-[13px]">{s.item}</span>
                <span className="text-muted tabular text-[11.5px] w-20 text-right">
                  {s.total_g_or_unit}
                </span>
                <span className="text-[12.5px] font-semibold tabular w-24 text-right">
                  {s.est_price_idr ? rupiah(s.est_price_idr) : "—"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ============ Regenerate modal ============ */}
      {showConfig && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setShowConfig(false)}
        >
          <div
            className="w-full sm:max-w-md bg-surface rounded-t-[28px] sm:rounded-[28px] shadow-[var(--shadow-paper-3)] max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-hairline flex items-center justify-between">
              <div>
                <Kicker>Re-roll plan</Kicker>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight">
                  Generate{" "}
                  <span
                    className="italic text-forest font-normal"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    ulang
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-2 text-muted inline-flex items-center justify-center text-xl leading-none"
                aria-label="Tutup"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
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
                <Card surface="surface-2" radius="md" shadow="none" className="mt-3 p-3 border-rose/30">
                  <p className="text-rose text-sm">{error}</p>
                </Card>
              )}
            </div>
            <div className="p-5 border-t border-hairline">
              <button
                onClick={handleGenerate}
                className="w-full px-6 py-3 rounded-full font-bold bg-forest text-paper hover:bg-forest-700 transition-colors inline-flex items-center justify-center gap-2 shadow-[var(--shadow-forest)]"
              >
                <Sparkles className="w-4 h-4" />
                Generate baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ Add item modal ============ */}
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

// ============ Sub-components ============

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full font-semibold text-[12.5px] transition-colors",
        active
          ? "bg-paper text-ink shadow-[var(--shadow-paper-1)]"
          : "text-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function DayHeader({
  dateIso,
  mealCount,
  totalKcal,
  totalCost,
}: {
  dateIso: string;
  mealCount: number;
  totalKcal: number;
  totalCost?: number;
}) {
  const d = new Date(`${dateIso}T00:00:00`);
  const dayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][d.getDay()];
  const dayNum = d.getDate();
  const monthName = MONTH_SHORT[d.getMonth()];
  return (
    <div className="flex items-baseline justify-between gap-3 flex-wrap">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">
          {dayName} ·{" "}
          <span
            className="italic text-forest font-normal"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {dayNum}
          </span>
        </h2>
        <div className="text-[11px] text-muted tabular mt-0.5">{monthName}</div>
      </div>
      <Pill tone="forest" size="md">
        {mealCount} meal · {fmtKcal(totalKcal)} kcal
        {totalCost ? ` · ${rupiah(totalCost)}` : ""}
      </Pill>
    </div>
  );
}

function MealRow({
  meal,
  slot,
  onLog,
  onAddItem,
  onRemoveItem,
}: {
  meal: Meal;
  slot: MealSlot | null;
  onLog: () => void;
  onAddItem: () => void;
  onRemoveItem: (itemIdx: number) => void;
}) {
  const [logged, setLogged] = useState(false);
  const slotLabel = slot ? MEAL_SLOT_LABEL[slot].toUpperCase() : meal.slot.toUpperCase();
  const emoji = slot ? MEAL_SLOT_EMOJI[slot] : "🍽️";
  const hour = slot ? MEAL_SLOT_DEFAULT_HOUR[slot] : 12;
  const timeStr = `${String(hour).padStart(2, "0")}:00`;
  const isEmpty = meal.items.length === 0;

  if (isEmpty) {
    return (
      <button
        onClick={onAddItem}
        className="w-full text-left py-3 px-4 rounded-[14px] border border-dashed border-hairline-2 hover:border-forest hover:bg-forest-50/40 text-muted hover:text-forest transition-colors inline-flex items-center gap-2 text-[12.5px]"
      >
        <Plus className="w-3.5 h-3.5" /> Tambah ke {slotLabel.toLowerCase()}
      </button>
    );
  }

  // Display first item as the headline, rest as subtitle items
  const head = meal.items[0];
  const restCount = meal.items.length - 1;
  // Sub: if multiple items, list ADDITIONAL items (after first). If single, show portion + source hint.
  const subText =
    meal.items.length > 1
      ? meal.items
          .slice(1)
          .map((it) => it.food_name)
          .join(" · ")
      : `${head.portion_g}g · 1 porsi`;

  return (
    <div className="group relative pl-2 py-2 rounded-[14px] hover:bg-surface-2/60 transition-colors">
      <div className="flex items-start gap-3">
        {/* Time + slot */}
        <div className="w-[78px] pt-0.5 flex-shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {slotLabel}
          </div>
          <div className="text-[10.5px] tabular text-muted/80 mt-0.5">{timeStr}</div>
        </div>

        {/* Emoji */}
        <span className="text-xl flex-shrink-0 mt-0.5">{emoji}</span>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[14px] tracking-tight">
            {head.food_name}
            {restCount > 0 && (
              <span className="text-muted font-normal"> +{restCount}</span>
            )}
          </div>
          <div className="text-[10.5px] text-muted truncate mt-0.5">
            {subText}
          </div>
          {(head.protein_g != null || head.fat_g != null || head.carb_g != null) && (
            <div className="text-[10px] text-muted/85 mt-1 tabular space-x-2">
              {head.protein_g != null && (
                <span>
                  <span className="font-semibold text-ink/70">{Math.round(meal.items.reduce((s, i) => s + i.protein_g, 0))}g</span>P
                </span>
              )}
              {head.fat_g != null && (
                <span>
                  <span className="font-semibold text-ink/70">{Math.round(meal.items.reduce((s, i) => s + i.fat_g, 0))}g</span>L
                </span>
              )}
              {head.carb_g != null && (
                <span>
                  <span className="font-semibold text-ink/70">{Math.round(meal.items.reduce((s, i) => s + i.carb_g, 0))}g</span>K
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: kcal + Rp + actions */}
        <div className="text-right flex-shrink-0">
          <div
            className="tabular leading-none"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 26,
            }}
          >
            {fmtKcal(meal.total_kcal)}
          </div>
          <div className="text-[10px] text-muted tabular mt-1">
            {/* per-meal cost not currently stored at Meal level */}
          </div>
        </div>

        {/* Re-roll icon */}
        <button
          onClick={() => {
            if (logged) return;
            onLog();
            setLogged(true);
          }}
          className="w-8 h-8 rounded-full border border-hairline hover:border-forest hover:text-forest text-muted flex items-center justify-center flex-shrink-0 transition-colors"
          title={logged ? "Udah dicatat" : "Catat meal ini ke harian"}
        >
          {logged ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-forest" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Hidden edit affordances appear on hover */}
      <div className="absolute right-2 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={onAddItem}
          className="w-6 h-6 rounded-md text-muted hover:text-forest hover:bg-forest-50 flex items-center justify-center"
          title="Tambah item"
          aria-label="Tambah item"
        >
          <Plus className="w-3 h-3" />
        </button>
        {meal.items.length > 0 && (
          <button
            onClick={() => {
              if (confirm(`Hapus "${meal.items[0].food_name}" dari plan?`)) {
                onRemoveItem(0);
              }
            }}
            className="w-6 h-6 rounded-md text-muted hover:text-rose hover:bg-rose-50 flex items-center justify-center"
            title="Hapus item pertama"
            aria-label="Hapus"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function SidebarStat({
  label,
  value,
  unit,
  prefix,
}: {
  label: string;
  value: string;
  unit?: string;
  prefix?: string;
}) {
  return (
    <div className="rounded-[12px] bg-surface-2 border border-hairline px-3 py-2.5">
      <Kicker>{label}</Kicker>
      <div className="mt-1 tabular leading-none flex items-baseline gap-1">
        {prefix && <span className="text-[11px] text-muted">{prefix}</span>}
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

function PageHero() {
  return (
    <div className="text-center mb-6">
      <Kicker>Meal plan AI</Kicker>
      <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
        Plan{" "}
        <span
          className="italic text-clay font-normal"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          minggu ini.
        </span>
      </h1>
      <p className="mt-2 text-muted leading-relaxed text-[13px]">
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
        <label className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted mb-2 block">
          Berapa hari? ({days})
        </label>
        <input
          type="range"
          min={1}
          max={7}
          step={1}
          value={days}
          onChange={(e) => onDaysChange(Number(e.target.value))}
          className="w-full accent-forest"
        />
        <div className="flex justify-between text-[10px] text-muted mt-1 tabular">
          <span>1</span>
          <span>3</span>
          <span>5</span>
          <span>7 hari</span>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted mb-2 block">
          Berapa meal/hari?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[3, 4, 5].map((m) => (
            <button
              key={m}
              onClick={() => onMealsPerDayChange(m)}
              className={cn(
                "px-3 py-2.5 rounded-[12px] border-2 text-[12.5px] font-semibold transition-colors",
                mealsPerDay === m
                  ? "border-forest bg-forest-50 text-forest"
                  : "border-hairline hover:border-hairline-2",
              )}
            >
              {m} meal
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted mb-2 block">
          Catatan konteks (opsional)
        </label>
        <textarea
          value={contextNotes}
          onChange={(e) => onContextNotesChange(e.target.value)}
          placeholder="cth: minggu ini puasa, atau ada kondangan Sabtu malam"
          rows={2}
          className="w-full px-3 py-2 rounded-[12px] border-2 border-hairline bg-surface focus:outline-none focus:border-forest text-[12.5px] resize-none"
        />
      </div>

      {profile && (
        <Card surface="surface-2" radius="md" shadow="none" className="p-3">
          <Kicker className="mb-2">Plan akan pakai</Kicker>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] leading-snug">
            <span>
              <span className="text-muted">Goal:</span>{" "}
              <span className="font-semibold">{profile.goal}</span>
            </span>
            <span>
              <span className="text-muted">Diet:</span>{" "}
              <span className="font-semibold">
                {profile.diet_method ?? "standard"}
              </span>
            </span>
            {profile.budget_idr_per_day ? (
              <span>
                <span className="text-muted">Budget:</span>{" "}
                <span className="font-semibold tabular">
                  {rupiah(profile.budget_idr_per_day)}/hari
                </span>
              </span>
            ) : null}
            {profile.medical_conditions &&
            profile.medical_conditions.filter((c) => c !== "tidak_ada").length >
              0 ? (
              <span className="col-span-2">
                <span className="text-muted">Medis:</span>{" "}
                <span className="font-semibold">
                  {profile.medical_conditions
                    .filter((c) => c !== "tidak_ada")
                    .join(", ")}
                </span>
              </span>
            ) : null}
            {profile.food_allergies && profile.food_allergies.length > 0 ? (
              <span className="col-span-2">
                <span className="text-muted">Alergi:</span>{" "}
                <span className="font-semibold">
                  {profile.food_allergies.join(", ")}
                </span>
              </span>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
}
