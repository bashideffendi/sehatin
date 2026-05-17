"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Settings,
  User,
  Salad,
  Heart,
  Dumbbell,
  Database,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  loadProfile,
  saveProfile,
  PROFILE_KEY,
  type UserProfile,
  type MedicalCondition,
  type FoodAllergy,
  type TargetZone,
  type SleepDuration,
} from "@/lib/profile";
import type { Sex, ActivityLevel, Goal } from "@/src/nutrition/tdee";
import type { DietMethod } from "@/src/nutrition/diet-methods";
import type { Equipment } from "@/src/fitness/exercises";
import { cn } from "@/lib/utils";
import { Kicker } from "@/components/ui";
import { PlusCard } from "@/components/plus-card";
import { ModeKhususCard } from "@/components/mode-khusus-card";

// ============ Option labels ============

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "m", label: "Pria" },
  { value: "f", label: "Wanita" },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; sub: string }[] =
  [
    { value: "sedentary", label: "Sedentary", sub: "Duduk seharian" },
    { value: "light", label: "Light", sub: "1-3x/minggu" },
    { value: "moderate", label: "Moderate", sub: "3-5x/minggu" },
    { value: "active", label: "Active", sub: "6-7x/minggu" },
    {
      value: "very_active",
      label: "Very active",
      sub: "Fisik + latihan keras",
    },
  ];

const GOAL_OPTIONS: { value: Goal; label: string; sub: string }[] = [
  { value: "fat_loss", label: "Fat loss", sub: "Defisit -20%" },
  { value: "fat_loss_aggressive", label: "Fat loss agresif", sub: "-25%" },
  { value: "recomp", label: "Recomp", sub: "-10%, body recomp" },
  { value: "maintain", label: "Maintain", sub: "Pertahankan" },
  { value: "slow_gain", label: "Slow gain", sub: "+10%, lean bulk" },
  { value: "muscle_gain", label: "Muscle gain", sub: "+15%" },
];

const DIET_OPTIONS: { value: DietMethod; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "keto", label: "Keto" },
  { value: "low_carb", label: "Low carb" },
  { value: "high_protein", label: "High protein" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "dash", label: "DASH" },
  { value: "plant_based", label: "Plant-based" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "low_gi", label: "Low GI" },
  { value: "low_purine", label: "Low purine" },
  { value: "ramadan", label: "Ramadan" },
  { value: "if_general", label: "IF 16:8" },
];

const MEDICAL_OPTIONS: { value: MedicalCondition; label: string }[] = [
  { value: "tidak_ada", label: "Tidak ada" },
  { value: "hipertensi", label: "Hipertensi" },
  { value: "diabetes_tipe2", label: "Diabetes T2" },
  { value: "diabetes_tipe1", label: "Diabetes T1" },
  { value: "kolesterol_tinggi", label: "Kolesterol tinggi" },
  { value: "asam_urat_gout", label: "Asam urat" },
  { value: "ginjal_kronik", label: "Ginjal kronik" },
  { value: "jantung", label: "Jantung" },
  { value: "thyroid", label: "Thyroid" },
  { value: "hamil", label: "Hamil" },
  { value: "menyusui", label: "Menyusui" },
  { value: "pcos", label: "PCOS" },
  { value: "ibs_lambung", label: "IBS / lambung" },
  { value: "celiac_gluten", label: "Celiac / gluten" },
];

const ALLERGY_OPTIONS: { value: FoodAllergy; label: string }[] = [
  { value: "kacang_tanah", label: "Kacang tanah" },
  { value: "kacang_pohon", label: "Kacang pohon" },
  { value: "susu_laktosa", label: "Susu / laktosa" },
  { value: "telur", label: "Telur" },
  { value: "gandum_gluten", label: "Gandum / gluten" },
  { value: "seafood_kerang", label: "Seafood / kerang" },
  { value: "ikan", label: "Ikan" },
  { value: "kedelai", label: "Kedelai" },
  { value: "wijen", label: "Wijen" },
  { value: "lain", label: "Lain" },
];

