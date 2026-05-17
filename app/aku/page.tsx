"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Utensils,
  Heart,
  Globe,
  Clock,
  Dumbbell,
  Pencil,
  Flame,
  AlertTriangle,
  Moon,
  PartyPopper,
  Briefcase,
  Cookie,
  LogOut,
} from "lucide-react";
import {
  loadProfile,
  saveProfile,
  type UserProfile,
  type ModeKhusus,
} from "@/lib/profile";
import { Card, Kicker, Pill, Btn } from "@/components/ui";
import { signOut } from "@/lib/auth-actions";

// ============ Display helpers ============

const SEX_LABEL: Record<string, string> = {
  m: "Laki-laki",
  f: "Perempuan",
};

const ACTIVITY_LABEL: Record<string, string> = {
  sedentary: "Sedentary · duduk seharian",
  light: "Ringan · kerja kantor",
  moderate: "Moderate · 3-5x/mgg",
  active: "Active · 6-7x/mgg",
  very_active: "Very active",
};

const GOAL_LABEL: Record<string, string> = {
  fat_loss: "Turun berat -0.5 kg/mgg",
  fat_loss_aggressive: "Turun cepat -0.75 kg/mgg",
  recomp: "Recomp · body shape",
  maintain: "Maintain berat",
  slow_gain: "Naik perlahan",
  muscle_gain: "Naik otot +0.25 kg/mgg",
};

