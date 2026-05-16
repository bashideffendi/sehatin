"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  PieChart,
  Flame,
  Beef,
  Wheat,
  Droplet,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { fmtNum } from "@/lib/utils";

type Mode = "from_kcal" | "from_grams";

interface Preset {
  key: string;
  label: string;
  emoji: string;
  p: number;
  f: number;
  c: number;
  desc: string;
}

const PRESETS: Preset[] = [
  { key: "balanced", label: "Seimbang", emoji: "🥗", p: 30, f: 25, c: 45, desc: "Default, cocok buat maintenance" },
  { key: "fat_loss", label: "Fat Loss", emoji: "📉", p: 35, f: 25, c: 40, desc: "Protein tinggi buat preservasi otot" },
  { key: "muscle_gain", label: "Muscle Gain", emoji: "💪", p: 30, f: 25, c: 45, desc: "Karbo cukup buat performa angkat" },
  { key: "low_carb", label: "Low-Carb", emoji: "🥑", p: 30, f: 40, c: 30, desc: "Karbo 100-150g/hari" },
  { key: "keto", label: "Keto", emoji: "🥓", p: 25, f: 70, c: 5, desc: "Karbo <50g, fat dominan" },
  { key: "high_protein", label: "Tinggi Protein", emoji: "🍗", p: 40, f: 25, c: 35, desc: "Buat atlet / aggressive cut" },
  { key: "mediterranean", label: "Mediterania", emoji: "🐟", p: 20, f: 40, c: 40, desc: "Lemak baik dominan" },
];