const ZONE_OPTIONS: { value: TargetZone; label: string }[] = [
  { value: "perut", label: "Perut" },
  { value: "dada", label: "Dada" },
  { value: "lengan", label: "Lengan" },
  { value: "punggung", label: "Punggung" },
  { value: "paha", label: "Paha" },
  { value: "bokong", label: "Bokong" },
  { value: "betis", label: "Betis" },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: "bodyweight", label: "Bodyweight" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "barbell", label: "Barbell" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "resistance_band", label: "Resistance band" },
  { value: "machine", label: "Machine gym" },
  { value: "pullup_bar", label: "Pullup bar" },
  { value: "bench", label: "Bench" },
  { value: "cardio_equipment", label: "Cardio (treadmill/stationary)" },
];

const SLEEP_OPTIONS: { value: SleepDuration; label: string }[] = [
  { value: "lt5", label: "<5 jam" },
  { value: "5_6", label: "5-6 jam" },
  { value: "7_8", label: "7-8 jam" },
  { value: "gt8", label: ">8 jam" },
];

// All localStorage keys managed by the app — used for export + clear
const STORAGE_KEYS = [
  "sehatin:profile:v2",
  "sehatin:food_log:v1",
  "sehatin:weight_log:v1",
  "sehatin:meal_plan:v1",
  "sehatin:workout_plan:v1",
  "sehatin:workout_log:v1",
] as const;