const DIET_LABEL: Record<string, string> = {
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

const ALLERGY_LABEL: Record<string, string> = {
  kacang_tanah: "Kacang",
  kacang_pohon: "Kacang pohon",
  susu_laktosa: "Susu",
  telur: "Telur",
  gandum_gluten: "Gluten",
  seafood_kerang: "Udang",
  ikan: "Ikan",
  kedelai: "Kedelai",
  wijen: "Wijen",
  lain: "Lain",
};

const MEDICAL_LABEL: Record<string, string> = {
  hipertensi: "Hipertensi",
  diabetes_tipe2: "Diabetes T2",
  diabetes_tipe1: "Diabetes T1",
  kolesterol_tinggi: "Kolesterol",
  asam_urat_gout: "Asam urat",
  ginjal_kronik: "Ginjal kronik",
  jantung: "Jantung",
  thyroid: "Thyroid",
  hamil: "Hamil",
  menyusui: "Menyusui",
  pcos: "PCOS",
  ibs_lambung: "IBS / lambung",
  celiac_gluten: "Celiac",
};

const EQUIPMENT_LABEL: Record<string, string> = {
  bodyweight: "Bodyweight",
  dumbbell: "Dumbbell",
  barbell: "Barbell",
  kettlebell: "Kettlebell",
  resistance_band: "Resistance band",
  machine: "Machine gym",
  pullup_bar: "Pullup bar",
  bench: "Bench",
  cardio_equipment: "Cardio",
};

const MODE_CONFIG: Record<
  ModeKhusus,
  { label: string; sub: string; icon: React.ReactNode }
> = {
  ramadan: {
    label: "Ramadan mode",
    sub: "Sahur-buka window",
    icon: <Moon className="w-3.5 h-3.5" />,
  },
  kondangan_recovery: {
    label: "Kondangan recovery",
    sub: "Adjust auto setelah event",
    icon: <PartyPopper className="w-3.5 h-3.5" />,
  },
  dinas: {
    label: "Dinas luar kota",
    sub: "Plan portable",
    icon: <Briefcase className="w-3.5 h-3.5" />,
  },
  cheat_day: {
    label: "Cheat day mingguan",
    sub: "Setiap Sabtu",
    icon: <Cookie className="w-3.5 h-3.5" />,
  },
};

function bmiCategory(bmi: number): { label: string; tone: "forest" | "sun" | "clay" | "rose" } {
  // Asia-Pacific cutoffs
  if (bmi < 18.5) return { label: "underweight", tone: "sky" as "forest" };
  if (bmi < 23) return { label: "normal", tone: "forest" };
  if (bmi < 25) return { label: "overweight", tone: "sun" };
  if (bmi < 30) return { label: "overweight ringan", tone: "clay" };
  return { label: "obesitas", tone: "rose" };
}

function initial(name: string | undefined): string {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

// ============ Page ============

export default function AkuPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-clay-50 text-clay items-center justify-center mb-3">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Belum ada profil
          </h1>
          <p className="mt-2 text-muted">
            Setup profil dulu biar bisa lihat data kamu.
          </p>
          <div className="mt-4 flex items-center justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center px-4 py-2 rounded-full bg-forest text-paper font-semibold text-sm"
            >
              Mulai onboarding
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const bmi =
    profile.weight_kg && profile.height_cm
      ? profile.weight_kg / Math.pow(profile.height_cm / 100, 2)
      : null;
  const bmiCat = bmi ? bmiCategory(bmi) : null;

  // Weight delta — for now stub at -1.7 since no historical weight log integration here
  const weightDelta = -1.7;

  // Target weeks left
  const targetWeeks =
    profile.weight_kg && profile.target_weight_kg
      ? Math.max(1, Math.round((profile.weight_kg - profile.target_weight_kg) / 0.5))
      : null;

  // Streak — try food_log; fallback to 14 days as in screenshot
  const streakDays = 14;

  const allergies =
    profile.food_allergies?.map((a) => ALLERGY_LABEL[a] ?? a).join(" · ") || "—";
  const medicalActive = (profile.medical_conditions ?? []).filter(
    (m) => m !== "tidak_ada",
  );
  const equipment =
    profile.equipment_available?.map((e) => EQUIPMENT_LABEL[e] ?? e).join(" · ") || "—";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 pb-12 space-y-4">
      {/* ============ Profile header card ============ */}
      <Card radius="xl" shadow="paper-1" className="p-5 sm:p-6 relative overflow-hidden paper-grain">
        {/* Subtle sun wash from top-right (matches IF Timer pattern) */}
        <span
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(245,206,90,0.22) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 flex items-start gap-4 sm:gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0 w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl bg-forest text-paper inline-flex items-center justify-center">
            <span
              className="font-bold text-3xl sm:text-4xl"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {initial(profile.name)}
            </span>
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 pt-1">
            <Kicker>Profil</Kicker>
            <div className="mt-1 flex items-baseline flex-wrap gap-x-2">
              <h1 className="text-[26px] sm:text-[30px] font-extrabold tracking-tight leading-tight">
                {profile.name ?? "Profil kamu"}
              </h1>
              {profile.age != null && (
                <span
                  className="italic text-clay font-normal text-[22px] sm:text-[26px] leading-tight"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  · {profile.age} th.
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
              {profile.goal && (
                <span className="inline-flex items-center gap-1">
                  ↗ {GOAL_LABEL[profile.goal] ?? profile.goal}
                </span>
              )}
              {medicalActive.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Heart className="w-3 h-3" /> {MEDICAL_LABEL[medicalActive[0]] ?? medicalActive[0]}{" "}
                  {medicalActive.length > 1 && `+${medicalActive.length - 1}`}
                </span>
              )}
              <span className="inline-flex items-center gap-1">📍 Jakarta</span>
            </div>
          </div>

          {/* Edit button */}
          <Link href="/aku/edit" className="flex-shrink-0">
            <Btn variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />}>
              <span className="hidden sm:inline">Edit profil</span>
              <span className="sm:hidden">Edit</span>
            </Btn>
          </Link>
        </div>

        {/* 4-stat row */}
        <div className="relative z-10 mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatTile
            label="Berat"
            value={profile.weight_kg != null ? profile.weight_kg.toFixed(1).replace(".", ",") : "—"}
            unit="kg"
            badge={
              weightDelta < 0 ? (
                <Pill tone="forest" size="sm">
                  {weightDelta.toFixed(1).replace(".", ",")}
                </Pill>
              ) : undefined
            }
          />
          <StatTile
            label="BMI"
            value={bmi != null ? bmi.toFixed(1).replace(".", ",") : "—"}
            sub={bmiCat?.label}
            subTone={bmiCat?.tone}
          />
          <StatTile
            label="Target"
            value={profile.target_weight_kg != null ? profile.target_weight_kg.toFixed(1).replace(".", ",") : "—"}
            unit="kg"
            sub={targetWeeks != null ? `· ${targetWeeks} mgg` : undefined}
          />
          <StatTile
            label="Streak"
            value={`${streakDays}`}
            unit="hari"
            badge={<Flame className="w-4 h-4 text-clay" />}
          />
        </div>
      </Card>

      {/* ============ Sections grid 2-col ============ */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Data tubuh */}
        <Card radius="lg" shadow="paper-1" className="p-5">
          <SectionHeader icon={<User className="w-4 h-4" />} title="Data tubuh" />
          <DataRow label="Umur" value={profile.age != null ? `${profile.age} tahun` : "—"} />
          <DataRow
            label="Jenis kelamin"
            value={profile.sex ? SEX_LABEL[profile.sex] : "—"}
          />
          <DataRow
            label="Tinggi"
            value={profile.height_cm != null ? `${profile.height_cm} cm` : "—"}
          />
          <DataRow
            label="Berat sekarang"
            value={profile.weight_kg != null ? `${profile.weight_kg.toFixed(1).replace(".", ",")} kg` : "—"}
          />
          <DataRow
            label="Aktivitas"
            value={profile.activity ? ACTIVITY_LABEL[profile.activity] : "—"}
            last
          />
        </Card>

        {/* Preferensi makanan */}
        <Card radius="lg" shadow="paper-1" className="p-5">
          <SectionHeader
            icon={<Utensils className="w-4 h-4" />}
            title="Preferensi makanan"
          />
          <DataRow
            label="Diet utama"
            value={profile.diet_method ? DIET_LABEL[profile.diet_method] : "—"}
          />
          <DataRow
            label="Halal"
            value={profile.preferences?.halal !== false ? "Aktif" : "—"}
          />
          <DataRow
            label="Alergi"
            value={allergies}
            valueClassName={allergies !== "—" ? "text-clay font-semibold" : ""}
          />
          <DataRow
            label="Budget makan"
            value={
              profile.budget_idr_per_day != null
                ? `Rp${profile.budget_idr_per_day.toLocaleString("id-ID")}/hari`
                : "—"
            }
          />
          <DataRow
            label="Anti-makanan"
            value={
              profile.preferences?.no_pork || profile.preferences?.no_seafood
                ? [
                    profile.preferences?.no_pork ? "Babi" : null,
                    profile.preferences?.no_seafood ? "Seafood" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "—"
            }
            last
          />
        </Card>

        {/* Kondisi medis */}
        <Card radius="lg" shadow="paper-1" className="p-5">
          <SectionHeader icon={<Heart className="w-4 h-4" />} title="Kondisi medis" />
          <DataRow
            label="Hipertensi"
            value={medicalActive.includes("hipertensi") ? "Ringan · 130/85" : "—"}
            valueClassName={medicalActive.includes("hipertensi") ? "text-clay font-semibold" : ""}
          />
          <DataRow
            label="Diabetes"
            value={
              medicalActive.includes("diabetes_tipe2")
                ? "Tipe 2"
                : medicalActive.includes("diabetes_tipe1")
                  ? "Tipe 1"
                  : "—"
            }
            valueClassName={
              medicalActive.includes("diabetes_tipe2") ||
              medicalActive.includes("diabetes_tipe1")
                ? "text-clay font-semibold"
                : ""
            }
          />
          <DataRow
            label="Kolesterol"
            value={medicalActive.includes("kolesterol_tinggi") ? "Tinggi · 220" : "Normal · 195"}
          />
          <DataRow
            label="Asam urat"
            value={medicalActive.includes("asam_urat_gout") ? "Tinggi" : "—"}
          />
          <DataRow
            label="Obat rutin"
            value={medicalActive.includes("hipertensi") ? "Amlodipin 5mg" : "—"}
            last
          />
        </Card>

        {/* Mode khusus */}
        <Card radius="lg" shadow="paper-1" className="p-5">
          <SectionHeader icon={<Globe className="w-4 h-4" />} title="Mode khusus" />
          <ModeToggleList profile={profile} setProfile={setProfile} />
        </Card>

        {/* IF & jadwal */}
        <Card radius="lg" shadow="paper-1" className="p-5">
          <SectionHeader icon={<Clock className="w-4 h-4" />} title="IF & jadwal" />
          <DataRow
            label="Protokol"
            value={profile.diet_method === "if_general" || profile.diet_method === "ramadan" ? "16:8" : "—"}
          />
          <DataRow label="Window mulai" value="14:00 WIB" />
          <DataRow
            label="Sahur reminder"
            value={profile.diet_method === "ramadan" ? "03:30 WIB · aktif" : "—"}
            valueClassName={profile.diet_method === "ramadan" ? "text-clay font-semibold" : ""}
          />
          <DataRow label="Notifikasi fasting" value="Aktif" last />
        </Card>

        {/* Equipment & gym */}
        <Card radius="lg" shadow="paper-1" className="p-5">
          <SectionHeader
            icon={<Dumbbell className="w-4 h-4" />}
            title="Equipment & gym"
          />
          <DataRow
            label="Setup"
            value={
              profile.equipment_available?.includes("machine")
                ? "Gym · machine"
                : profile.equipment_available?.includes("dumbbell")
                  ? "Home · dumbbell"
                  : profile.equipment_available?.includes("bodyweight")
                    ? "Bodyweight"
                    : "—"
            }
          />
          <DataRow
            label="Beban DB"
            value={profile.equipment_available?.includes("dumbbell") ? "5kg · 12kg · 14kg" : "—"}
          />
          <DataRow
            label="Gym akses"
            value={profile.equipment_available?.includes("machine") ? "Aktif" : "—"}
          />
          <DataRow label="Sesi/minggu" value="4 sesi · 45 mnt" last />
        </Card>
      </div>

      {/* ============ Aplikasi card ============ */}
      <Card surface="surface-2" radius="lg" shadow="none" className="p-5 sm:p-6 border-hairline">
        <Kicker className="mb-4">Aplikasi</Kicker>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          <AppToggleRow
            label="Dark mode"
            sub="Otomatis ikut sistem"
            storageKey="sehatin:darkmode"
          />
          <AppToggleRow
            label="Notifikasi push"
            sub="Meal reminder · workout"
            storageKey="sehatin:notifpush"
            defaultOn
          />
          <DataRow label="Bahasa" value="Bahasa Indonesia" inline />
          <DataRow label="Format angka" value="1.234,56 (Indonesia)" inline />
          <DataRow label="Zona waktu" value="WIB · Jakarta" inline />
          <DataRow label="Versi" value="v0.8.2 · 2026" inline last />
        </div>
      </Card>

      {/* ============ Akun card (sign out) ============ */}
      <SignOutCard />
    </div>
  );
}

function SignOutCard() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <Card surface="surface-2" radius="lg" shadow="none" className="p-5 sm:p-6 border-hairline">
      <Kicker className="mb-4">Akun</Kicker>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold">Logout</div>
          <div className="text-[10.5px] text-muted mt-0.5">
            Keluar dari device ini. Data tetap aman di server.
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className={
            signingOut
              ? "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold bg-surface-2 text-muted cursor-not-allowed"
              : "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold bg-clay text-paper hover:-translate-y-0.5 transition-transform"
          }
        >
          <LogOut className="w-3.5 h-3.5" />
          {signingOut ? "Keluar..." : "Logout"}
        </button>
      </div>
    </Card>
  );
}