export default function MacroPage() {
  const [mode, setMode] = useState<Mode>("from_kcal");

  // from_kcal inputs
  const [kcal, setKcal] = useState("2000");
  const [presetKey, setPresetKey] = useState<string>("balanced");
  const [customP, setCustomP] = useState("");
  const [customF, setCustomF] = useState("");
  const [customC, setCustomC] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  // from_grams inputs
  const [gP, setGP] = useState("130");
  const [gF, setGF] = useState("70");
  const [gC, setGC] = useState("250");

  const preset = PRESETS.find((p) => p.key === presetKey) ?? PRESETS[0]!;

  const split = useMemo(() => {
    if (!useCustom) return { p: preset.p, f: preset.f, c: preset.c };
    const p = Number.parseFloat(customP) || 0;
    const f = Number.parseFloat(customF) || 0;
    const c = Number.parseFloat(customC) || 0;
    const total = p + f + c;
    if (total === 0) return { p: 0, f: 0, c: 0 };
    return { p: (p / total) * 100, f: (f / total) * 100, c: (c / total) * 100 };
  }, [useCustom, customP, customF, customC, preset]);

  const fromKcal = useMemo(() => {
    const n = Number.parseFloat(kcal);
    if (!Number.isFinite(n) || n < 500) return null;
    const protein_g = Math.round(((n * split.p) / 100) / 4);
    const fat_g = Math.round(((n * split.f) / 100) / 9);
    const carb_g = Math.round(((n * split.c) / 100) / 4);
    return { protein_g, fat_g, carb_g };
  }, [kcal, split]);

  const fromGrams = useMemo(() => {
    const p = Number.parseFloat(gP) || 0;
    const f = Number.parseFloat(gF) || 0;
    const c = Number.parseFloat(gC) || 0;
    const pKcal = p * 4;
    const fKcal = f * 9;
    const cKcal = c * 4;
    const total = pKcal + fKcal + cKcal;
    if (total === 0) return null;
    return {
      protein_kcal: pKcal,
      fat_kcal: fKcal,
      carb_kcal: cKcal,
      total_kcal: total,
      p_pct: (pKcal / total) * 100,
      f_pct: (fKcal / total) * 100,
      c_pct: (cKcal / total) * 100,
    };
  }, [gP, gF, gC]);

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
          <PieChart className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Macronutrient Calculator
          </h1>
          <p className="mt-1 text-text-muted">
            Hitung protein/lemak/karbo dari kalori atau sebaliknya.
          </p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="mb-6">
        <div className="inline-flex p-1 bg-surface-muted rounded-xl">
          <button
            onClick={() => setMode("from_kcal")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "from_kcal"
                ? "bg-surface text-fg shadow-sm"
                : "text-text-muted hover:text-fg"
            }`}
          >
            Dari kalori → makro
          </button>
          <button
            onClick={() => setMode("from_grams")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === "from_grams"
                ? "bg-surface text-fg shadow-sm"
                : "text-text-muted hover:text-fg"
            }`}
          >
            Dari gram → kalori
          </button>
        </div>
      </div>

      {mode === "from_kcal" ? (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Input */}
          <section className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-2xl bg-surface border border-border space-y-5">
              <div>
                <label className="text-sm font-semibold tracking-tight block mb-2">
                  Target kalori harian
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={kcal}
                    onChange={(e) => setKcal(e.target.value)}
                    min={500}
                    max={6000}
                    step={50}
                    className="w-full px-4 py-3 pr-16 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-2xl font-bold tabular-nums"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-semibold">
                    kcal
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-text-muted">
                  Belum tahu? Coba{" "}
                  <Link
                    href="/tools/tdee"
                    className="text-brand-600 font-semibold underline-offset-2 hover:underline"
                  >
                    TDEE calculator
                  </Link>{" "}
                  dulu.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold tracking-tight">
                  Macro split
                </h3>
                <button
                  onClick={() => setUseCustom((v) => !v)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  {useCustom ? "Pakai preset" : "Custom %"}
                </button>
              </div>

              {!useCustom ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {PRESETS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => setPresetKey(p.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                        presetKey === p.key
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                          : "border-border hover:border-fg/20"
                      }`}
                    >
                      <span className="text-xl">{p.emoji}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold">
                          {p.label}
                        </span>
                        <span className="block text-xs text-text-muted tabular-nums">
                          P {p.p}% · F {p.f}% · C {p.c}%
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <CustomMacroInput
                    label="Protein"
                    color="text-rose-600"
                    value={customP}
                    onChange={setCustomP}
                    suffix="%"
                  />
                  <CustomMacroInput
                    label="Lemak"
                    color="text-amber-600"
                    value={customF}
                    onChange={setCustomF}
                    suffix="%"
                  />
                  <CustomMacroInput
                    label="Karbo"
                    color="text-brand-600"
                    value={customC}
                    onChange={setCustomC}
                    suffix="%"
                  />
                  <p className="text-xs text-text-muted">
                    Total {Math.round(split.p + split.f + split.c)}% (auto-normalize)
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Result */}
          <section className="lg:col-span-3 space-y-4">
            {fromKcal ? (
              <>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-600/20">
                  <div className="flex items-center gap-2 text-brand-100 text-sm font-medium">
                    <Flame className="w-4 h-4" />
                    {fmtNum(Number.parseFloat(kcal))} kcal/hari → makro
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <BigMacro
                      label="Protein"
                      g={fromKcal.protein_g}
                      pct={split.p}
                    />
                    <BigMacro label="Lemak" g={fromKcal.fat_g} pct={split.f} />
                    <BigMacro label="Karbo" g={fromKcal.carb_g} pct={split.c} />
                  </div>
                </div>

                {/* Donut visualization */}
                <div className="p-6 rounded-2xl bg-surface border border-border">
                  <h3 className="font-semibold tracking-tight mb-4">
                    Visualisasi distribusi
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <DonutChart
                      slices={[
                        { value: split.p, color: "#e11d48", label: "P" },
                        { value: split.f, color: "#f59e0b", label: "F" },
                        { value: split.c, color: "#10b981", label: "C" },
                      ]}
                    />
                    <div className="flex-1 space-y-3 w-full">
                      <MacroRow
                        icon={<Beef className="w-4 h-4" />}
                        label="Protein"
                        grams={fromKcal.protein_g}
                        kcal={fromKcal.protein_g * 4}
                        pct={split.p}
                        color="bg-rose-500"
                      />
                      <MacroRow
                        icon={<Droplet className="w-4 h-4" />}
                        label="Lemak"
                        grams={fromKcal.fat_g}
                        kcal={fromKcal.fat_g * 9}
                        pct={split.f}
                        color="bg-amber-500"
                      />
                      <MacroRow
                        icon={<Wheat className="w-4 h-4" />}
                        label="Karbo"
                        grams={fromKcal.carb_g}
                        kcal={fromKcal.carb_g * 4}
                        pct={split.c}
                        color="bg-brand-500"
                      />
                    </div>
                  </div>
                </div>

                <ConversionInfo />
              </>
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
      ) : (
        // from_grams mode
        <div className="grid lg:grid-cols-5 gap-6">
          <section className="lg:col-span-2 p-6 rounded-2xl bg-surface border border-border space-y-4">
            <h3 className="text-sm font-semibold tracking-tight">
              Input gram makro
            </h3>
            <CustomMacroInput
              label="Protein"
              color="text-rose-600"
              value={gP}
              onChange={setGP}
              suffix="g"
              big
            />
            <CustomMacroInput
              label="Lemak"
              color="text-amber-600"
              value={gF}
              onChange={setGF}
              suffix="g"
              big
            />
            <CustomMacroInput
              label="Karbo"
              color="text-brand-600"
              value={gC}
              onChange={setGC}
              suffix="g"
              big
            />
          </section>

          <section className="lg:col-span-3 space-y-4">
            {fromGrams ? (
              <>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-600/20">
                  <div className="flex items-center gap-2 text-brand-100 text-sm font-medium">
                    <Flame className="w-4 h-4" />
                    Total kalori
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-5xl font-bold tabular-nums">
                      {fmtNum(fromGrams.total_kcal)}
                    </span>
                    <span className="text-brand-100">kcal</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-surface border border-border">
                  <h3 className="font-semibold tracking-tight mb-4">
                    Breakdown
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <DonutChart
                      slices={[
                        {
                          value: fromGrams.p_pct,
                          color: "#e11d48",
                          label: "P",
                        },
                        {
                          value: fromGrams.f_pct,
                          color: "#f59e0b",
                          label: "F",
                        },
                        {
                          value: fromGrams.c_pct,
                          color: "#10b981",
                          label: "C",
                        },
                      ]}
                    />
                    <div className="flex-1 space-y-3 w-full">
                      <MacroRow
                        icon={<Beef className="w-4 h-4" />}
                        label="Protein"
                        grams={Number.parseFloat(gP) || 0}
                        kcal={fromGrams.protein_kcal}
                        pct={fromGrams.p_pct}
                        color="bg-rose-500"
                      />
                      <MacroRow
                        icon={<Droplet className="w-4 h-4" />}
                        label="Lemak"
                        grams={Number.parseFloat(gF) || 0}
                        kcal={fromGrams.fat_kcal}
                        pct={fromGrams.f_pct}
                        color="bg-amber-500"
                      />
                      <MacroRow
                        icon={<Wheat className="w-4 h-4" />}
                        label="Karbo"
                        grams={Number.parseFloat(gC) || 0}
                        kcal={fromGrams.carb_kcal}
                        pct={fromGrams.c_pct}
                        color="bg-brand-500"
                      />
                    </div>
                  </div>
                </div>

                <ConversionInfo />
              </>
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

// ============== Components ==============

function BigMacro({ label, g, pct }: { label: string; g: number; pct: number }) {
  return (
    <div className="text-center">
      <div className="text-xs font-semibold tracking-wide uppercase text-brand-100">
        {label}
      </div>
      <div className="mt-1 text-3xl font-bold tabular-nums">
        {g}
        <span className="text-base font-normal opacity-80 ml-0.5">g</span>
      </div>
      <div className="text-xs text-brand-100 tabular-nums">
        {pct.toFixed(0)}%
      </div>
    </div>
  );
}

function MacroRow({
  icon,
  label,
  grams,
  kcal,
  pct,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  grams: number;
  kcal: number;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="text-text-muted">{icon}</span>
          {label}
        </span>
        <span className="tabular-nums text-text-muted">
          <strong className="text-fg">{grams}g</strong> · {fmtNum(kcal)} kcal ·{" "}
          {pct.toFixed(0)}%
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

function DonutChart({
  slices,
}: {
  slices: { value: number; color: string; label: string }[];
}) {
  const size = 140;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  const total = slices.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--surface-muted)"
          strokeWidth={stroke}
          fill="none"
        />
        {slices.map((s, i) => {
          const dash = (s.value / total) * c;
          const seg = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={s.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${dash} ${c}`}
              strokeDashoffset={-offset}
              className="transition-all duration-500"
            />
          );
          offset += dash;
          return seg;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Sparkles className="w-5 h-5 text-brand-500" />
      </div>
    </div>
  );
}