// ============ Page ============

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const update = useCallback(
    (patch: Partial<UserProfile>) => {
      setProfile((cur) => {
        if (!cur) return cur;
        const next: UserProfile = {
          ...cur,
          ...patch,
          updated_at: new Date().toISOString(),
        };
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setSaving(true);
        debounceRef.current = setTimeout(() => {
          saveProfile(next);
          setSaving(false);
          setSavedAt(Date.now());
        }, 400);
        return next;
      });
    },
    [],
  );

  const updatePreferences = useCallback(
    (patch: Partial<NonNullable<UserProfile["preferences"]>>) => {
      setProfile((cur) => {
        if (!cur) return cur;
        const next: UserProfile = {
          ...cur,
          preferences: { ...(cur.preferences ?? {}), ...patch },
          updated_at: new Date().toISOString(),
        };
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setSaving(true);
        debounceRef.current = setTimeout(() => {
          saveProfile(next);
          setSaving(false);
          setSavedAt(Date.now());
        }, 400);
        return next;
      });
    },
    [],
  );

  const handleExport = useCallback(() => {
    if (typeof window === "undefined") return;
    const dump: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      app: "sehatin",
    };
    for (const key of STORAGE_KEYS) {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) dump[key] = JSON.parse(raw);
      } catch {
        /* skip corrupted entry */
      }
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sehatin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(() => {
    if (typeof window === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as Record<string, unknown>;
        const keysToImport = STORAGE_KEYS.filter((k) => k in data);
        if (keysToImport.length === 0) {
          alert(
            "File ini bukan backup Sehatin (gak ada key Sehatin yang dikenali). Pastikan file yang dipilih hasil Export dari /settings.",
          );
          return;
        }
        const labels = keysToImport
          .map((k) => "  • " + k.replace("sehatin:", "").replace(/:v\d+$/, ""))
          .join("\n");
        const confirmed = window.confirm(
          `Import ${keysToImport.length} jenis data dari backup? Data yang ada sekarang bakal di-overwrite.\n\nYang bakal di-import:\n${labels}`,
        );
        if (!confirmed) return;
        for (const key of keysToImport) {
          const value = data[key];
          if (value !== null && typeof value === "object") {
            window.localStorage.setItem(key, JSON.stringify(value));
          }
        }
        setProfile(loadProfile());
        alert(
          `${keysToImport.length} jenis data berhasil di-import. Halaman bakal reload buat sinkronin tampilan.`,
        );
        window.location.reload();
      } catch (err) {
        alert(`Gagal baca file: ${(err as Error).message}`);
      }
    };
    input.click();
  }, []);

  const handleClearAll = useCallback(() => {
    const confirmed = window.confirm(
      "Hapus SEMUA data Sehatin (profile + catatan harian + weight log + plan + workout log)? Aksi gak bisa di-undo.",
    );
    if (!confirmed) return;
    const reconfirm = window.prompt(
      "Ketik 'HAPUS' (huruf besar) untuk konfirmasi.",
    );
    if (reconfirm !== "HAPUS") return;
    for (const key of STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
    setProfile(null);
    window.location.href = "/";
  }, []);

  const handleResetProfile = useCallback(() => {
    if (
      !window.confirm(
        "Reset profil ke kosong dan ulang quiz onboarding? Catatan harian, plan, dan workout tetep aman.",
      )
    )
      return;
    window.localStorage.removeItem(PROFILE_KEY);
    window.location.href = "/onboarding";
  }, []);

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 items-center justify-center mb-3">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Belum ada profil
          </h1>
          <p className="mt-2 text-text-muted">
            Setup profil dulu via onboarding biar bisa ke settings.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white font-semibold text-sm"
          >
            Mulai onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 pb-12">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <Link
            href="/aku"
            className="text-[11px] font-semibold text-muted hover:text-ink inline-flex items-center gap-1 mb-2"
          >
            ← Kembali ke profil
          </Link>
          <Kicker>Edit profil</Kicker>
          <h1 className="mt-2 text-3xl sm:text-[40px] font-extrabold tracking-tight leading-[1.05]">
            Ubah{" "}
            <span
              className="font-normal italic text-forest"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              data kamu.
            </span>
          </h1>
        </div>
        <SaveIndicator saving={saving} savedAt={savedAt} />
      </div>

      {/* Mode khusus + Plus tier — sticky context cards at top */}
      <div className="space-y-4 mb-6">
        <ModeKhususCard />
        <PlusCard />
      </div>

      {/* Section: Profil dasar */}
      <Section icon={<User className="w-4 h-4" />} title="Profil dasar">
        <Row label="Jenis kelamin">
          <ChipGrid
            value={profile.sex}
            options={SEX_OPTIONS}
            onChange={(v) => update({ sex: v })}
            columns={2}
          />
        </Row>
        <Row label="Umur">
          <NumberField
            value={profile.age}
            onChange={(v) => update({ age: v })}
            min={10}
            max={100}
            suffix="thn"
          />
        </Row>
        <Row label="Berat badan">
          <NumberField
            value={profile.weight_kg}
            onChange={(v) => update({ weight_kg: v })}
            min={20}
            max={300}
            step={0.1}
            suffix="kg"
          />
        </Row>
        <Row label="Berat target">
          <NumberField
            value={profile.target_weight_kg}
            onChange={(v) => update({ target_weight_kg: v })}
            min={20}
            max={300}
            step={0.1}
            suffix="kg"
            optional
          />
        </Row>
        <Row label="Tinggi badan">
          <NumberField
            value={profile.height_cm}
            onChange={(v) => update({ height_cm: v })}
            min={100}
            max={250}
            suffix="cm"
          />
        </Row>
        <Row label="Tingkat aktivitas">
          <ChipGridSub
            value={profile.activity}
            options={ACTIVITY_OPTIONS}
            onChange={(v) => update({ activity: v })}
          />
        </Row>
        <Row label="Goal">
          <ChipGridSub
            value={profile.goal}
            options={GOAL_OPTIONS}
            onChange={(v) => update({ goal: v })}
          />
        </Row>
      </Section>

      {/* Section: Diet & makanan */}
      <Section icon={<Salad className="w-4 h-4" />} title="Diet & makanan">
        <Row label="Metode diet">
          <ChipGrid
            value={profile.diet_method}
            options={DIET_OPTIONS}
            onChange={(v) => update({ diet_method: v })}
          />
        </Row>
        <Row label="Budget makan/hari">
          <NumberField
            value={profile.budget_idr_per_day}
            onChange={(v) => update({ budget_idr_per_day: v })}
            min={5000}
            max={1000000}
            step={5000}
            suffix="Rp"
            optional
          />
        </Row>
        <Row label="Preferensi">
          <div className="flex flex-wrap gap-2">
            <ToggleChip
              label="Halal"
              on={profile.preferences?.halal !== false}
              onToggle={() =>
                updatePreferences({
                  halal: !(profile.preferences?.halal !== false),
                })
              }
            />
            <ToggleChip
              label="Vegetarian"
              on={profile.preferences?.vegetarian === true}
              onToggle={() =>
                updatePreferences({
                  vegetarian: !(profile.preferences?.vegetarian === true),
                })
              }
            />
            <ToggleChip
              label="No babi"
              on={profile.preferences?.no_pork === true}
              onToggle={() =>
                updatePreferences({
                  no_pork: !(profile.preferences?.no_pork === true),
                })
              }
            />
            <ToggleChip
              label="No seafood"
              on={profile.preferences?.no_seafood === true}
              onToggle={() =>
                updatePreferences({
                  no_seafood: !(profile.preferences?.no_seafood === true),
                })
              }
            />
          </div>
        </Row>
      </Section>

      {/* Section: Kesehatan */}
      <Section icon={<Heart className="w-4 h-4" />} title="Kesehatan">
        <Row
          label="Kondisi medis"
          hint="Hard exclude untuk plan & workout. 'Tidak ada' = aman."
        >
          <ChipGridMulti
            value={profile.medical_conditions ?? []}
            options={MEDICAL_OPTIONS}
            onChange={(v) => {
              // "tidak_ada" is exclusive
              if (v.includes("tidak_ada") && v.length > 1) {
                const last = v[v.length - 1];
                update({
                  medical_conditions:
                    last === "tidak_ada" ? ["tidak_ada"] : v.filter((c) => c !== "tidak_ada"),
                });
              } else {
                update({ medical_conditions: v });
              }
            }}
          />
        </Row>
        <Row label="Alergi makanan">
          <ChipGridMulti
            value={profile.food_allergies ?? []}
            options={ALLERGY_OPTIONS}
            onChange={(v) => update({ food_allergies: v })}
          />
        </Row>
        <Row label="Alergi lain (free text)">
          <TextField
            value={profile.allergies_other ?? ""}
            onChange={(v) => update({ allergies_other: v || undefined })}
            placeholder="contoh: udang kering, MSG, dll"
          />
        </Row>
      </Section>

      {/* Section: Body & latihan */}
      <Section icon={<Dumbbell className="w-4 h-4" />} title="Body & latihan">
        <Row label="Target zone (workout)">
          <ChipGridMulti
            value={profile.target_zones ?? []}
            options={ZONE_OPTIONS}
            onChange={(v) => update({ target_zones: v })}
          />
        </Row>
        <Row label="Equipment tersedia">
          <ChipGridMulti
            value={profile.equipment_available ?? []}
            options={EQUIPMENT_OPTIONS}
            onChange={(v) => update({ equipment_available: v })}
          />
        </Row>
        <Row label="Durasi tidur">
          <ChipGrid
            value={profile.sleep_duration}
            options={SLEEP_OPTIONS}
            onChange={(v) => update({ sleep_duration: v })}
            columns={4}
          />
        </Row>
      </Section>

      {/* Section: Data & privacy */}
      <Section
        icon={<Database className="w-4 h-4" />}
        title="Data & privacy"
        tone="muted"
      >
        <p className="text-xs text-text-muted leading-relaxed -mt-1">
          Semua data Sehatin disimpan di browser kamu (localStorage), gak ada
          server. Bisa backup, restore, atau hapus total kapan aja.
        </p>
        <div className="grid sm:grid-cols-2 gap-2 mt-3">
          <button
            onClick={handleExport}
            className="px-4 py-3 rounded-xl border border-border hover:border-brand-300 hover:bg-brand-50/40 dark:hover:bg-brand-500/10 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-3 rounded-xl border border-border hover:border-sky-300 hover:bg-sky-50/40 dark:hover:bg-sky-500/10 text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" /> Import JSON
          </button>
        </div>
        <p className="text-[11px] text-text-muted mt-1.5 leading-relaxed">
          Import bakal overwrite data yang ada (profile, catatan harian, plan,
          dst). Berguna buat pindah browser atau restore backup.
        </p>
        <button
          onClick={handleResetProfile}
          className="mt-3 w-full px-4 py-3 rounded-xl border border-border hover:border-amber-300 hover:bg-amber-50/40 dark:hover:bg-amber-500/10 text-sm font-semibold inline-flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Ulang onboarding (cuma reset profil)
        </button>
        <button
          onClick={handleClearAll}
          className="mt-2 w-full px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-sm font-semibold inline-flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Hapus semua data
        </button>
      </Section>
    </div>
  );
}

