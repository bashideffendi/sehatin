"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calculator,
  Flame,
  Beef,
  Wheat,
  Droplet,
  ChevronLeft,
  Info,
} from "lucide-react";
import {
  calculateTargets,
  type ActivityLevel,
  type Goal,
  type NutritionTargets,
  type Sex,
} from "@/src/nutrition/tdee";
import { fmtNum } from "@/lib/utils";

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; sub: string }[] = [
  { value: "sedentary", label: "Sedentary", sub: "Kerja meja, gak olahraga" },
  { value: "light", label: "Light", sub: "Olahraga 1-3x/minggu" },
  { value: "moderate", label: "Moderate", sub: "Olahraga 3-5x/minggu" },
  { value: "active", label: "Active", sub: "Olahraga 6-7x/minggu" },
  { value: "very_active", label: "Very Active", sub: "Fisik berat + atlet" },
];

const GOAL_OPTIONS: { value: Goal; label: string; sub: string }[] = [
  { value: "fat_loss", label: "Fat Loss", sub: "Defisit 20%" },
  {
    value: "fat_loss_aggressive",
    label: "Fat Loss agresif",
    sub: "Defisit 25%",
  },
  { value: "recomp", label: "Recomp", sub: "Defisit 10% (body recomp)" },
  { value: "maintain", label: "Maintain", sub: "TDEE pas" },
  { value: "slow_gain", label: "Lean Bulk", sub: "Surplus 10%" },
  { value: "muscle_gain", label: "Muscle Gain", sub: "Surplus 15%" },
];