function CustomMacroInput({
  label,
  color,
  value,
  onChange,
  suffix,
  big,
}: {
  label: string;
  color: string;
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  big?: boolean;
}) {
  return (
    <div>
      <label className={`text-xs font-semibold tracking-wide uppercase ${color} block mb-1`}>
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={0}
          step="0.5"
          className={`w-full px-3 ${
            big ? "py-3 text-2xl" : "py-2"
          } pr-12 rounded-lg border-2 border-border bg-surface focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 font-bold tabular-nums`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted font-semibold">
          {suffix}
        </span>
      </div>
    </div>
  );
}

function ConversionInfo() {
  return (
    <div className="p-5 rounded-2xl bg-surface-muted border border-border text-sm text-text-muted">
      <div className="font-semibold text-fg/80 mb-2 flex items-center gap-1.5">
        <Sparkles className="w-4 h-4" />
        Reminder konversi:
      </div>
      <ul className="space-y-1 tabular-nums">
        <li>• 1g protein = <strong className="text-rose-600">4 kcal</strong></li>
        <li>• 1g lemak = <strong className="text-amber-600">9 kcal</strong></li>
        <li>• 1g karbo = <strong className="text-brand-600">4 kcal</strong></li>
        <li>• 1g alkohol = 7 kcal (gak dihitung di tool ini)</li>
      </ul>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-12 rounded-2xl bg-surface border border-border text-center">
      <PieChart className="w-12 h-12 text-text-muted mx-auto mb-4" />
      <p className="text-text-muted">Isi nilai di kiri untuk lihat hasil.</p>
    </div>
  );
}