// ============ Sub components ============

function SaveIndicator({
  saving,
  savedAt,
}: {
  saving: boolean;
  savedAt: number | null;
}) {
  if (saving) {
    return (
      <span className="text-xs text-text-muted inline-flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        Menyimpan...
      </span>
    );
  }
  if (savedAt) {
    return (
      <span className="text-xs text-brand-600 dark:text-brand-400 inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Tersimpan
      </span>
    );
  }
  return null;
}

function Section({
  icon,
  title,
  children,
  tone = "default",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  tone?: "default" | "muted";
}) {
  return (
    <section
      className={cn(
        "mb-4 p-4 sm:p-5 rounded-2xl border border-border",
        tone === "muted" ? "bg-surface-muted/40" : "bg-surface",
      )}
    >
      <h2 className="font-bold mb-3 inline-flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide">
        <span className="text-brand-600">{icon}</span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold tracking-wide uppercase text-text-muted block mb-1.5">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] text-text-muted mt-1.5 leading-snug">{hint}</p>
      )}
    </div>
  );
}

function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  optional,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  optional?: boolean;
}) {
  return (
    <div className="relative max-w-xs">
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            if (optional) onChange(undefined);
            return;
          }
          const parsed = Number.parseFloat(raw);
          if (Number.isFinite(parsed)) onChange(parsed);
        }}
        min={min}
        max={max}
        step={step}
        placeholder={optional ? "(opsional)" : "-"}
        className="w-full px-3 py-2.5 pr-12 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 tabular-nums font-semibold"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-semibold">
          {suffix}
        </span>
      )}
    </div>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-surface focus:outline-none focus:border-brand-500 text-sm"
    />
  );
}

function ChipGrid<T extends string>({
  value,
  options,
  onChange,
  columns,
}: {
  value: T | undefined;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5",
        columns === 2
          ? "grid-cols-2"
          : columns === 4
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-colors",
            value === o.value
              ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
              : "border-border hover:border-fg/20",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ChipGridSub<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | undefined;
  options: { value: T; label: string; sub: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-2 rounded-xl border-2 text-left transition-colors",
            value === o.value
              ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
              : "border-border hover:border-fg/20",
          )}
        >
          <div className="text-sm font-semibold">{o.label}</div>
          <div className="text-[10px] text-text-muted">{o.sub}</div>
        </button>
      ))}
    </div>
  );
}

function ChipGridMulti<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T[];
  options: { value: T; label: string }[];
  onChange: (v: T[]) => void;
}) {
  const toggle = (v: T) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <ToggleChip
          key={o.value}
          label={o.label}
          on={value.includes(o.value)}
          onToggle={() => toggle(o.value)}
        />
      ))}
    </div>
  );
}

function ToggleChip({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-colors",
        on
          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
          : "border-border hover:border-fg/20 text-text-muted",
      )}
    >
      {label}
    </button>
  );
}