export default function TDEEPage() {
  const [age, setAge] = useState("30");
  const [sex, setSex] = useState<Sex>("m");
  const [weight, setWeight] = useState("75");
  const [height, setHeight] = useState("175");
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<Goal>("fat_loss");
  const [bf, setBf] = useState("");

  const result: NutritionTargets | null = useMemo(() => {
    const a = Number.parseInt(age, 10);
    const w = Number.parseFloat(weight);
    const h = Number.parseFloat(height);
    if (!a || !w || !h || a < 10 || a > 100 || w < 30 || h < 100) return null;
    const profile = {
      age: a,
      sex,
      weight_kg: w,
      height_cm: h,
      activity,
      goal,
      body_fat_pct: bf ? Number.parseFloat(bf) : undefined,
    };
    try {
      return calculateTargets(profile);
    } catch {
      return null;
    }
  }, [age, sex, weight, height, activity, goal, bf]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href="/tools"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-fg mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Semua tools
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            TDEE & Macro Calculator
          </h1>
          <p className="mt-1 text-text-muted">
            Mifflin-St Jeor formula. Hitung BMR, TDEE, target kalori, dan macro
            split.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ============ FORM ============ */}
        <section className="lg:col-span-2">
          <div className="p-6 rounded-2xl bg-surface border border-border space-y-5">
            <h2 className="font-semibold tracking-tight">Profil kamu</h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Usia" suffix="thn">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={inputCls}
                  min={10}
                  max={100}
                />
              </Field>

              <Field label="Jenis kelamin">
                <div className="grid grid-cols-2 gap-1 p-1 bg-surface-muted rounded-lg">
                  <SegBtn active={sex === "m"} onClick={() => setSex("m")}>
                    Pria
                  </SegBtn>
                  <SegBtn active={sex === "f"} onClick={() => setSex("f")}>
                    Wanita
                  </SegBtn>
                </div>
              </Field>

              <Field label="Berat" suffix="kg">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className={inputCls}
                  step="0.1"
                  min={30}
                />
              </Field>

              <Field label="Tinggi" suffix="cm">
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className={inputCls}
                  step="0.5"
                  min={100}
                />
              </Field>
            </div>

            <Field
              label="Level aktivitas"
              hint="Termasuk aktivitas kerja + olahraga"
            >
              <select
                value={activity}
                onChange={(e) => setActivity(e.target.value as ActivityLevel)}
                className={inputCls}
              >
                {ACTIVITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} — {o.sub}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Goal">
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as Goal)}
                className={inputCls}
              >
                {GOAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} ({o.sub})
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Body Fat % (opsional)"
              hint="Kalau tahu, protein dihitung dari lean mass"
              suffix="%"
            >
              <input
                type="number"
                value={bf}
                onChange={(e) => setBf(e.target.value)}
                placeholder="contoh: 18"
                className={inputCls}
                min={5}
                max={50}
                step="0.5"
              />
            </Field>
          </div>
        </section>

        {/* ============ RESULT ============ */}
        <section className="lg:col-span-3">
          {result ? (
            <div className="space-y-4">
              {/* Headline metric */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-600/20">
                <div className="flex items-center gap-2 text-brand-100 text-sm font-medium">
                  <Flame className="w-4 h-4" />
                  Target kalori harian
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-5xl font-bold tabular-nums">
                    {fmtNum(result.target_kcal)}
                  </span>
                  <span className="text-brand-100">kcal</span>
                </div>
                <div className="mt-2 text-sm text-brand-100">
                  {result.goal_adjustment_pct > 0 ? "+" : ""}
                  {result.goal_adjustment_pct.toFixed(0)}% vs TDEE ({fmtNum(result.tdee)} kcal)
                </div>
              </div>

              {/* BMR + TDEE secondary */}
              <div className="grid grid-cols-2 gap-4">
                <SecondaryStat
                  label="BMR"
                  value={fmtNum(result.bmr)}
                  unit="kcal"
                  hint="Basal metabolic rate"
                />
                <SecondaryStat
                  label="TDEE"
                  value={fmtNum(result.tdee)}
                  unit="kcal"
                  hint="Total daily energy expenditure"
                />
              </div>

              {/* Macros */}
              <div className="p-6 rounded-2xl bg-surface border border-border">
                <h3 className="font-semibold tracking-tight mb-4">
                  Macro split per hari
                </h3>
                <div className="space-y-3">
                  <MacroBar
                    label="Protein"
                    grams={result.protein_g}
                    kcal={result.protein_g * 4}
                    total={result.target_kcal}
                    icon={<Beef className="w-4 h-4" />}
                    color="bg-rose-500"
                  />
                  <MacroBar
                    label="Lemak"
                    grams={result.fat_g}
                    kcal={result.fat_g * 9}
                    total={result.target_kcal}
                    icon={<Droplet className="w-4 h-4" />}
                    color="bg-amber-500"
                  />
                  <MacroBar
                    label="Karbo"
                    grams={result.carb_g}
                    kcal={result.carb_g * 4}
                    total={result.target_kcal}
                    icon={<Wheat className="w-4 h-4" />}
                    color="bg-brand-500"
                  />
                </div>

                <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-sm">
                  <span className="text-text-muted">Serat minimum</span>
                  <span className="font-semibold tabular-nums">
                    {result.fiber_g_min}g
                  </span>
                </div>
              </div>

              {/* Notes */}
              {result.notes.length > 0 && (
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-accent-500/10 border border-accent-200 dark:border-accent-500/20">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-accent-600 mt-0.5 flex-shrink-0" />
                    <ul className="space-y-2 text-sm text-fg/80">
                      {result.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-surface border border-border text-center">
              <Calculator className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted">
                Isi profil lengkap untuk lihat hasil.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ============ Atoms ============
const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 tabular-nums";

function Field({
  label,
  hint,
  suffix,
  children,
}: {
  label: string;
  hint?: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center justify-between text-sm font-medium mb-1.5">
        <span>{label}</span>
        {suffix && <span className="text-xs text-text-muted">{suffix}</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-xs text-text-muted leading-snug">{hint}</p>
      )}
    </div>
  );
}

function SegBtn({
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
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        active
          ? "bg-surface text-fg shadow-sm"
          : "text-text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function SecondaryStat({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit: string;
  hint: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-surface border border-border">
      <div className="text-xs font-semibold text-text-muted tracking-wide uppercase">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums">{value}</span>
        <span className="text-sm text-text-muted">{unit}</span>
      </div>
      <p className="mt-1 text-xs text-text-muted">{hint}</p>
    </div>
  );
}

function MacroBar({
  label,
  grams,
  kcal,
  total,
  icon,
  color,
}: {
  label: string;
  grams: number;
  kcal: number;
  total: number;
  icon: React.ReactNode;
  color: string;
}) {
  const pct = (kcal / total) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="text-text-muted">{icon}</span>
          {label}
        </span>
        <span className="tabular-nums text-text-muted">
          <strong className="text-fg">{grams}g</strong> · {fmtNum(kcal)} kcal · {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 bg-surface-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