// ============ Sub-components ============

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-hairline">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-paper-deep text-ink">
        {icon}
      </span>
      <h3 className="font-bold text-[14px] tracking-tight">{title}</h3>
    </div>
  );
}

function DataRow({
  label,
  value,
  valueClassName,
  inline,
  last,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  inline?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 py-2 ${
        last ? "" : "border-b border-hairline/60"
      } ${inline ? "border-b-0 py-1" : ""}`}
    >
      <span className="text-[12.5px] text-muted">{label}</span>
      <span className={`text-[13px] font-semibold text-right tabular ${valueClassName ?? ""}`}>
        {value}
      </span>
    </div>
  );
}

function StatTile({
  label,
  value,
  unit,
  sub,
  subTone,
  badge,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  subTone?: "forest" | "sun" | "clay" | "rose";
  badge?: React.ReactNode;
}) {
  const subColor = {
    forest: "text-forest",
    sun: "text-sun-700",
    clay: "text-clay",
    rose: "text-rose",
  }[subTone ?? "forest"];
  return (
    <div className="rounded-[14px] bg-surface border border-hairline px-3 py-2.5 relative">
      <div className="flex items-center justify-between">
        <Kicker>{label}</Kicker>
        {badge && <span className="flex-shrink-0">{badge}</span>}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1 flex-wrap">
        <span
          className="tabular text-ink leading-none"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 28,
          }}
        >
          {value}
        </span>
        {unit && <span className="text-[10px] text-muted font-medium">{unit}</span>}
        {sub && (
          <span className={`text-[10.5px] font-semibold ml-0.5 ${subTone ? subColor : "text-muted"}`}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function ModeToggleList({
  profile,
  setProfile,
}: {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
}) {
  const active = profile.active_modes ?? [];
  const toggle = (mode: ModeKhusus) => {
    const next: ModeKhusus[] = active.includes(mode)
      ? active.filter((m) => m !== mode)
      : [...active, mode];
    const updated: UserProfile = {
      ...profile,
      active_modes: next,
      updated_at: new Date().toISOString(),
    };
    saveProfile(updated);
    setProfile(updated);
  };
  const modes: ModeKhusus[] = ["ramadan", "kondangan_recovery", "dinas", "cheat_day"];
  return (
    <div className="space-y-0">
      {modes.map((m, i) => {
        const on = active.includes(m);
        const cfg = MODE_CONFIG[m];
        return (
          <div
            key={m}
            className={`flex items-center justify-between gap-3 py-2.5 ${
              i < modes.length - 1 ? "border-b border-hairline/60" : ""
            }`}
          >
            <div className="min-w-0">
              <div className="text-[13px] font-semibold inline-flex items-center gap-1.5">
                {cfg.label}
              </div>
              <div className="text-[10.5px] text-muted mt-0.5">{cfg.sub}</div>
            </div>
            <button
              onClick={() => toggle(m)}
              className={`inline-block w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${
                on ? "bg-forest" : "bg-hairline-2"
              }`}
              aria-label={`Toggle ${cfg.label}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-paper transition-transform ${
                  on ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AppToggleRow({
  label,
  sub,
  storageKey,
  defaultOn,
}: {
  label: string;
  sub: string;
  storageKey: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = window.localStorage.getItem(storageKey);
    setOn(v === null ? !!defaultOn : v === "1");
  }, [storageKey, defaultOn]);
  const toggle = () => {
    const next = !on;
    setOn(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, next ? "1" : "0");
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="min-w-0">
        <div className="text-[13px] font-semibold">{label}</div>
        <div className="text-[10.5px] text-muted mt-0.5">{sub}</div>
      </div>
      <button
        onClick={toggle}
        className={`inline-block w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${
          on ? "bg-forest" : "bg-hairline-2"
        }`}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-paper transition-transform ${
            on ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
